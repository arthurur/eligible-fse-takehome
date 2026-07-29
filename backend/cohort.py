from __future__ import annotations

import json
import os
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import duckdb
from fastapi import HTTPException, status
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Settings:
    data_path: Path
    firms_path: Path
    product_mappings_path: Path
    audit_log_path: Path

    @classmethod
    def from_environment(cls) -> Settings:
        return cls(
            data_path=Path(
                os.environ.get("COHORT_DATA_PATH", BASE_DIR / "data/mortgages.csv")
            ),
            firms_path=Path(
                os.environ.get("COHORT_FIRMS_PATH", BASE_DIR / "config/firms.json")
            ),
            product_mappings_path=Path(
                os.environ.get(
                    "COHORT_PRODUCT_MAPPINGS_PATH",
                    BASE_DIR / "config/product_mappings.json",
                )
            ),
            audit_log_path=Path(
                os.environ.get("COHORT_AUDIT_LOG_PATH", BASE_DIR / "queries.log")
            ),
        )


class FiltersApplied(BaseModel):
    firm: str
    days_since_last_email: int
    no_session_since: datetime | None
    has_open_mortgage: bool


class CohortResponse(BaseModel):
    count: int
    consumer_ids: list[str]
    filters_applied: FiltersApplied
    queried_at: datetime
    product_type_summary: dict[str, int]
    unmapped_product_types: list[str]


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _load_json_object(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{label} configuration file was not found",
        ) from exc
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{label} configuration is invalid",
        ) from exc

    if not isinstance(value, dict):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{label} configuration must be a JSON object",
        )
    return value


def _load_allowed_firms(path: Path) -> set[str]:
    config = _load_json_object(path, "Firm access")
    firms = config.get("allowed_firms")
    if (
        not isinstance(firms, list)
        or not firms
        or any(not isinstance(firm, str) or not firm for firm in firms)
    ):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firm access configuration requires a non-empty allowed_firms list",
        )
    return set(firms)


def _load_product_mappings(path: Path) -> dict[str, str]:
    mappings = _load_json_object(path, "Product mapping")
    if any(
        not isinstance(raw, str)
        or not raw
        or not isinstance(canonical, str)
        or not canonical
        for raw, canonical in mappings.items()
    ):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Product mapping configuration must map non-empty strings to non-empty strings",
        )
    return {raw: canonical for raw, canonical in mappings.items()}


class CohortService:
    def __init__(
        self,
        settings: Settings,
        *,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self.settings = settings
        self.clock = clock or (lambda: datetime.now(UTC))
        self.allowed_firms = _load_allowed_firms(settings.firms_path)

    def query(
        self,
        *,
        firm: str,
        days_since_last_email: int,
        no_session_since: datetime | None,
        has_open_mortgage: bool,
    ) -> CohortResponse:
        queried_at = _utc(self.clock())
        session_cutoff = _utc(no_session_since) if no_session_since else None
        filters = FiltersApplied(
            firm=firm,
            days_since_last_email=days_since_last_email,
            no_session_since=session_cutoff,
            has_open_mortgage=has_open_mortgage,
        )

        if firm not in self.allowed_firms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Firm '{firm}' is not allowed",
            )
        mappings = _load_product_mappings(self.settings.product_mappings_path)

        product_counts, consumer_ids = self._query_dataset(
            firm=firm,
            email_cutoff=queried_at - timedelta(days=days_since_last_email),
            session_cutoff=session_cutoff,
            has_open_mortgage=has_open_mortgage,
        )
        count = sum(product_counts.values())

        summary: dict[str, int] = {}
        unmapped: list[str] = []
        for raw_product_type, product_count in product_counts.items():
            canonical = mappings.get(raw_product_type)
            if canonical is None:
                unmapped.append(raw_product_type)
            else:
                summary[canonical] = summary.get(canonical, 0) + product_count

        response = CohortResponse(
            count=count,
            consumer_ids=consumer_ids,
            filters_applied=filters,
            queried_at=queried_at,
            product_type_summary=dict(sorted(summary.items())),
            unmapped_product_types=sorted(unmapped),
        )
        self._write_audit(response)
        return response

    def _query_dataset(
        self,
        *,
        firm: str,
        email_cutoff: datetime,
        session_cutoff: datetime | None,
        has_open_mortgage: bool,
    ) -> tuple[dict[str, int], list[str]]:
        predicates = [
            "firm = ?",
            "(last_email_at IS NULL OR last_email_at <= ?)",
            "has_open_mortgage = ?",
        ]
        parameters: list[Any] = [
            str(self.settings.data_path),
            firm,
            email_cutoff,
            has_open_mortgage,
        ]
        if session_cutoff is not None:
            predicates.append(
                "(last_session_at IS NULL OR last_session_at < ?)"
            )
            parameters.append(session_cutoff)

        where = " AND ".join(predicates)
        sql = (
            "WITH records AS ("
            "  SELECT consumer_id, firm, product_type,"
            "    TRY_CAST(last_email_at AS TIMESTAMPTZ) AS last_email_at,"
            "    TRY_CAST(last_session_at AS TIMESTAMPTZ) AS last_session_at,"
            "    TRY_CAST(has_open_mortgage AS BOOLEAN) AS has_open_mortgage"
            "  FROM read_csv(?, header = true, all_varchar = true)"
            "), filtered AS ("
            "  SELECT *, ROW_NUMBER() OVER () AS row_number"
            f"  FROM records WHERE {where}"
            ")"
            "SELECT GROUPING(product_type) AS is_total,"
            "  COALESCE(product_type, '') AS product_type, COUNT(*) AS count,"
            "  LIST(COALESCE(consumer_id, '') ORDER BY row_number)"
            "    FILTER (WHERE row_number <= 20) AS consumer_ids"
            " FROM filtered"
            " GROUP BY GROUPING SETS ((product_type), ())"
        )

        try:
            with duckdb.connect(database=":memory:", config={"threads": "1"}) as connection:
                rows = connection.execute(sql, parameters).fetchall()
        except duckdb.Error as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cohort dataset could not be queried; verify its path and CSV schema",
            ) from exc

        product_counts: dict[str, int] = {}
        consumer_ids: list[str] = []
        for is_total, product_type, count, ids in rows:
            if is_total:
                consumer_ids = [str(consumer_id) for consumer_id in (ids or [])]
            else:
                product_counts[str(product_type)] = int(count)
        return product_counts, consumer_ids

    def _write_audit(self, response: CohortResponse) -> None:
        record = {
            "queried_at": response.queried_at.isoformat(),
            "firm": response.filters_applied.firm,
            "filters": response.filters_applied.model_dump(mode="json"),
            "result_count": response.count,
        }
        payload = (json.dumps(record, separators=(",", ":")) + "\n").encode("utf-8")
        try:
            self.settings.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
            descriptor = os.open(
                self.settings.audit_log_path,
                os.O_APPEND | os.O_CREAT | os.O_WRONLY,
                0o600,
            )
            try:
                os.write(descriptor, payload)
            finally:
                os.close(descriptor)
        except OSError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cohort query could not be recorded in the audit log",
            ) from exc
