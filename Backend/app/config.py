from __future__ import annotations

import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def _load_local_env() -> None:
    """Load local development settings without replacing real environment values."""
    path = ROOT / ".env.local"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_local_env()


class Settings:
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    openai_api_key = os.getenv("OPENAI_API_KEY", "")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    fast2sms_api_key = os.getenv("FAST2SMS_API_KEY", "")

    # Accept a copied REST endpoint as well as the normal project URL.
    if supabase_url.endswith("/rest/v1"):
        supabase_url = supabase_url[: -len("/rest/v1")]

    def missing(self) -> list[str]:
        required = {
            "NEXT_PUBLIC_SUPABASE_URL": self.supabase_url,
            "SUPABASE_SERVICE_ROLE_KEY": self.supabase_service_role_key,
            "OPENAI_API_KEY": self.openai_api_key,
            "FAST2SMS_API_KEY": self.fast2sms_api_key,
        }
        return [key for key, value in required.items() if not value]


settings = Settings()
