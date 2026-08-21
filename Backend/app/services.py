from __future__ import annotations

import json
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .config import settings


class ProviderError(RuntimeError):
    pass


def generate_risk_explanation(village_name: str, score: int, level: str, drivers: list[str]) -> str:
    payload = {
        "model": settings.openai_model,
        "input": (
            "You are a public-health communication assistant. Explain this non-diagnostic village risk result "
            "in 45 words or fewer. Include a practical next step; do not claim a disease diagnosis. "
            f"Village: {village_name}. Score: {score}/100. Level: {level}. Drivers: {', '.join(drivers)}."
        ),
    }
    request = Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise ProviderError(f"OpenAI returned {error.code}: {error.read().decode('utf-8', errors='replace')}") from error
    except URLError as error:
        raise ProviderError(f"Could not reach OpenAI: {error.reason}") from error

    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                return content["text"]
    raise ProviderError("OpenAI returned no text explanation.")


def send_sms(phone: str, message: str) -> dict:
    """Sends only after the API caller explicitly confirms recipient consent."""
    digits = re.sub(r"\D", "", phone)[-10:]
    if len(digits) != 10:
        raise ProviderError("Use a valid 10-digit Indian mobile number.")
    endpoint = "https://www.fast2sms.com/dev/bulkV2?" + urlencode({"route": "q", "message": message, "numbers": digits})
    request = Request(endpoint, headers={"authorization": settings.fast2sms_api_key, "accept": "application/json"})
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise ProviderError(f"Fast2SMS returned {error.code}: {error.read().decode('utf-8', errors='replace')}") from error
    except URLError as error:
        raise ProviderError(f"Could not reach Fast2SMS: {error.reason}") from error
