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
    audit_path = tmp_path / "audit/cohort.jsonl"
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
