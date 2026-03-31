"""
Base interceptor interface.

Interceptors transform request bodies before they hit the gateway
and transform gateway responses before they reach the frontend.
"""

from abc import ABC, abstractmethod
from typing import Any


class Interceptor(ABC):
    """Base class for model-specific request/response interceptors."""

    @abstractmethod
    def transform_request(self, messages: list[dict]) -> dict[str, Any]:
        """Transform FE messages into the gateway request body."""
        ...

    @abstractmethod
    def transform_response(self, response: dict[str, Any], status_code: int) -> dict[str, Any]:
        """Transform gateway response into a simplified FE response."""
        ...
