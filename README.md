# Cohort Viewer

A small full-stack tool for customer-experience operators to build mortgage-consumer cohorts, inspect product coverage, and preview recovery communications. The React interface exposes firm, activity, and mortgage-status filters; the FastAPI service enforces firm access, queries CSV data with DuckDB, applies runtime product mappings, and writes a structured audit record for every successful query.

## How to run it

### Prerequisites

- Python 3.12 or newer
- [`uv`](https://docs.astral.sh/uv/)
- Node.js 20 or newer
- [`pnpm`](https://pnpm.io/)

Clone the repository, then start the API from one terminal:

```bash
cd backend
cp .env.example .env
uv sync --dev
uv run fastapi dev --port 8001
```

The API is available at `http://localhost:8001`; interactive API documentation is at `http://localhost:8001/docs`.

In a second terminal, start the frontend:

```bash
cd frontend
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173`, choose an allowed firm, adjust the optional filters, and select **Preview cohort**. The supplied sample configuration and CSV data work without further setup.

Runtime behavior is configured externally:

- `backend/config/firms.json` contains the firm allowlist and is validated when the API starts.
- `backend/config/product_mappings.json` maps raw product types to canonical categories. It is re-read for every cohort request, so valid changes take effect without restarting the API.
- `backend/data/mortgages.csv` is the default dataset. DuckDB scans it directly rather than loading the entire file into Python memory.
- Successful queries are appended as JSON Lines to `backend/queries.log` by default. Each entry includes the timestamp, firm, filters, and result count.

Paths, allowed frontend origins, the audit destination, and the cumulative-view threshold can be overridden with `MORTGAGES_CSV_PATH`, `FIRMS_CONFIG_PATH`, `PRODUCT_MAPPINGS_PATH`, `FRONTEND_ORIGINS`, `COHORT_AUDIT_LOG_PATH`, and `CUMULATIVE_VIEW_THRESHOLD`. The frontend API URL is controlled by `VITE_API_BASE_URL`.

Run the quality checks with:

```bash
cd backend
uv run pytest

cd ../frontend
pnpm lint
pnpm build
```

To run all of these checks automatically before every push, enable the tracked Git hooks once per clone:

```bash
git config core.hooksPath .githooks
```

The pre-push hook blocks the push if the backend tests, frontend lint, or frontend production build fails. To bypass it for an exceptional push, use `git push --no-verify`.

## What I'd do differently with more time

- Add pagination or cursor-based retrieval instead of returning only the first 20 consumer previews.
- Add frontend component and end-to-end tests covering filter serialization, loading and error states, the email guardrail toggle, and recovery-message previews.
- Strengthen dataset validation and observability with schema checks, malformed-row metrics, query timings, and alerts for invalid runtime configuration.

## AI usage explainer

AI was used across the entire development process.

After setting up the project, I generated and edited an AGENTS.md file to provide some guidelines, goals, and quality gates. From there I started a new thread for each listed feature, generating the solution, simplifying it (whenever possible), thoroughly reviewing and committing each task in order (backend, then frontend).
