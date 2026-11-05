// Subir de nível (Livro Básico VF18, Progressão, pp. 15–16).
// "Personagens não avançam porque acumularam pontos. Avançam porque alguma coisa mudou em sua história."
import type { AtributoNome, DominioNome, Personagem } from '../types/character';
import type { NewSessionEvent } from '../types/sessionEvent';
import { TABELA_PROGRESSAO } from './rulesData';
import { calcularDefesa, calcularResistencia } from './rulesEngine';

export const NIVEL_MAXIMO = 5;
export const DOMINIO_ROTULOS: Record<DominioNome, string> = {
  consciencia: 'Consciência', espaco: 'Espaço', fluxo: 'Fluxo', substancia: 'Substância', vida: 'Vida'
};
export const ATRIBUTO_MAXIMO = 4;

export interface GanhosDoNivel {
  nivel: number;
  vida: number;
  foco: number;
  pontosDeSonhar: number;
  atributo: number;
  dominioMaximo: number;
}

/** O que o personagem ganha ao chegar em `nivel`, pela Tabela de Progressão. */
export function ganhosDoNivel(nivel: number): GanhosDoNivel | null {
  const novo = TABELA_PROGRESSAO[nivel];
  const anterior = TABELA_PROGRESSAO[nivel - 1];
  if (!novo || !anterior) return null;
  return {
    nivel,
    vida: novo.vidaBase - anterior.vidaBase,
    foco: novo.focoBase - anterior.focoBase,
    pontosDeSonhar: novo.pontosDeSonhar - anterior.pontosDeSonhar,
    atributo: novo.pontosAtributoAdicionais - anterior.pontosAtributoAdicionais,
    dominioMaximo: novo.dominioMaximo
  };
}

export interface EscolhasDoNivel {
  /** Para onde vai o +1 de Atributo (níveis 3 e 5). Qualquer atributo, inclusive o Principal (Diogo, 05/11). */
  atributoExtra?: AtributoNome | null;
  /** Pontos de Sonhar novos, por Domínio. Só soma; não tira pontos que já estavam. */
  pontosNovos: Partial<Record<DominioNome, number>>;
  /** "O que mudou na história?" Vai para as anotações da ficha. */
  historia?: string;
}

/** Lista do que falta escolher. Vazia = pode subir. */
export function pendenciasDaSubida(p: Personagem, escolhas: EscolhasDoNivel): string[] {
  const g = ganhosDoNivel(p.nivel + 1);
  if (!g) return ['O personagem já está no nível máximo (5).'];
  const erros: string[] = [];
  if (g.atributo > 0) {
    if (!escolhas.atributoExtra) erros.push('Escolha o atributo que recebe +1.');
    else if ((p.atributos[escolhas.atributoExtra] ?? 0) + 1 > ATRIBUTO_MAXIMO) erros.push(`Esse atributo já está em +${ATRIBUTO_MAXIMO}, o máximo.`);
  }
  const novos = Object.values(escolhas.pontosNovos).reduce((t, v) => t + (v ?? 0), 0);
  if (novos !== g.pontosDeSonhar) {
    const faltam = g.pontosDeSonhar - novos;
    erros.push(faltam > 0 ? `Distribua ${faltam === 1 ? 'o Ponto de Sonhar novo' : `os ${faltam} Pontos de Sonhar novos`}.` : 'Há Pontos de Sonhar a mais.');
  }
  const dominios = somarDominios(p.dominios, escolhas.pontosNovos);
  for (const [d, v] of Object.entries(dominios)) {
    if (v > g.dominioMaximo) erros.push(`No nível ${g.nivel} o máximo por Domínio é ${g.dominioMaximo} (${DOMINIO_ROTULOS[d as DominioNome] ?? d}).`);
  }
  if (Object.values(dominios).filter(v => v >= 5).length > 1) erros.push('Só um Domínio pode chegar ao nível 5.');
  return erros;
}

function somarDominios(atuais: Personagem['dominios'], novos: Partial<Record<DominioNome, number>>) {
  const r = { ...atuais };
  for (const [d, v] of Object.entries(novos)) r[d as DominioNome] = (r[d as DominioNome] ?? 0) + (v ?? 0);
  return r;
}

/**
 * Aplica a subida: nível +1, PV e Foco novos somados ao máximo E ao atual,
 * +1 Atributo (níveis 3 e 5), Pontos de Sonhar novos, Defesa e Resistência recalculadas,
 * e a história anotada. Lança erro se faltar alguma escolha.
 */
export function aplicarSubidaDeNivel(p: Personagem, escolhas: EscolhasDoNivel, agora: Date = new Date()): Personagem {
  const pend = pendenciasDaSubida(p, escolhas);
  if (pend.length) throw new Error(pend.join(' '));
  const g = ganhosDoNivel(p.nivel + 1)!;
  const atributos = { ...p.atributos };
  if (g.atributo > 0 && escolhas.atributoExtra) atributos[escolhas.atributoExtra] = (atributos[escolhas.atributoExtra] ?? 0) + g.atributo;
  const historia = escolhas.historia?.trim();
  const nota = `Nível ${g.nivel} (${agora.toLocaleDateString('pt-BR')})${historia ? `: ${historia}` : ''}`;
  return {
    ...p,
    nivel: g.nivel,
    atributos,
    vidaMaxima: p.vidaMaxima + g.vida,
    vidaAtual: Math.min(p.vidaMaxima + g.vida, p.vidaAtual + g.vida),
    focoMaximo: p.focoMaximo + g.foco,
    focoAtual: Math.min(p.focoMaximo + g.foco, p.focoAtual + g.foco),
    dominios: somarDominios(p.dominios, escolhas.pontosNovos),
    resistencia: calcularResistencia(atributos.corpo),
    defesa: calcularDefesa(p.atributoPrincipal, atributos, g.nivel).defesa,
    anotacoesGerais: [p.anotacoesGerais?.trim(), nota].filter(Boolean).join('\n\n'),
    atualizadoEm: agora.toISOString()
  };
}

/** Aviso para o Registro Vivo da Mesa Ao Vivo. */
export const eventoSubidaDeNivel = (p: Personagem, nivel: number, historia?: string): NewSessionEvent => ({
  type: 'system',
  characterId: p.id,
  content: `${p.nome} chegou ao nível ${nivel}.${historia?.trim() ? ` ${historia.trim()}` : ''}`,
  metadata: { kind: 'level_up', nivel }
});
