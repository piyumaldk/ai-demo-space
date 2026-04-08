import json
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from config import GATEWAY_URL, SSL_VERIFY
from keys import API_KEYS
from interceptor_config import get_interceptor
from auth.auth import get_verified_email, is_email_allowed

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

SEP = "-" * 60


def _fmt(obj, max_chars: int = 2000) -> str:
    """Pretty-print a dict/list as JSON, truncated to max_chars."""
    try:
        text = json.dumps(obj, indent=2, ensure_ascii=False)
    except Exception:
        text = str(obj)
    return text if len(text) <= max_chars else text[:max_chars] + "  ...[truncated]"

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
async def chat(req: ChatRequest, request: Request):
    # ── 0. AUTH ─────────────────────────────────────────────────
    email = get_verified_email(request)
    if not is_email_allowed(email):
        return {
            "error": True,
            "content": f"Your email ({email}) is not authorized. "
            "Only @wso2.com emails or pre-approved addresses are allowed.",
        }
    logger.debug(f"[0] AUTH OK — {email}")

    # ── 1. INCOMING REQUEST (frontend → FastAPI) ──────────────────
    logger.debug(SEP)
    logger.debug("[1] INCOMING REQUEST  (frontend → FastAPI)")
    logger.debug(f"    URL  : POST /api/chat")
    logger.debug(f"    Body : {_fmt(req.model_dump(exclude={'api_key_id'}))}")

    api_key = API_KEYS.get(req.api_key_id)
    if not api_key:
        logger.warning(f"Unknown API key ID: {req.api_key_id}")
        raise HTTPException(status_code=400, detail=f"Unknown API key ID: {req.api_key_id}")

    interceptor = get_interceptor(req.model)
    url = f"{GATEWAY_URL}{req.context}"
    body = interceptor.transform_request(req.messages)

    # ── 2. OUTGOING REQUEST (FastAPI → backend) ────────────────────
    logger.debug("[2] OUTGOING REQUEST  (FastAPI → backend)")
    logger.debug(f"    URL  : POST {url}")
    logger.debug(f"    Body : {_fmt(body)}")

    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0, verify=SSL_VERIFY) as client:
            resp = await client.post(url, json=body, headers=headers)

            try:
                raw = resp.json()
            except Exception:
                raw = {"error": resp.text}

            # ── 3. RESPONSE FROM BACKEND ───────────────────────────
            logger.debug("[3] RESPONSE FROM BACKEND")
            logger.debug(f"    Status : {resp.status_code}")
            logger.debug(f"    Body   : {_fmt(raw)}")

            result = interceptor.transform_response(raw, resp.status_code)

            # ── 4. RESPONSE TO FRONTEND ────────────────────────────
            logger.debug("[4] RESPONSE TO FRONTEND")
            logger.debug(f"    Status : 200")
            logger.debug(f"    Body   : {_fmt(result)}")
            logger.debug(SEP)

            return result

    except httpx.TimeoutException:
        logger.error("Gateway timeout")
        raise HTTPException(status_code=504, detail="Gateway timeout")
    except Exception as e:
        logger.error(f"Gateway request failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))
