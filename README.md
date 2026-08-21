# JalRakshak 2.0

Neo-brutalist rural public-health early warning system for SIH.

## Run the web app

```powershell
cd Frontend
pnpm install
pnpm dev
```

The app includes District, Village Public, and offline-first ASHA Worker views. It runs with seeded demo data by default; add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `OPENAI_API_KEY` in `Frontend/.env.local` for live integrations.

Run [supabase/schema.sql](supabase/schema.sql) in Supabase SQL Editor to create the full application tables. Treat all committed/demo access policies as development-only and replace them with authenticated role policies before production use.
