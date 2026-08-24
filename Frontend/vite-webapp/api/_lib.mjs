const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

export function cors(req, res) {
  if (req.method !== 'OPTIONS') return false;
  res.writeHead(204, jsonHeaders).end();
  return true;
}

export function respond(res, status, payload) {
  res.writeHead(status, jsonHeaders).end(JSON.stringify(payload));
}

export async function readBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; }
  catch { throw new Error('Invalid JSON body.'); }
}

export function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

export function publicRegistration(record) {
  const phone = phoneDigits(record.phone);
  return { id: record.id, full_name: record.full_name, village_name: record.village_name, masked_phone: `••••••${phone.slice(-4)}` };
}

function config() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration is incomplete. Set Supabase server environment variables in Vercel.');
  return { url, key };
}

export async function supabase(method, path, payload) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || result?.details || 'Supabase could not complete the request.');
  return result;
}

export function registrationsFor(village) {
  return supabase('GET', `registered_residents?select=id,full_name,phone,village_name&village_name=eq.${encodeURIComponent(village)}&sms_consent=is.true&is_active=is.true&order=created_at.desc`);
}

export async function sendFast2Sms(numbers, message) {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) throw new Error('FAST2SMS_API_KEY is not configured in Vercel.');
  const query = new URLSearchParams({ route: 'q', message, numbers: numbers.join(',') });
  const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?${query}`, { headers: { authorization: key, accept: 'application/json' } });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.return) throw new Error(result?.message?.join(' ') || 'Fast2SMS rejected the message.');
  return result;
}
