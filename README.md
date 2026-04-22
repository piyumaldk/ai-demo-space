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
npm ci

# Start the dev server (listens on http://localhost:5173)
npm run dev
```

The app will be available at `http://localhost:5173`.

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

## Choreo Deployment

Deploy both Service and WebApp and Docker Builds. 

### React WebApp

As Mount: Environment Variables, add below

```
VITE_BFF_URL = <Url of backend for frontend>
VITE_GOOGLE_CLIENT_ID = <Client ID for simple google SSO>
```

### Python Service

/app/allowed_mails.py (File Mount)
```python
# Add specific email addresses that should be allowed
# in addition to any @wso2.com address.
ALLOWED_EMAILS: list[str] = [
    # "someone@example.com",
]
```

/app/keys.py (File Mount) (Secret)
```python
API_KEYS: dict[str, str] = {
    "APIM4OMINI": "<key>",
    "APIM4OMINIPIIMASKINGREGEX": "<key>",
    "APIM4OMINIURLGUARDRAIL": "<key>",
    "APIM4OMINIWORDCOUNTGUARDRAIL": "<key>",
}
```

/app/config.py (File Mount)
```python
GATEWAY_URL = "<Gateway:8443>"
SSL_VERIFY = "./gateway-ca.pem" 
GOOGLE_CLIENT_ID = "<Client ID for simple google SSO>"
DEBUG = True (Show additional logs)
```

### AI Gateway Deployment (In Azure VM)

1. Add exposing IP to Gateway cert
```shell
openssl req -x509 -nodes \
  -key resources/listener-certs/default-listener.key \
  -days 3650 \
  -subj "/C=US/ST=California/L=San Francisco/O=WSO2/OU=API Gateway/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:<NEW IP>" \
  -out resources/listener-certs/default-listener.crt
```

2. Run or Rerun AI Gateway
```shell
docker compose down && docker compose --env-file configs/keys.env up -d
```

3. Add PEM to SSL_VERIFY Location
```shell
openssl s_client -connect <ai-gateway-ip>:8443 -showcerts </dev/null 2>/dev/null \
  | openssl x509 -outform PEM > <python-fastapi-location>/gateway-ca.pem
```