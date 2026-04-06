# CyberShield AI - Project Guide

CyberShield AI is a full-stack cyber attack-path analysis project:

- **Backend:** FastAPI (`api/`) for attack paths, risk scoring, simulation, and AI analysis.
- **Frontend:** React + Vite (`frontend/`) dashboard that calls backend APIs via `/api`.
- **Data layer:** TigerGraph (host + graph configured through `.env`).
- **Optional AI:** OpenAI key enables AI defense recommendations.

This guide shows exactly how to start the backend in a Python virtual environment and run the full project.

---

## 1) What this project does

The app models cyber attack movement through graph data and provides:

- Attack path listing
- Risk score insights
- Simulation of attack steps
- Optional AI-generated defense recommendations
- Graph/scenario views for exploration

Main modern backend code is in `api/` and frontend code is in `frontend/src/`.

---

## 2) Prerequisites

Install these first:

- Python 3.10+ (recommended 3.11)
- Node.js 18+ and npm
- Access to a TigerGraph instance/graph
- (Optional) OpenAI API key for AI analysis routes

---

## 3) Environment configuration (`.env`)

Project uses root `.env` file. Backend reads it from repo root.

Minimum values to check:

```env
TG_HOST=https://<your-tigergraph-host>
CYBERSHIELD_GRAPH=CyberShieldGraph
TG_TGCLOUD=true
TG_SECRET=<your-secret-or-token>
TG_API_TOKEN=
OPENAI_API_KEY=<optional>
OPENAI_MODEL=gpt-4o-mini
LOG_LEVEL=INFO
```

Notes:

- Backend uses `TG_SECRET` first; if missing it can fall back to `TG_API_TOKEN`.
- `OPENAI_API_KEY` is optional unless you use AI analysis endpoints.
- Keep `.env` secrets private. Do not commit real keys/tokens.

---

## 4) Start backend in venv (step-by-step)

From repository root (`D:\testing final ka final\testing`):

### Windows PowerShell

1. Create venv (skip if `.venv` already exists):

```powershell
python -m venv .venv
```

2. Activate venv:

```powershell
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

Because this repo currently has no root `requirements.txt`/`pyproject.toml`, install backend packages manually:

```powershell
pip install fastapi uvicorn python-dotenv pyTigerGraph openai pydantic
```

4. Start backend (`api/` app on port 8000):

```powershell
uvicorn api.app:app --host 127.0.0.1 --port 8000 --reload
```

5. Verify backend:

- API root: <http://127.0.0.1:8000/>
- Swagger docs: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/health>

---

## 5) Start frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Then open the local Vite URL (usually <http://127.0.0.1:5173>).

Frontend is configured to proxy `/api` calls to backend `http://127.0.0.1:8000`.

---

## 6) Clear file structure (what is important)

```text
testing/
|- api/                        # Main FastAPI backend (recommended)
|  |- app.py                   # FastAPI app entrypoint
|  |- routes/                  # API endpoints
|  |- services/                # Business logic
|  |- core/                    # Config, logging, TigerGraph connection
|  `- models/                  # Pydantic/data schemas
|- frontend/                   # React + Vite frontend
|  |- src/                     # App pages/components/services
|  |- vite.config.ts           # Dev proxy config
|  `- package.json             # Frontend scripts/dependencies
|- scripts/                    # Utility/setup scripts for graph/simulation
|- cybershield/                # Older/alternate backend + Streamlit app
|- .env                        # Environment variables
`- README.md                   # This guide
```

---

## 7) Likely unused or legacy files/folders

These are **candidates** for cleanup review (not auto-delete):

- `cybershield/`
  - Contains an older FastAPI app (`cybershield/main.py`) and Streamlit app.
  - Current frontend API shape matches `api/` routes, not this older stack.
- `scripts/setup_fraud_graph.py`
  - Looks like alternate/demo setup script; not part of current `api/` runtime.
- `frontend/README.md`
  - Vite template README; may be redundant now that root README exists.

Keep them if you still need legacy demos or one-off setup scripts.

---

## 8) Recommended next cleanup improvements

- Add `requirements.txt` for reproducible backend installs.
- Add `.env.example` with placeholder values (no secrets).
- Remove or archive legacy modules (`cybershield/`) if no longer used.
- Keep only one backend entrypoint to avoid confusion (`api.app:app`).

