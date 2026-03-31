import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from config import GATEWAY_URL, SSL_VERIFY
from keys import API_KEYS
from interceptor_config import get_interceptor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Gateway Demo BFF")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    api_key_id: str
    context: str
    model: str
    messages: list[dict]


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/gateway-status")
async def gateway_status():
    try:
        async with httpx.AsyncClient(timeout=5.0, verify=SSL_VERIFY) as client:
            resp = await client.get(GATEWAY_URL)
            return {"connected": resp.status_code < 500, "url": GATEWAY_URL}
    except Exception:
        return {"connected": False, "url": GATEWAY_URL}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    logger.info(f"POST /api/chat — key_id={req.api_key_id}, model={req.model}, context={req.context}")
    api_key = API_KEYS.get(req.api_key_id)
    if not api_key:
        logger.warning(f"Unknown API key ID: {req.api_key_id}")
        raise HTTPException(status_code=400, detail=f"Unknown API key ID: {req.api_key_id}")

    interceptor = get_interceptor(req.model)
    logger.info(f"Using interceptor: {type(interceptor).__name__}")

    url = f"{GATEWAY_URL}{req.context}"
    logger.info(f"Forwarding to: {url}")

    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }

    body = interceptor.transform_request(req.messages)

    try:
        async with httpx.AsyncClient(timeout=30.0, verify=SSL_VERIFY) as client:
            resp = await client.post(url, json=body, headers=headers)
            logger.info(f"Gateway response: status={resp.status_code}")
            try:
                raw = resp.json()
            except Exception:
                raw = {"error": resp.text}
            return interceptor.transform_response(raw, resp.status_code)
    except httpx.TimeoutException:
        logger.error("Gateway timeout")
        raise HTTPException(status_code=504, detail="Gateway timeout")
    except Exception as e:
        logger.error(f"Gateway request failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))
