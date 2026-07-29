from collections.abc import Callable
from datetime import datetime
from typing import Annotated

from fastapi import FastAPI, Query

from cohort import CohortResponse, CohortService, Settings


def create_app(
    settings: Settings | None = None,
    *,
    clock: Callable[[], datetime] | None = None,
) -> FastAPI:
    app = FastAPI(title="Cohort Viewer API")
    service = CohortService(settings or Settings.from_environment(), clock=clock)

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
