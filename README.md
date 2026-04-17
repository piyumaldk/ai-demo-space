# ai-demo-space

A demo tool for the AI Gateway

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
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt

# Start the server (listens on http://localhost:8000)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 2. Frontend — React / Vite

```bash
cd react-vite
npm ci --legacy-peer-deps

# Start the dev server (listens on http://localhost:5173)
npm run dev
```

The app will be available at `http://localhost:5173`.

## Configurations

Override this by setting the environment variable before starting to change backend URL

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

