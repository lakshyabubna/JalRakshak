import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const root = resolve(directory, '..');
const envPath = join(root, '.env.local');
const env = existsSync(envPath) ? Object.fromEntries(readFileSync(envPath, 'utf8').split(/\r?\n/).filter(line => line.includes('=') && !line.trim().startsWith('#')).map(line => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; })) : {};
const fast2smsKey = env.FAST2SMS_API_KEY;
const supabaseUrl = String(env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
const respond = (response, status, payload) => response.writeHead(status, headers).end(JSON.stringify(payload));
const digits = phone => String(phone).replace(/\D/g, '').slice(-10);
const publicRecord = record => ({ id: record.id, full_name: record.full_name, village_name: record.village_name, masked_phone: `••••••${digits(record.phone).slice(-4)}` });
const body = request => new Promise((resolveBody, reject) => { let raw = ''; request.on('data', chunk => { raw += chunk; }); request.on('end', () => { try { resolveBody(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON body.')); } }); });
async function supabase(method, path, payload) {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase server credentials are not configured.');
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || result?.details || 'Supabase could not complete the request.');
  return result;
}
const registrationsFor = village => supabase('GET', `registered_residents?select=id,full_name,phone,village_name&village_name=eq.${encodeURIComponent(village)}&sms_consent=is.true&is_active=is.true&order=created_at.desc`);

createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return response.writeHead(204, headers).end();
  const url = new URL(request.url, 'http://127.0.0.1:8001');
  try {
    if (request.method === 'GET' && url.pathname === '/health') return respond(response, 200, { status: 'ok', fast2sms_configured: Boolean(fast2smsKey), supabase_configured: Boolean(supabaseUrl && supabaseServiceKey) });
    if (request.method === 'GET' && url.pathname === '/api/v1/registrations') {
      const village = url.searchParams.get('village_name');
      return respond(response, 200, (await registrationsFor(village)).map(publicRecord));
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/registrations') {
      const registration = await body(request);
      if (!registration.sms_consent) return respond(response, 400, { detail: 'SMS consent is required.' });
      if (!registration.full_name?.trim() || digits(registration.phone).length !== 10 || !registration.village_name?.trim()) return respond(response, 400, { detail: 'Enter a name, village, and valid 10-digit Indian mobile number.' });
      const record = (await supabase('POST', 'registered_residents?on_conflict=village_name,phone', { full_name: registration.full_name.trim(), phone: digits(registration.phone), village_name: registration.village_name.trim(), sms_consent: true, is_active: true, consented_at: new Date().toISOString() }))[0];
      return respond(response, 201, { registration: publicRecord(record) });
    }
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/v1/registrations/')) {
      const id = url.pathname.split('/').at(-1);
      await supabase('DELETE', `registered_residents?id=eq.${encodeURIComponent(id)}`);
      return respond(response, 200, { removed: true });
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/alerts/sms/demo') {
      const input = await body(request);
      const message = String(input.message || '').trim();
      const recipients = await registrationsFor(input.village_name);
      if (!recipients.length) return respond(response, 400, { detail: 'No consented mobile numbers are registered for this village.' });
      if (!message || message.length > 450) return respond(response, 400, { detail: 'Enter an SMS message between 1 and 450 characters.' });
      if (!fast2smsKey) return respond(response, 503, { detail: 'FAST2SMS_API_KEY is not configured on the local SMS server.' });
      const query = new URLSearchParams({ route: 'q', message, numbers: recipients.map(record => digits(record.phone)).join(',') });
      const provider = await fetch(`https://www.fast2sms.com/dev/bulkV2?${query}`, { headers: { authorization: fast2smsKey, accept: 'application/json' } });
      const providerBody = await provider.json().catch(() => ({}));
      if (!provider.ok || !providerBody.return) return respond(response, 502, { detail: providerBody.message?.join(' ') || 'Fast2SMS rejected the message.' });
      return respond(response, 200, { provider: 'fast2sms', sent_to: recipients.length, message });
    }
    return respond(response, 404, { detail: 'Route not found.' });
  } catch (error) { return respond(response, 500, { detail: error instanceof Error ? error.message : 'Local SMS server failed.' }); }
}).listen(8001, '127.0.0.1', () => console.log('JalRakshak local SMS server running on http://127.0.0.1:8001'));
