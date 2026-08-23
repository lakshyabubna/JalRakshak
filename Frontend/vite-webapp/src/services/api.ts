import type { Reading, Village } from '../types';

// A deployed website calls its same-origin Vercel API. Capacitor builds must set
// VITE_API_BASE_URL to the deployed HTTPS URL at build time.
const deployedOrigin = import.meta.env.PROD && window.location.protocol.startsWith('http') ? window.location.origin : '';
const base = (import.meta.env.VITE_API_BASE_URL || deployedOrigin).replace(/\/$/, '');

async function request<T>(path: string, body: unknown): Promise<T> {
  if (!base && !import.meta.env.DEV) throw new Error('SMS service is not connected. Set VITE_API_BASE_URL to the JalRakshak backend.');
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || 'The server could not complete this request.');
  return payload as T;
}

export async function getVillages(fallback: Village[]) {
  if (!base && !import.meta.env.DEV) return fallback;
  try { const response = await fetch(`${base}/api/v1/villages`); return response.ok ? await response.json() : fallback; } catch { return fallback; }
}

export async function submitSensorReading(reading: Reading) {
  if (!base && !import.meta.env.DEV) return { mode: 'demo', accepted: true };
  return request('/api/sensor/readings', reading);
}

export type ResidentRegistration = { full_name: string; phone: string; village_name: string; sms_consent: boolean };
export type RegisteredResident = { id: string; full_name: string; village_name: string; masked_phone: string };
const localRegistrationKey = 'jr-registered-residents';

function localRegistrations(): RegisteredResident[] { return JSON.parse(localStorage.getItem(localRegistrationKey) || '[]'); }

export async function registerResident(registration: ResidentRegistration) {
  if (!base && !import.meta.env.DEV) {
    const record = { id: crypto.randomUUID(), full_name: registration.full_name, village_name: registration.village_name, masked_phone: `••••••${registration.phone.replace(/\D/g, '').slice(-4)}` };
    localStorage.setItem(localRegistrationKey, JSON.stringify([...localRegistrations(), record]));
    return { registration: record, mode: 'local-demo' };
  }
  return request<{ registration: RegisteredResident }>('/api/v1/registrations', registration);
}

export async function getRegisteredResidents(village_name: string) {
  if (!base && !import.meta.env.DEV) return localRegistrations().filter(record => record.village_name === village_name);
  const response = await fetch(`${base}/api/v1/registrations?village_name=${encodeURIComponent(village_name)}`);
  if (!response.ok) throw new Error('Could not load registered mobile numbers.');
  return response.json() as Promise<RegisteredResident[]>;
}

export async function removeRegisteredResident(id: string) {
  if (!base && !import.meta.env.DEV) {
    localStorage.setItem(localRegistrationKey, JSON.stringify(localRegistrations().filter(record => record.id !== id)));
    return;
  }
  const response = await fetch(`${base}/api/v1/registrations/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Could not remove the registered mobile number.');
}
export async function sendSmsDemo(village_name: string, message: string) { return request<{ sent_to: number; message: string; provider: string }>('/api/v1/alerts/sms/demo', { village_name, message }); }
export const alertPreview = (channel: string, village: string) => ({ channel, recipient: 'Registered, consented village households', message: `JalRakshak: ${village} water safety alert. Boil drinking water before use. Follow local health worker guidance.` });
