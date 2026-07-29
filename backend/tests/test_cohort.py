import json
from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from cohort import Settings
from main import create_app


NOW = datetime(2026, 1, 10, 12, tzinfo=UTC)


@pytest.fixture
def configured_client(tmp_path: Path) -> tuple[TestClient, Path, Path]:
    data_path = tmp_path / "mortgages.csv"
    data_path.write_text(
        "consumer_id,firm,last_email_at,last_session_at,has_open_mortgage,product_type\n"
        "c1,lender_a,2026-01-01T00:00:00Z,,true,fixed\n"
        "c2,lender_a,2026-01-09T00:00:00Z,,true,fixed\n"
        "c3,lender_a,,,true,tracker\n"
        "c4,lender_a,2026-01-01T00:00:00Z,2026-01-08T00:00:00Z,true,fixed\n"
        "c5,lender_a,2026-01-01T00:00:00Z,,false,fixed\n"
        "c6,lender_b,2026-01-01T00:00:00Z,,true,fixed\n"
        "c7,lender_a,2026-01-01T00:00:00Z,,true,unknown\n",
        encoding="utf-8",
    )
    firms_path = tmp_path / "firms.json"
    firms_path.write_text(
        '{"allowed_firms":["lender_a","lender_empty"]}', encoding="utf-8"
    )
    mappings_path = tmp_path / "product_mappings.json"
    mappings_path.write_text(
        '{"fixed":"Residential Fixed","tracker":"Tracker"}', encoding="utf-8"
    )
    audit_path = tmp_path / "queries.log"
    settings = Settings(
        data_path=data_path,
        firms_path=firms_path,
        product_mappings_path=mappings_path,
        audit_log_path=audit_path,
    )
    return TestClient(create_app(settings, clock=lambda: NOW)), mappings_path, audit_path


def test_cohort_applies_defaults_and_returns_product_coverage(configured_client):
    client, _, audit_path = configured_client

    response = client.get("/cohort", params={"firm": "lender_a"})

    assert response.status_code == 200
    assert response.json() == {
        "count": 4,
        "consumer_ids": ["c1", "c3", "c4", "c7"],
        "consumer_previews": [
            {
                "consumer_id": "c1",
                "last_session_at": None,
                "product_type_canonical": "Residential Fixed",
            },
            {
                "consumer_id": "c3",
                "last_session_at": None,
                "product_type_canonical": "Tracker",
            },
            {
                "consumer_id": "c4",
                "last_session_at": "2026-01-08T00:00:00Z",
                "product_type_canonical": "Residential Fixed",
            },
            {
                "consumer_id": "c7",
                "last_session_at": None,
                "product_type_canonical": None,
            },
        ],
        "cumulative_view_threshold": 5,
        "filters_applied": {
            "firm": "lender_a",
            "days_since_last_email": 3,
            "no_session_since": None,
            "has_open_mortgage": True,
        },
        "queried_at": "2026-01-10T12:00:00Z",
        "product_type_summary": {"Residential Fixed": 2, "Tracker": 1},
        "unmapped_product_types": ["unknown"],
    }
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    assert audit["firm"] == "lender_a"
    assert audit["result_count"] == 4
    assert audit["filters"]["days_since_last_email"] == 3


def test_firm_suggestions_are_sorted_and_come_from_access_configuration(
    configured_client,
):
    client, _, _ = configured_client

    response = client.get("/firms")

    assert response.status_code == 200
    assert response.json() == {"firms": ["lender_a", "lender_empty"]}


def test_cumulative_view_threshold_is_loaded_from_environment(monkeypatch):
    monkeypatch.setenv("CUMULATIVE_VIEW_THRESHOLD", "9")

    settings = Settings.from_environment()

    assert settings.cumulative_view_threshold == 9


@pytest.mark.parametrize("configured_value", ["-1", "not-a-number"])
def test_invalid_cumulative_view_threshold_prevents_startup(
    monkeypatch,
    configured_value,
):
    monkeypatch.setenv("CUMULATIVE_VIEW_THRESHOLD", configured_value)

    with pytest.raises(HTTPException) as raised:
        Settings.from_environment()

    assert raised.value.status_code == 500
    assert raised.value.detail == (
        "CUMULATIVE_VIEW_THRESHOLD must be a non-negative integer"
    )


def test_local_frontend_origin_is_allowed_by_cors(configured_client):
    client, _, _ = configured_client

    response = client.get(
        "/firms",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:5173"
    )


def test_audit_log_is_json_lines_with_firms_timestamps_and_per_query_counts(
    configured_client,
):
    client, _, audit_path = configured_client

    client.get("/cohort", params={"firm": "lender_a"})
    client.get("/cohort", params={"firm": "lender_empty"})
    client.get("/cohort", params={"firm": "lender_a"})

    records = [
        json.loads(line)
        for line in audit_path.read_text(encoding="utf-8").splitlines()
    ]

    assert [record["firm"] for record in records] == [
        "lender_a",
        "lender_empty",
        "lender_a",
    ]
    assert [record["result_count"] for record in records] == [4, 0, 4]
    assert {record["queried_at"] for record in records} == {
        "2026-01-10T12:00:00+00:00"
    }

    # These are the only fields needed to select a 24-hour window, order firms
    # by query frequency, and retain the result count of every individual query.
    frequency = {}
    for record in records:
        frequency[record["firm"]] = frequency.get(record["firm"], 0) + 1
    assert sorted(frequency.items(), key=lambda item: (-item[1], item[0])) == [
        ("lender_a", 2),
        ("lender_empty", 1),
    ]


def test_optional_filters_include_consumers_with_no_session(configured_client):
    client, _, _ = configured_client

    response = client.get(
        "/cohort",
        params={
            "firm": "lender_a",
            "no_session_since": "2026-01-07T00:00:00Z",
        },
    )

    assert response.status_code == 200
    assert response.json()["consumer_ids"] == ["c1", "c3", "c7"]
    assert response.json()["filters_applied"] == {
        "firm": "lender_a",
        "days_since_last_email": 3,
        "no_session_since": "2026-01-07T00:00:00Z",
        "has_open_mortgage": True,
    }

    closed_only = client.get(
        "/cohort",
        params={
            "firm": "lender_a",
            "days_since_last_email": 0,
            "has_open_mortgage": "false",
        },
    )
    assert closed_only.status_code == 200
    assert closed_only.json()["consumer_ids"] == ["c5"]


def test_product_mapping_changes_apply_without_restart(configured_client):
    client, mappings_path, _ = configured_client
    assert client.get("/cohort", params={"firm": "lender_a"}).json()[
        "product_type_summary"
    ]["Residential Fixed"] == 2

    mappings_path.write_text(
        '{"fixed":"New Fixed Category","tracker":"Tracker","unknown":"Other"}',
        encoding="utf-8",
    )
    changed = client.get("/cohort", params={"firm": "lender_a"}).json()

    assert changed["product_type_summary"] == {
        "New Fixed Category": 2,
        "Other": 1,
        "Tracker": 1,
    }
    assert changed["consumer_previews"][0]["product_type_canonical"] == (
        "New Fixed Category"
    )
    assert changed["consumer_previews"][-1]["product_type_canonical"] == "Other"
    assert changed["unmapped_product_types"] == []


def test_product_aliases_are_aggregated_into_their_canonical_category(
    configured_client,
):
    client, mappings_path, _ = configured_client
    mappings_path.write_text(
        '{"fixed":"Residential","tracker":"Residential"}',
        encoding="utf-8",
    )

    response = client.get("/cohort", params={"firm": "lender_a"})

    assert response.status_code == 200
    assert response.json()["product_type_summary"] == {"Residential": 3}
    assert response.json()["unmapped_product_types"] == ["unknown"]


def test_disallowed_firm_and_malformed_parameters_are_specific(configured_client):
    client, _, _ = configured_client

    forbidden = client.get("/cohort", params={"firm": "lender_b"})
    malformed = client.get(
        "/cohort",
        params={"firm": "lender_a", "days_since_last_email": -1},
    )

    assert forbidden.status_code == 403
    assert forbidden.json() == {"detail": "Firm 'lender_b' is not allowed"}
    assert malformed.status_code == 422


def test_firm_allowlist_is_loaded_once_at_startup(configured_client, tmp_path: Path):
    client, _, _ = configured_client

    (tmp_path / "firms.json").write_text(
        '{"allowed_firms":["lender_b"]}',
        encoding="utf-8",
    )

    still_allowed = client.get("/cohort", params={"firm": "lender_a"})
    still_forbidden = client.get("/cohort", params={"firm": "lender_b"})

    assert still_allowed.status_code == 200
    assert still_forbidden.status_code == 403


def test_invalid_firm_allowlist_prevents_startup(tmp_path: Path):
    firms_path = tmp_path / "firms.json"
    firms_path.write_text("[]", encoding="utf-8")
    settings = Settings(
        data_path=tmp_path / "mortgages.csv",
        firms_path=firms_path,
        product_mappings_path=tmp_path / "product_mappings.json",
        audit_log_path=tmp_path / "audit.jsonl",
    )

    with pytest.raises(HTTPException) as raised:
        create_app(settings)

    assert raised.value.status_code == 500
    assert raised.value.detail == "Firm access configuration must be a JSON object"


def test_empty_cohort_and_invalid_runtime_mapping(configured_client):
    client, mappings_path, _ = configured_client

    empty = client.get("/cohort", params={"firm": "lender_empty"})
    assert empty.status_code == 200
    assert empty.json()["count"] == 0
    assert empty.json()["consumer_ids"] == []
    assert empty.json()["consumer_previews"] == []
    assert empty.json()["product_type_summary"] == {}

    mappings_path.write_text("[]", encoding="utf-8")
    invalid_config = client.get("/cohort", params={"firm": "lender_a"})
    assert invalid_config.status_code == 500
    assert invalid_config.json() == {
        "detail": "Product mapping configuration must be a JSON object"
    }


def test_consumer_ids_are_limited_to_first_twenty(tmp_path: Path):
    rows = "".join(
        f"c{i},lender_a,2026-01-01T00:00:00Z,,true,fixed\n" for i in range(25)
    )
    data_path = tmp_path / "mortgages.csv"
    data_path.write_text(
        "consumer_id,firm,last_email_at,last_session_at,has_open_mortgage,product_type\n"
        + rows,
        encoding="utf-8",
    )
    firms_path = tmp_path / "firms.json"
    firms_path.write_text('{"allowed_firms":["lender_a"]}', encoding="utf-8")
    mappings_path = tmp_path / "mappings.json"
    mappings_path.write_text('{"fixed":"Fixed"}', encoding="utf-8")
    settings = Settings(data_path, firms_path, mappings_path, tmp_path / "audit.jsonl")
    client = TestClient(create_app(settings, clock=lambda: NOW))

    result = client.get("/cohort", params={"firm": "lender_a"}).json()

    assert result["count"] == 25
    assert result["consumer_ids"] == [f"c{i}" for i in range(20)]
    assert [preview["consumer_id"] for preview in result["consumer_previews"]] == [
        f"c{i}" for i in range(20)
    ]
