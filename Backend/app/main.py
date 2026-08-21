from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from . import database
from .config import settings
from .risk import assess_water_risk
from .services import ProviderError, generate_risk_explanation, send_sms

app = FastAPI(title="JalRakshak API", version="0.1.0")


class WaterReport(BaseModel):
    village_name: str = Field(min_length=2, max_length=120)
    turbidity_ntu: float | None = Field(default=None, ge=0)
    ph: float | None = Field(default=None, ge=0, le=14)
    diarrhea_reports: int = Field(default=0, ge=0)
    rainfall_mm: float = Field(default=0, ge=0)


class SMSAlert(BaseModel):
    phone: str
    message: str = Field(min_length=1, max_length=450)
    recipient_has_consented: bool


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "missing_configuration": settings.missing()}


@app.get("/api/v1/villages")
def villages() -> list[dict]:
    try:
        return database.list_villages()
    except database.DatabaseError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/api/v1/reports/water")
def create_water_report(report: WaterReport) -> dict:
    risk = assess_water_risk(report.turbidity_ntu, report.ph, report.diarrhea_reports, report.rainfall_mm)
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        database.insert("health_reports", {"village_name": report.village_name, "module": "water_safety", "payload": report.model_dump(), "reported_at": timestamp})
        snapshot = database.insert("village_risk_snapshots", {"village_name": report.village_name, "module": "water_safety", "community_health_score": 100 - risk.score, "risk_score": risk.score, "risk_level": risk.level, "drivers": risk.drivers, "updated_at": timestamp})
        alert = None
        if risk.level in {"high", "emergency"}:
            alert = database.insert("alerts", {"village_name": report.village_name, "module": "water_safety", "severity": risk.level, "message": f"Water safety alert for {report.village_name}: risk score {risk.score}/100. Review water source and issue local guidance.", "status": "queued"})
        return {"risk": risk.__dict__, "snapshot": snapshot, "alert": alert}
    except database.DatabaseError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/api/v1/risk-explanations")
def risk_explanation(report: WaterReport) -> dict:
    risk = assess_water_risk(report.turbidity_ntu, report.ph, report.diarrhea_reports, report.rainfall_mm)
    try:
        text = generate_risk_explanation(report.village_name, risk.score, risk.level, risk.drivers)
        return {"risk": risk.__dict__, "explanation": text, "disclaimer": "This is an early-warning aid, not a clinical diagnosis."}
    except ProviderError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@app.post("/api/v1/alerts/sms")
def sms_alert(alert: SMSAlert) -> dict:
    if not alert.recipient_has_consented:
        raise HTTPException(status_code=400, detail="Recipient consent is required before sending an SMS.")
    try:
        response = send_sms(alert.phone, alert.message)
        return {"provider": "fast2sms", "response": response}
    except ProviderError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
