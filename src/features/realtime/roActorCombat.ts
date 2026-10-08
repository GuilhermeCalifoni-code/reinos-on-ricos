import type { HabilidadeAtor } from '../../types/campaign';

export type ActorRoll =
  | { kind: 'mundano'; die: number; modifier: number; total: number; dt: number; success: boolean; critical: boolean }
  | { kind: 'onirico'; realidade: number; sonhar: number; modifier: number; dt: number;
      outcome: 'Convergência' | 'Realidade vence' | 'Sonhar vence' | 'Divergência'; ruptura: number }
  | { kind: 'dano'; die: number; faces: number; modifier: number; total: number; onirico: boolean };

const randomDie = (sides: number, rand: () => number) => Math.floor(Math.min(0.999999999,Math.max(0,rand())) * sides) + 1;
const score = (value: number) => Number.isFinite(value) ? Math.trunc(value) : 0;

export function rollActorMundano(dt = 12, modifier = 0, rand = Math.random): ActorRoll {
  const die = randomDie(20,rand);
  const total = die + score(modifier);
  return { kind:'mundano',die,modifier:score(modifier),total,dt,success:die===20 || total>=dt,critical:die===20 };
}

export function rollActorOnirico(dt = 13, modifier = 0, rand = Math.random): ActorRoll {
  const realidade = randomDie(20,rand);
  const sonhar = randomDie(20,rand);
  const r = realidade + score(modifier) >= dt;
  const s = sonhar + score(modifier) >= dt;
  const outcome = r && s ? 'Convergência' : r ? 'Realidade vence' : s ? 'Sonhar vence' : 'Divergência';
  const ruptura = r && s ? -1 : r ? 0 : s ? 1 : 2;
  return {kind:'onirico',realidade,sonhar,modifier:score(modifier),dt,outcome,ruptura};
}

export function rollActorDamage(faces: number, modifier: number, onirico: boolean, rand = Math.random): ActorRoll {
  if (![4,6,8,10,12,20].includes(faces)) throw new Error('Dado de dano inválido');
  const die = randomDie(faces,rand);
  return {kind:'dano',faces,die,modifier:score(modifier),total:die+score(modifier),onirico};
}

export const clampActorHp = (current: number, maximum: number, delta: number) =>
  Math.max(0,Math.min(Math.max(0,score(maximum)),score(current)+score(delta)));

export function abilityRoll(ability: HabilidadeAtor, rand = Math.random): ActorRoll | null {
  if (ability.categoria==='passiva' || !ability.teste || ability.teste==='reflexo') return null;
  if (ability.teste==='onirico') return rollActorOnirico(ability.dt ?? 13,ability.modificador ?? 0,rand);
  return rollActorMundano(ability.dt ?? 12,ability.modificador ?? 0,rand);
}
