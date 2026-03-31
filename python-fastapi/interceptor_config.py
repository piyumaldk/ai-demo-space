"""
Maps model identifiers to their interceptor classes.

To add a new model family:
1. Create a new interceptor in interceptors/
2. Add the model-to-interceptor mapping here
"""

from interceptors import Interceptor
from interceptors.gpt import GptInterceptor

# Model name → interceptor instance
_INTERCEPTOR_MAP: dict[str, Interceptor] = {
    "gpt-4o-mini": GptInterceptor(),
    "gpt-4o": GptInterceptor(),
    "gpt-4": GptInterceptor(),
}


def get_interceptor(model: str) -> Interceptor:
    """Return the interceptor for a given model. Falls back to GPT interceptor."""
    interceptor = _INTERCEPTOR_MAP.get(model)
    if interceptor is None:
        # Default fallback
        interceptor = GptInterceptor()
    return interceptor
