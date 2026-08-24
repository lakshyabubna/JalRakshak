from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import database
from .config import settings
from .risk import assess_water_risk
from .services import ProviderError, generate_risk_explanation, send_sms, send_sms_many

app = FastAPI(title="JalRakshak API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost", "capacitor://localhost"], allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


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


class ResidentRegistration(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    village_name: str = Field(min_length=2, max_length=120)
    sms_consent: bool


class SMSDemoRequest(BaseModel):
    village_name: str = Field(min_length=2, max_length=120)


def water_alert_message(village_name: str, is_demo: bool = False) -> str:
    prefix = "JalRakshak DEMO:" if is_demo else "JalRakshak alert:"
    return f"{prefix} {village_name} water safety advisory. Boil drinking water before use. Follow local health worker guidance."


def public_registration(record: dict) -> dict:
    digits = "".join(char for char in str(record["phone"]) if char.isdigit())
    return {"id": record["id"], "full_name": record["full_name"], "village_name": record["village_name"], "masked_phone": f"••••••{digits[-4:]}"}


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
        sms_delivery = None
        if risk.level in {"high", "emergency"}:
            message = water_alert_message(report.village_name)
            alert = database.insert("alerts", {"village_name": report.village_name, "module": "water_safety", "severity": risk.level, "message": message, "status": "queued"})
            recipients = database.list_consented_phones(report.village_name)
            if recipients and settings.fast2sms_api_key:
                try:
                    send_sms_many(recipients, message)
                    sms_delivery = {"sent_to": len(recipients), "provider": "fast2sms"}
                except ProviderError as error:
                    sms_delivery = {"sent_to": 0, "error": str(error)}
        return {"risk": risk.__dict__, "snapshot": snapshot, "alert": alert, "sms_delivery": sms_delivery}
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


@app.post("/api/v1/registrations")
def create_registration(registration: ResidentRegistration) -> dict:
    if not registration.sms_consent:
        raise HTTPException(status_code=400, detail="SMS consent is required before registering a mobile number.")
    try:
        record = database.insert("registered_residents", {"full_name": registration.full_name, "phone": registration.phone, "village_name": registration.village_name, "sms_consent": True, "consented_at": datetime.now(timezone.utc).isoformat(), "is_active": True})
        return {"registration": public_registration(record)}
    except database.DatabaseError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/api/v1/registrations")
def registrations(village_name: str = Query(min_length=2, max_length=120)) -> list[dict]:
    try:
        return [public_registration(record) for record in database.list_registered_residents(village_name)]
    except database.DatabaseError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.delete("/api/v1/registrations/{registration_id}")
def delete_registration(registration_id: UUID) -> dict:
    try:
        database.delete_registered_resident(str(registration_id))
        return {"removed": True}
    except database.DatabaseError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/api/v1/alerts/sms/demo")
def sms_demo(request: SMSDemoRequest) -> dict:
    try:
        recipients = database.list_consented_phones(request.village_name)
        message = water_alert_message(request.village_name, is_demo=True)
        response = send_sms_many(recipients, message)
        return {"provider": "fast2sms", "sent_to": len(recipients), "message": message, "response": response}
    except (database.DatabaseError, ProviderError) as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
