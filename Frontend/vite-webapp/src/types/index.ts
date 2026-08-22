export type Risk = 'HIGH' | 'MODERATE' | 'SAFE';
export type Village = { id: string; name: string; score: number; risk: Risk; water: string; mosquito: Risk; heat: Risk; action: string; explanation: string; online: boolean };
export type Reading = { device_id: string; village_id: string; temperature?: number; ph?: number; tds?: number; turbidity?: number; timestamp: string };
