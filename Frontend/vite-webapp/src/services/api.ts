import type { Reading, Village } from '../types';
const base = import.meta.env.VITE_API_BASE_URL;
export async function getVillages(fallback: Village[]) { if (!base) return fallback; try { const r=await fetch(`${base}/api/v1/villages`); return r.ok ? await r.json() : fallback; } catch { return fallback; } }
export async function submitSensorReading(reading: Reading) { if (!base) return { mode:'demo', accepted:true }; const r=await fetch(`${base}/api/sensor/readings`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(reading)}); if(!r.ok) throw new Error('Sensor API rejected reading'); return r.json(); }
export const alertPreview=(channel:string,village:string)=>({channel, recipient:'Village households & ASHA worker', message:`JalRakshak: ${village} water safety alert. Boil drinking water before use. Follow local health worker guidance.`});
