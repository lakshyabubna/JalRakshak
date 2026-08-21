from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RiskResult:
    score: int
    level: str
    drivers: list[str]


def assess_water_risk(turbidity_ntu: float | None, ph: float | None, diarrhea_reports: int, rainfall_mm: float) -> RiskResult:
    """Transparent demo scoring. Replace with a validated model before clinical use."""
    risk = 0.0
    drivers: list[str] = []
    if turbidity_ntu is not None and turbidity_ntu > 5:
        risk += min(35, (turbidity_ntu - 5) * 3 + 12)
        drivers.append("water turbidity exceeds the 5 NTU advisory threshold")
    if ph is not None and not 6.5 <= ph <= 8.5:
        risk += 20
        drivers.append("water pH is outside the 6.5-8.5 advisory range")
    if diarrhea_reports:
        risk += min(30, diarrhea_reports * 5)
        drivers.append(f"{diarrhea_reports} diarrheal symptom reports were recorded")
    if rainfall_mm >= 30:
        risk += min(20, rainfall_mm / 5)
        drivers.append("recent rainfall increases contamination exposure")

    score = min(100, round(risk))
    level = "emergency" if score >= 75 else "high" if score >= 50 else "moderate" if score >= 25 else "safe"
    return RiskResult(score=score, level=level, drivers=drivers or ["no elevated water-risk indicators were reported"])
