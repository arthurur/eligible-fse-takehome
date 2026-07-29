# fse-takehome

Full-stack monorepo with a React + Vite frontend and a Python + FastAPI backend.

## Project structure

```
fse-takehome/
├── frontend/   # React + TypeScript + Vite
└── backend/    # Python + FastAPI
```

## Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

See [frontend/README.md](./frontend/README.md) for Vite template details.

## Backend

```bash
cd backend
uv sync
uv run fastapi dev
```

The API runs at http://127.0.0.1:8000 (docs at `/docs`).
