import { cors, phoneDigits, readBody, registrationsFor, respond, sendFast2Sms } from '../../../_lib.mjs';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return respond(res, 405, { detail: 'Method not allowed.' });
  try {
    const input = await readBody(req);
    const village = String(input.village_name || '').trim();
    const message = String(input.message || '').trim();
    if (village.length < 2 || !message || message.length > 450) return respond(res, 400, { detail: 'Enter a village and an SMS message between 1 and 450 characters.' });
    const recipients = await registrationsFor(village);
    if (!recipients.length) return respond(res, 400, { detail: 'No consented mobile numbers are registered for this village.' });
    await sendFast2Sms(recipients.map(record => phoneDigits(record.phone)), message);
    return respond(res, 200, { provider: 'fast2sms', sent_to: recipients.length, message });
  } catch (error) { return respond(res, 500, { detail: error instanceof Error ? error.message : 'SMS service failed.' }); }
}
