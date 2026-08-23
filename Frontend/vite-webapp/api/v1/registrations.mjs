import { cors, phoneDigits, publicRegistration, readBody, registrationsFor, respond, supabase } from '../_lib.mjs';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    if (req.method === 'GET') {
      const village = String(req.query.village_name || '').trim();
      if (village.length < 2) return respond(res, 400, { detail: 'A village name is required.' });
      return respond(res, 200, (await registrationsFor(village)).map(publicRegistration));
    }
    if (req.method === 'POST') {
      const registration = await readBody(req);
      const phone = phoneDigits(registration.phone);
      const village = String(registration.village_name || '').trim();
      const fullName = String(registration.full_name || '').trim();
      if (!registration.sms_consent) return respond(res, 400, { detail: 'SMS consent is required.' });
      if (fullName.length < 2 || fullName.length > 120 || village.length < 2 || village.length > 120 || phone.length !== 10) return respond(res, 400, { detail: 'Enter a name, village, and valid 10-digit Indian mobile number.' });
      const records = await supabase('POST', 'registered_residents?on_conflict=village_name,phone', { full_name: fullName, phone, village_name: village, sms_consent: true, is_active: true, consented_at: new Date().toISOString() });
      return respond(res, 201, { registration: publicRegistration(records[0]) });
    }
    return respond(res, 405, { detail: 'Method not allowed.' });
  } catch (error) { return respond(res, 500, { detail: error instanceof Error ? error.message : 'Registration service failed.' }); }
}
