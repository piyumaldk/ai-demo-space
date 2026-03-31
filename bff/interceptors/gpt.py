"""GPT-family interceptor (gpt-4o-mini, gpt-4o, etc.)."""

import logging
from typing import Any

from interceptors import Interceptor

logger = logging.getLogger(__name__)


class GptInterceptor(Interceptor):
    """Transforms requests/responses for Azure OpenAI GPT models."""

    def transform_request(self, messages: list[dict]) -> dict[str, Any]:
        """Wrap messages into the OpenAI chat completions body format."""
        body = {
            "messages": [
                {"role": m.get("role", "user"), "content": m.get("content", "")}
                for m in messages
            ]
        }
        logger.info(f"[GptInterceptor] Request body: {len(body['messages'])} message(s)")
        return body

    def transform_response(self, response: dict[str, Any], status_code: int) -> dict[str, Any]:
        """Extract assistant message content from GPT response."""
        if status_code != 200:
            # Error response — pass through as error message
            detail = response.get("error", {}).get("message", "") if isinstance(response.get("error"), dict) else str(response)
            logger.warning(f"[GptInterceptor] Error response: {detail[:200]}")
            return {"error": True, "content": detail}

        try:
            content = response["choices"][0]["message"]["content"]
            logger.info(f"[GptInterceptor] Extracted content: {content[:100]}...")
            return {"error": False, "content": content}
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"[GptInterceptor] Failed to extract content: {e}")
            return {"error": True, "content": f"Unexpected response format: {str(response)[:500]}"}
