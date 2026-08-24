# JalRakshak backend

## Run locally

```powershell
$env:PYTHONPATH = "backend"
python -m uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/docs` for the API documentation.

## Safety

- The `SUPABASE_SERVICE_ROLE_KEY` is used only by the backend and must never be exposed to the browser or mobile app.
- SMS delivery is limited to mobile numbers registered by an ASHA worker with recorded SMS consent. High/emergency water-risk reports can alert those opted-in households, and the demo endpoint sends only to the same registered list.
- Apply `supabase/migrations/0002_registered_residents.sql` before using registration or village SMS delivery.
- The risk score is a transparent hackathon demonstration rule, not a medical diagnostic model.
