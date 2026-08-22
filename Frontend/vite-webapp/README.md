# JalRakshak — SIH 2026 prototype

A rural-first, neo-brutalist public-health early-warning prototype. It starts instantly with clearly labelled demo data and supports an existing FastAPI backend when configured.

## Run the web app

```powershell
npm install
npm run dev
```

Copy `.env.example` to `.env`. Leave `VITE_API_BASE_URL` empty for the demo. To connect the earlier backend, set it to its host (for example `http://127.0.0.1:8000`); the app expects `/api/v1/villages` and `POST /api/sensor/readings`.

## Sensor integration

The ESP32 contract and example JSON are in [hardware/esp32/README.md](hardware/esp32/README.md). Store readings server-side; the public screen only displays a derived health score and safety instruction.

## Supabase and secure AI

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor. The included Edge Function skeleton returns constrained, concise recommendations. Put `OPENAI_API_KEY` only in Supabase Function secrets; never expose it as a Vite environment variable. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are allowed only when browser access is protected by RLS policies.

## Android APK path

After Android Studio plus Android SDK/JDK are installed:

```powershell
npm install
npx cap add android
npm run android:sync
npm run android:open
```

In Android Studio choose **Build → Build APK(s)**. The generated debug APK is normally under `android/app/build/outputs/apk/debug/`. It is not generated in this repository because the required Android SDK/toolchain is machine-specific.

## Included demo routes/features

- District dashboard: village score, risk, actions, AI-safe explanation, vector/heat/vaccine mock modules.
- Citizen view: local-language selector (English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Punjabi); no raw water metrics.
- ASHA portal: localStorage offline queue, sync simulator, symptom/source/visual-quality form.
- Alert simulator: SMS, voice/IVR, WhatsApp preview through a provider-agnostic abstraction.
- End-to-end flow and realistic demo data in [docs/DEMO_FLOW.md](docs/DEMO_FLOW.md).

## Architecture

Sensors → ESP32 → secure backend ingest → risk calculation and Supabase storage → official dashboard / citizen advisories / ASHA offline queue. External providers are intentionally simulated until credentials and approved services are added.
