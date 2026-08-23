import { cors, respond, supabase } from '../../_lib.mjs';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'DELETE') return respond(res, 405, { detail: 'Method not allowed.' });
  try {
    await supabase('DELETE', `registered_residents?id=eq.${encodeURIComponent(String(req.query.id || ''))}`);
    return respond(res, 200, { removed: true });
  } catch (error) { return respond(res, 500, { detail: error instanceof Error ? error.message : 'Could not remove the registration.' }); }
}
