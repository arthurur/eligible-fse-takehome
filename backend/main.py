import os
from collections.abc import Callable
from datetime import datetime
from typing import Annotated

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from cohort import CohortResponse, CohortService, FirmListResponse, Settings


def _frontend_origins() -> list[str]:
    configured = os.environ.get(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def create_app(
    settings: Settings | None = None,
    *,
    clock: Callable[[], datetime] | None = None,
) -> FastAPI:
    app = FastAPI(title="Cohort Viewer API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_frontend_origins(),
        allow_methods=["GET"],
        allow_headers=["Accept"],
    )
    service = CohortService(settings or Settings.from_environment(), clock=clock)

    @app.get("/firms", response_model=FirmListResponse)
    def get_firms() -> FirmListResponse:
        return FirmListResponse(firms=service.list_allowed_firms())

    @app.get("/cohort", response_model=CohortResponse)
    def get_cohort(
        firm: Annotated[str, Query(min_length=1)],
        days_since_last_email: Annotated[int, Query(ge=0)] = 3,
        no_session_since: datetime | None = None,
        has_open_mortgage: bool = True,
    ) -> CohortResponse:
        return service.query(
            firm=firm,
            days_since_last_email=days_since_last_email,
            no_session_since=no_session_since,
            has_open_mortgage=has_open_mortgage,
        )

    return app


app = create_app()
