# ai-demo-space

A demo tool for the AI Gateway, consisting of:

- **`python-fastapi/`** — BFF (Backend-for-Frontend) that proxies chat requests to the AI Gateway with interceptors/guardrails.
- **`react-vite/`** — React + Vite frontend dashboard for testing different guardrail configurations.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.12+ |
| Node.js | 20+ |
| Docker | 24+ |

---

## Running Locally

### 1. Backend — Python FastAPI

```bash
cd python-fastapi

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip3 install -r requirements.txt

# Start the server (listens on http://localhost:8000)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

> **Configuration** — edit `config.py` to change the gateway URL or SSL verification settings, and `keys.py` to update API keys.

---

### 2. Frontend — React / Vite

```bash
cd react-vite

# Install dependencies
npm install

# Start the dev server (listens on http://localhost:5173)
npm run dev
```

The app will be available at `http://localhost:5173`.

By default the frontend calls the BFF at `http://localhost:8000`. Override this by setting the environment variable before starting:

```bash
VITE_BFF_URL=http://localhost:8000 npm run dev
```

---

## Docker

### Build images

```bash
# Backend
docker build -t ai-demo-bff ./python-fastapi

# Frontend
docker build -t ai-demo-fe ./react-vite
```

### Run containers

```bash
# Backend — exposed on http://localhost:8000
docker run -p 8000:8080 ai-demo-bff

# Frontend — exposed on http://localhost:3000
docker run -p 3000:8080 ai-demo-fe
```

> Both containers listen internally on port **8080** (Choreo requirement) and are mapped to convenient local ports above.

### Run both together with Docker Compose

```bash
# From the repo root
docker compose up
```

<details>
<summary>Minimal <code>docker-compose.yml</code> (create in repo root if needed)</summary>

```yaml
services:
  bff:
    build: ./python-fastapi
    ports:
      - "8000:8080"

  frontend:
    build: ./react-vite
    ports:
      - "3000:8080"
    environment:
      - VITE_BFF_URL=http://localhost:8000
    depends_on:
      - bff
```

</details>

---

## Deploying to Choreo

Deploy each component as a separate Choreo Service using the Dockerfiles provided:

| Component | Dockerfile | Exposed Port |
|-----------|-----------|--------------|
| BFF | `python-fastapi/Dockerfile` | 8080 |
| Frontend | `react-vite/Dockerfile` | 8080 |

Set `VITE_BFF_URL` in the frontend component's environment variables to point to the deployed BFF service URL.

