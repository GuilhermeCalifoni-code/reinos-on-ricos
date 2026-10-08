import type { TokenMapa } from '../../types/campaign';

export const positiveHp = (value: number | undefined, fallback = 1) =>
  Math.max(1, Math.min(99999, Math.round(value ?? fallback)));

export const currentHp = (value: number | undefined, max: number) =>
  Math.max(0, Math.min(max, Math.round(value ?? max)));

/** PV pertencem ao token, não à ficha-base vinculada. */
export function tokenHp(token: TokenMapa, baseCurrent?: number, baseMax?: number) {
  const max = positiveHp(token.hpMax, baseMax ?? baseCurrent ?? 1);
  return { current: currentHp(token.hpCurrent, max === 0 ? 1 : max) };
}

/** Para fichas antigas sem PV no token, inicia no valor atual da ficha original. */
export function resolvedTokenHp(token: TokenMapa, baseCurrent?: number, baseMax?: number) {
  const max = positiveHp(token.hpMax, baseMax ?? baseCurrent ?? 1);
  return { current: currentHp(token.hpCurrent ?? baseCurrent, max), max };
}

export function nextInstanceName(base: string, already: string[]): string {
  const used = new Set(already);
  const prefix = base.replace(/\s+#\d+$/, '').trim().slice(0,110) || 'Adversário';
  let index = 1;
  while (used.has(`${prefix} #${index}`)) index++;
  return `${prefix} #${index}`;
}

export const addTokenHp = (current: number, max: number, delta: number) =>
  Math.max(0, Math.min(max, current + Math.trunc(delta)));
