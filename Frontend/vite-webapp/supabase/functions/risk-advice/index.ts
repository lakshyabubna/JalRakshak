// Deploy with Supabase CLI. Set OPENAI_API_KEY only as an Edge Function secret.
// Return concise, user-safe factors; never return model chain-of-thought.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
serve(async (req) => {
  const input = await req.json();
  const factors = input.factors ?? [];
  const risk_level = input.risk_level ?? 'MODERATE';
  return Response.json({ risk_level, summary: `${factors.slice(0,2).join(' and ') || 'Recent health signals'} need local attention.`, recommended_actions: risk_level === 'HIGH' ? ['Issue boil-water advisory','Dispatch chlorination team','Notify ASHA worker'] : ['Inspect water source','Continue monitoring'] });
});
