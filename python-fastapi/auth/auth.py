import logging

from fastapi import HTTPException, Request
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from config import GOOGLE_CLIENT_ID
from allowed_mails import ALLOWED_EMAILS

logger = logging.getLogger(__name__)


def get_verified_email(request: Request) -> str:
    """Verify a Google ID token locally and return the associated email."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header"
        )

    token = auth_header.removeprefix("Bearer ")

    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        logger.warning("Invalid Google ID token: %s", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email: str = idinfo.get("email", "")
    if not email:
        raise HTTPException(status_code=401, detail="No email claim in token")

    return email


def is_email_allowed(email: str) -> bool:
    """Return True if the email belongs to @wso2.com or is in the allow-list."""
    return email.endswith("@wso2.com") or email.lower() in {
        e.lower() for e in ALLOWED_EMAILS
    }
