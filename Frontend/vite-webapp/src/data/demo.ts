import type { Village } from '../types';
export const villages: Village[] = [
  { id:'v-khadki', name:'Khadki', score:42, risk:'HIGH', water:'BOIL WATER', mosquito:'HIGH', heat:'MODERATE', action:'Chlorination team queued', explanation:'Unsafe water signal combined with recent diarrhea reports needs action today.', online:true },
  { id:'v-pimpalgaon', name:'Pimpalgaon', score:64, risk:'MODERATE', water:'CHLORINATION REQUIRED', mosquito:'MODERATE', heat:'SAFE', action:'ASHA visit assigned', explanation:'Water source needs preventive chlorination and a field check.', online:true },
  { id:'v-dhanora', name:'Dhanora', score:88, risk:'SAFE', water:'SAFE', mosquito:'SAFE', heat:'MODERATE', action:'Routine monitoring', explanation:'Recent signals are stable. Keep water covered and continue routine checks.', online:false },
  { id:'v-sawargaon', name:'Sawargaon', score:76, risk:'SAFE', water:'SAFE', mosquito:'MODERATE', heat:'SAFE', action:'Drainage follow-up', explanation:'Water is safe; standing-water reports need a mosquito prevention visit.', online:true }
];
