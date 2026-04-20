import json
import logging
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from config import GATEWAY_URL, SSL_VERIFY, DEBUG
from keys import API_KEYS
from interceptor_config import get_interceptor
from auth.auth import get_token_claims, is_email_allowed

# Custom log level: EVENT (25) — between INFO and WARNING
EVENT_LEVEL = 25
logging.addLevelName(EVENT_LEVEL, "EVENT")

def event(self: logging.Logger, message: str, *args, **kwargs) -> None:
    if self.isEnabledFor(EVENT_LEVEL):
        self._log(EVENT_LEVEL, message, args, **kwargs)

logging.Logger.event = event  # type: ignore[attr-defined]

_SL_TZ = timezone(timedelta(hours=5, minutes=30))

class _SLTFormatter(logging.Formatter):
    def formatTime(self, record: logging.LogRecord, datefmt: str | None = None) -> str:
        dt = datetime.fromtimestamp(record.created, tz=_SL_TZ)
        return dt.strftime(datefmt or "%H:%M:%S")

_formatter = _SLTFormatter(
    fmt="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
_handler = logging.StreamHandler()
_handler.setFormatter(_formatter)

logging.basicConfig(
    level=logging.INFO if DEBUG else EVENT_LEVEL,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[_handler],
)

if not DEBUG:
    for _name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        logging.getLogger(_name).setLevel(logging.WARNING)

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


@app.get("/api/verify-auth")
async def verify_auth(request: Request):
    """Verify a Google ID token and check if the account is authorized."""
    sub, email = get_token_claims(request)
    logger.event(f"{sub}: trying to log in")  # type: ignore[attr-defined]
    if not is_email_allowed(email):
        logger.event(f"{sub}: unauthorized")  # type: ignore[attr-defined]
        raise HTTPException(
            status_code=403,
            detail=f"Your account ({email}) is not authorized. "
            "Only @wso2.com emails or pre-approved addresses are allowed.",
        )
    logger.event(f"{sub}: successfully logged in")  # type: ignore[attr-defined]
    return {"email": email, "authorized": True}


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
    sub, email = get_token_claims(request)
    if not is_email_allowed(email):
        return {
            "error": True,
            "content": f"Your email ({email}) is not authorized. "
            "Only @wso2.com emails or pre-approved addresses are allowed.",
        }

    prompt = next(
        (m.get("content", "") for m in reversed(req.messages) if m.get("role") == "user"),
        "",
    )
    logger.event(f"{sub}: {req.context}: {prompt}")  # type: ignore[attr-defined]
    api_key = API_KEYS.get(req.api_key_id)
    if not api_key:
        logger.warning(f"Unknown API key ID: {req.api_key_id}")
        raise HTTPException(status_code=400, detail=f"Unknown API key ID: {req.api_key_id}")

    interceptor = get_interceptor(req.model)
    url = f"{GATEWAY_URL}{req.context}"
    body = interceptor.transform_request(req.messages)

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

            result = interceptor.transform_response(raw, resp.status_code)

            return result

    except httpx.TimeoutException:
        logger.error("Gateway timeout")
        raise HTTPException(status_code=504, detail="Gateway timeout")
    except Exception as e:
        logger.error(f"Gateway request failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))
