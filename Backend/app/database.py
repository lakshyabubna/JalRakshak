from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .config import settings


class DatabaseError(RuntimeError):
    pass


def _request(method: str, path: str, payload: Any | None = None) -> Any:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise DatabaseError("Supabase server credentials are not configured.")
    body = json.dumps(payload).encode() if payload is not None else None
    request = Request(
        f"{settings.supabase_url}/rest/v1/{path}",
        data=body,
        method=method,
        headers={
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urlopen(request, timeout=15) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise DatabaseError(f"Supabase returned {error.code}: {detail}") from error
    except URLError as error:
        raise DatabaseError(f"Could not reach Supabase: {error.reason}") from error


def insert(table: str, values: dict[str, Any]) -> dict[str, Any]:
    result = _request("POST", table, values)
    return result[0]


def list_villages() -> list[dict[str, Any]]:
    query = urlencode({"select": "village_name,community_health_score,risk_level,updated_at", "order": "updated_at.desc"})
    return _request("GET", f"village_risk_snapshots?{query}")


def connection_check() -> None:
    _request("GET", "village_risk_snapshots?select=id&limit=1")
