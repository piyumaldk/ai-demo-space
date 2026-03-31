from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from config import GATEWAY_URL, API_KEYS

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
    messages: list[dict]


class GatewayStatusRequest(BaseModel):
    pass


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/gateway-status")
async def gateway_status():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(GATEWAY_URL)
            return {"connected": resp.status_code < 500, "url": GATEWAY_URL}
    except Exception:
        return {"connected": False, "url": GATEWAY_URL}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    api_key = API_KEYS.get(req.api_key_id)
    if not api_key:
        raise HTTPException(status_code=400, detail=f"Unknown API key ID: {req.api_key_id}")

    url = f"{GATEWAY_URL}{req.context}"

    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }

    body = {
        "messages": req.messages,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=body, headers=headers)
            if resp.status_code != 200:
                return {
                    "error": True,
                    "status": resp.status_code,
                    "detail": resp.text,
                }
            return resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gateway timeout")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
