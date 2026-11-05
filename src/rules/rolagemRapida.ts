// Rolagem rápida da ficha: mesmas regras do rolador completo, em uma função só por teste.
import type { AtributoNome, Personagem, ResultadoOniricoTipo, ResultadoTesteMundano, ResultadoTesteOnirico } from '../types/character';
import type { NewSessionEvent } from '../types/sessionEvent';
import { executarTesteMundano, executarTesteOnirico } from './rulesEngine';
import { atributoDoTesteOnirico, ATRIBUTO_ROTULOS } from './fichaContrato';
import { ajustarRuptura } from './rupturaRapida';

/** Tabela de Dificuldade de Testes Mundanos (VF18, p. 30). */
export const DT_MUNDANA: { dt: number; rotulo: string }[] = [
  { dt: 8, rotulo: 'Trivial' }, { dt: 10, rotulo: 'Fácil' }, { dt: 12, rotulo: 'Comum' },
  { dt: 14, rotulo: 'Desafiador' }, { dt: 16, rotulo: 'Difícil' }, { dt: 18, rotulo: 'Muito Difícil' },
  { dt: 20, rotulo: 'Extraordinário' }
];

export const RESULTADO_ONIRICO_ROTULO: Record<ResultadoOniricoTipo, string> = {
  convergencia: 'Convergência',
  realidade_vence: 'Realidade vence',
  sonhar_vence: 'Sonhar vence',
  divergencia: 'Divergência'
};

export interface OpcoesMundano {
  dt: number;
  modoRolagem: 'normal' | 'vantagem' | 'desvantagem';
  usarFoco: boolean;
  modificador: number;
}

export interface OpcoesOnirico {
  usarFoco: boolean;
  condicaoAdversa: boolean;
  dificuldadeAdversario: number | null;
}

export interface RolagemRapidaFeita<R> {
  resultado: R;
  /** Ficha com o Foco gasto, ou null se nada mudou na ficha. */
  personagemAtualizado: Personagem | null;
  evento: NewSessionEvent;
}

const gastarFoco = (p: Personagem): Personagem => ({ ...p, focoAtual: Math.max(0, p.focoAtual - 1), atualizadoEm: new Date().toISOString() });

export function rolarMundanoRapido(p: Personagem, atributo: AtributoNome, op: OpcoesMundano): RolagemRapidaFeita<ResultadoTesteMundano> {
  const usarFoco = op.usarFoco && p.focoAtual > 0;
  const res = executarTesteMundano({
    atributo,
    valorAtributo: p.atributos[atributo] ?? 0,
    dt: op.dt,
    modificadores: op.modificador ? [{ nome: 'Modificador', valor: op.modificador }] : [],
    modoRolagem: op.modoRolagem,
    usarFoco
  });
  const evento: NewSessionEvent = {
    type: 'roll',
    characterId: p.id,
    content: `${p.nome} · ${res.atributo}: d20 ${res.dadoBruto} + ${res.valorAtributo >= 0 ? '+' : ''}${res.valorAtributo} = ${res.totalFinal} vs DT ${res.dt} — ${res.sucesso ? 'sucesso' : 'fracasso'}.`,
    metadata: { kind: 'mundano', dados: res.dadosRolados, total: res.totalFinal, dt: res.dt, sucesso: res.sucesso, atributo: res.atributo,
      roll: { kind: 'mundano', dados: res.dadosRolados, escolhido: res.dadoBruto, atributo: res.atributo, modificadores: res.totalModificadores, total: res.totalFinal, dt: res.dt, sucesso: res.sucesso, foco: res.focoUtilizado } }
  };
  return { resultado: res, personagemAtualizado: usarFoco ? gastarFoco(p) : null, evento };
}

export function rolarOniricoRapido(p: Personagem, op: OpcoesOnirico, rolarD20?: () => number): RolagemRapidaFeita<ResultadoTesteOnirico> {
  return rolarOniricoInterno(p, op, rolarD20);
}

function rolarOniricoInterno(
  p: Personagem, op: OpcoesOnirico, rolarD20?: () => number,
  forcar?: { dt: number; focoJaUsado: boolean }
): RolagemRapidaFeita<ResultadoTesteOnirico> {
  // Ao Forçar o Sonhar, os modificadores são os mesmos da rolagem original e o Foco não é gasto de novo.
  const usarFoco = forcar ? forcar.focoJaUsado : op.usarFoco && p.focoAtual > 0;
  const { atributo, valor } = atributoDoTesteOnirico(p);
  const res = executarTesteOnirico({
    atributo,
    valorAtributo: valor,
    dt: forcar ? forcar.dt : 13 + (op.condicaoAdversa ? 2 : 0),
    dificuldadeAdversario: forcar ? undefined : op.dificuldadeAdversario ?? undefined,
    modificadores: usarFoco ? [{ nome: 'Foco', valor: 2 }] : [],
    rolarD20
  });
  const evento: NewSessionEvent = {
    type: 'roll',
    characterId: p.id,
    content: `${p.nome} · ${forcar ? 'Forçar o Sonhar · ' : ''}${res.atributo}: Realidade ${res.dadoRealidade} (${res.totalRealidade}) · Sonhar ${res.dadoSonhar} (${res.totalSonhar}) vs DT ${res.dt} — ${res.resultado}.`,
    metadata: { kind: 'onirico', forcado: Boolean(forcar), realidade: res.dadoRealidade, sonhar: res.dadoSonhar, dt: res.dt, resultado: res.resultado, ruptura: res.impactoRuptura, foco: usarFoco,
      roll: { kind: 'onirico', realidade: res.dadoRealidade, sonhar: res.dadoSonhar, totalRealidade: res.totalRealidade, totalSonhar: res.totalSonhar, dt: res.dt, resultado: res.resultado, ruptura: res.impactoRuptura } }
  };
  return { resultado: res, personagemAtualizado: usarFoco && !forcar ? gastarFoco(p) : null, evento };
}

/** Só pode Forçar o Sonhar depois de um fracasso: Realidade vence ou Divergência (VF18, p. 30). */
export const podeForcarSonhar = (r: ResultadoTesteOnirico) => r.resultado === 'realidade_vence' || r.resultado === 'divergencia';

/**
 * Forçar o Sonhar (VF18, p. 30): o Desvelado recebe 1 Ruptura na hora e rola um novo Teste Onírico
 * com a mesma DT e os mesmos modificadores. Só uma vez por manifestação (a tela controla isso).
 * A Ruptura de Forçar soma com a consequência da nova rolagem, que é aplicada depois, à parte.
 */
export function forcarSonharRapido(
  p: Personagem, anterior: ResultadoTesteOnirico, rolarD20?: () => number
): RolagemRapidaFeita<ResultadoTesteOnirico> & { personagemAtualizado: Personagem } {
  if (!podeForcarSonhar(anterior)) throw new Error('Só é possível Forçar o Sonhar depois de um fracasso no Teste Onírico.');
  const comRuptura = ajustarRuptura(p, 1, 'Forçar o Sonhar');
  const focoJaUsado = anterior.modificadores.some(m => m.nome === 'Foco');
  const feita = rolarOniricoInterno(comRuptura, { usarFoco: false, condicaoAdversa: false, dificuldadeAdversario: null }, rolarD20, { dt: anterior.dt, focoJaUsado });
  return { ...feita, personagemAtualizado: comRuptura };
}

export const rotuloAtributo = (a: AtributoNome) => ATRIBUTO_ROTULOS[a] ?? a;
