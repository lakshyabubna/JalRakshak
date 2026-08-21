# JalRakshak 2.0 - SIH Build Brief

## Original request

> This is an idea for SIH Hackathon. We need to build an app as specified in the presentation, with all working features. It should use a brutalist theme, and all features should be working, including AI calling and SMS.

## Product scope extracted from the presentation

JalRakshak is a modular rural public-health early-warning and response platform. It combines external and health data, community reports, AI risk analysis, health-threat modules, dashboards, alerts, and an offline health-worker workflow.

Initial health modules:

- Water safety: cholera, typhoid, acute diarrheal disease
- Vector-borne disease: dengue, malaria, chikungunya
- Heatwave
- Air quality / respiratory risk
- Vaccination reminders
- Zoonotic and disaster-health alerts

Key application capabilities:

- District, government, and village dashboards with maps, rankings, health scores, risk levels, and recommendations
- Community reports through SMS, WhatsApp, IVR/missed-call callback, and mobile app
- AI risk prediction, 7-14 day forecasts, anomaly detection, explainable risk factors, and response recommendations
- Automated alert-to-response workflows, including SMS/WhatsApp/voice notifications
- Offline-first ASHA/health-worker mobile app for symptoms, photos, GPS-tagged water sources, and medicine distribution
- IoT water-quality ingestion and external weather, flood, air-quality, and health-data integrations

## Design direction

- Brutalist UI: high-contrast palette, large type, thick borders, exposed grids, compact cards, sharp corners, loud risk colours, and functional data-dense layouts.
- Accessibility is still required: keyboard operation, readable contrast, non-colour status labels, screen-reader labels, and mobile layouts.

## Completion criteria

The app is only considered feature-complete when each demo flow works against real or clearly labelled sandbox providers:

1. An incoming report or sensor/data update changes a village risk calculation.
2. The dashboard shows the changed risk, score, reason, and map state.
3. Crossing a configured threshold creates an intervention and sends a real sandbox/test alert.
4. An authorized worker can capture data offline and later synchronize it.
5. The AI endpoint returns a prediction and explanation using a versioned model or documented deterministic fallback.

## External requirements and credentials

### Core platform

- Hosted frontend, API, PostgreSQL database, object storage for photos, and HTTPS domain.
- PostgreSQL with PostGIS enabled for village, water-source, and coverage-area geography.
- Authentication provider and role model: citizen, ASHA worker, PHC/ANM, district official, administrator.
- Secrets manager/environment configuration; do not commit API keys, tokens, phone numbers, or health data.

### AI / ML

- A trained, versioned risk model per implemented module, plus evaluation data and an agreed risk-threshold policy.
- Feature pipeline for weather, sensor values, reports, admissions, vaccination, AQI, population, and historical outbreaks.
- A model-serving API with latency/error monitoring and explainability output (for example feature contributions/risk drivers).
- For generative AI recommendations or chatbot capability: an LLM provider API key, server-side API route, rate limits, moderation/guardrails, consent-safe prompts, and fallback response templates.
- Clearly distinguish predictions from clinical diagnoses and have public-health/medical review for alert copy and intervention guidance.

### SMS, WhatsApp, and voice/IVR

- SMS provider account (for example Twilio, MSG91, Gupshup, or AWS SNS), approved sender ID, API credentials, delivery-status webhook, and opt-in/opt-out handling.
- India production SMS requires the applicable DLT registration, entity ID, sender/header approval, and pre-approved message templates. Sandbox accounts can be used for the hackathon demo.
- WhatsApp Business provider/account, verified number, approved template messages, webhook endpoint, and user opt-in.
- Voice/IVR provider, phone number, call-flow script in required local languages, callback webhooks, recording/retention policy, and consent prompts.
- A reachable public HTTPS webhook URL for delivery receipts and inbound messages/calls (for local development, a tunnelling service is acceptable).

### Data integrations and hardware

- API access/terms for weather (IMD or alternative), flood/disaster, AQI, and any health-system data used.
- Written data-sharing authorization for PHC, hospital, laboratory, ASHA/ANM, or government records; minimize and de-identify data where possible.
- ESP32 devices, compatible water-quality sensors, calibrated readings, unique device IDs, MQTT/HTTPS ingestion, and device provisioning for IoT.
- Map tiles/API key if using Mapbox; Leaflet with an appropriate tile provider if avoiding a paid map API.

### Mobile and offline operation

- Flutter app with local encrypted database/queue, sync conflict rules, network-retry strategy, GPS/camera permissions, and release signing.
- Test Android devices, including an intermittent/no-network test scenario.

### Security, privacy, and operations

- Consent language, privacy notice, role-based access control, audit logs, encrypted transport/storage, backups, retention/deletion policy, and incident contacts.
- Avoid Aadhaar/ABHA integration in the hackathon build unless formal authorization, sandbox access, and compliance review are available; use a mock/demo adapter instead.
- Monitoring for API health, failed syncs, queued alerts, provider delivery status, and model quality/drift.

## Recommended hackathon build order

1. Implement water-safety and heatwave modules first, using seeded/sample data plus one live data source.
2. Build district and village dashboards, then make alert automation trigger from those two modules.
3. Integrate one real sandbox SMS provider and one AI prediction/recommendation path end-to-end.
4. Add the offline worker reporting flow and map updates.
5. Demonstrate remaining modules behind the shared modular engine, with their data-source adapters clearly marked as mock or live.

