# Vercel deployment handoff

This repository contains Vercel serverless API routes for consented mobile-number registrations and Fast2SMS delivery:

- `GET` / `POST` `/api/v1/registrations`
- `DELETE` `/api/v1/registrations/:id`
- `POST` `/api/v1/alerts/sms/demo`

They store registrations in Supabase and keep all credentials on Vercel. The Vite web app calls these routes from the same deployed domain automatically.

## Teammate deployment steps

1. Import this repository into Vercel and set the project root directory to this web-app folder.
2. Add these environment variables to both **Production** and **Preview**:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret)
   - `FAST2SMS_API_KEY` (secret)

3. Deploy. Do not add either secret as a `VITE_*` environment variable.
4. Verify `GET https://YOUR_DOMAIN/api/v1/registrations?village_name=Khadki` returns a JSON array.
5. For the Android build, create `.env.production.local` with only:

   ```text
   VITE_API_BASE_URL=https://YOUR_DOMAIN
   ```

   Then run `npm.cmd run android:sync` and build a fresh APK.

## Security before public use

The current prototype requires recorded SMS consent, masks phone numbers in all client responses, and keeps Fast2SMS/Supabase service credentials server-side. Before a public rollout, add authenticated ASHA/official roles and rate limiting to the API routes so untrusted users cannot register or trigger alerts.
