// Contrato de dados da Ficha do Desvelado — fase 1 (CONTRATO_FICHA_v3).
// Fonte de regras: Livro Básico VF18 (p. 11 Atributos, p. 14 Recursos, p. 29 Teste Onírico).
// Este módulo é puro: não acessa banco, rede nem interface.

import type {
  AtributoNome,
  Atributos,
  EquipamentoItem,
  ItemGeral,
  Personagem,
  RecursoItem,
  RecursosNivel
} from '../types/character';
import { validarDistribuicaoDominios } from './rulesEngine';

export const RECURSOS_ROTULOS: Record<RecursosNivel, string> = {
  1: 'Escasso',
  2: 'Limitado',
  3: 'Estável',
  4: 'Confortável',
  5: 'Abundante'
};

export const AVISO_RECURSOS_AJUSTADOS_P1 = 'recursos_ajustados_p1';

export const ATRIBUTO_ROTULOS: Record<AtributoNome, string> = {
  corpo: 'Corpo',
  mente: 'Mente',
  vontade: 'Vontade',
  vinculo: 'Vínculo'
};

const ATRIBUTOS: AtributoNome[] = ['corpo', 'mente', 'vontade', 'vinculo'];

export const ehRecursosNivel = (valor: unknown): valor is RecursosNivel =>
  typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 && valor <= 5;

const assinar = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

// ---------------------------------------------------------------------------
// Recursos e Itens Gerais: conversão do formato antigo
// ---------------------------------------------------------------------------

export interface RecursosEItensNormalizados {
  recursosNivel: RecursosNivel;
  itensGerais: ItemGeral[];
  avisosMigracao: string[];
}

/**
 * Converte o formato antigo (recursos como lista + equipamentos) para o novo.
 * Mesma regra da migration 048:
 * - item `rec-main` com quantidade 1–5 → nível escolhido pelo jogador;
 * - item `rec-1` (padrão antigo, vinha com 3) → nível 1 + aviso P1;
 * - qualquer outro item de recursos → Itens Gerais, preservado;
 * - equipamentos → Itens Gerais (descricao → observacoes, quantidade 1).
 */
export function converterRecursosLegados(
  recursos: unknown,
  equipamentos: unknown
): RecursosEItensNormalizados {
  const listaRecursos: RecursoItem[] = Array.isArray(recursos) ? recursos : [];
  const listaEquip: EquipamentoItem[] = Array.isArray(equipamentos) ? equipamentos : [];
  let recursosNivel: RecursosNivel = 1;
  const avisosMigracao: string[] = [];
  const itensGerais: ItemGeral[] = [];

  listaRecursos.forEach((item, indice) => {
    if (!item || typeof item !== 'object') return;
    const quantidade = Number((item as RecursoItem).quantidade);
    if (item.id === 'rec-main' && ehRecursosNivel(quantidade)) {
      recursosNivel = quantidade;
      return;
    }
    if (item.id === 'rec-1') {
      recursosNivel = 1;
      if (!avisosMigracao.includes(AVISO_RECURSOS_AJUSTADOS_P1)) avisosMigracao.push(AVISO_RECURSOS_AJUSTADOS_P1);
      return;
    }
    itensGerais.push(itemLegadoParaItemGeral(item, 'recursos', indice));
  });

  listaEquip.forEach((item, indice) => {
    if (!item || typeof item !== 'object') return;
    itensGerais.push(itemLegadoParaItemGeral(item, 'equipamentos', indice));
  });

  return { recursosNivel, itensGerais, avisosMigracao };
}

// Mesma regra da migração 048 (SQL): manter os dois iguais.
function itemLegadoParaItemGeral(item: any, origem: 'recursos' | 'equipamentos', indice: number): ItemGeral {
  const quantidade = Number(item.quantidade);
  const idOriginal = typeof item.id === 'string' && item.id.trim() ? item.id
    : typeof item.id === 'number' ? String(item.id) : `${origem}-${indice}`;
  return {
    id: `legado-${idOriginal}`,
    nome: typeof item.nome === 'string' && item.nome.trim() ? item.nome : 'Item',
    quantidade: Number.isInteger(quantidade) && quantidade > 0 ? quantidade : 1,
    observacoes: typeof item.observacoes === 'string' ? item.observacoes
      : typeof item.descricao === 'string' ? item.descricao : '',
    origemLegada: origem,
    dadosLegados: item
  };
}

/**
 * Garante que um personagem (do banco, do navegador ou importado) está no formato novo.
 * Se já tem `recursosNivel` válido, os campos novos são a fonte da verdade.
 */
export function normalizarPersonagem<T extends Partial<Personagem>>(p: T): T & RecursosEItensNormalizados {
  if (ehRecursosNivel(p.recursosNivel) && Array.isArray(p.itensGerais)) {
    return {
      ...p,
      recursosNivel: p.recursosNivel,
      itensGerais: p.itensGerais,
      avisosMigracao: Array.isArray(p.avisosMigracao) ? p.avisosMigracao : []
    };
  }
  const convertido = converterRecursosLegados(p.recursos, p.equipamentos);
  return {
    ...p,
    ...convertido,
    avisosMigracao: [...new Set([...(Array.isArray(p.avisosMigracao) ? p.avisosMigracao : []), ...convertido.avisosMigracao])]
  };
}

// ---------------------------------------------------------------------------
// Atributos (VF18 p. 11 e Tabela de Progressão)
// ---------------------------------------------------------------------------

/** Pontos de atributo acima da distribuição inicial: +1 no nível 3 e +1 no nível 5. */
export const aumentosDeAtributo = (nivel: number) => (nivel >= 3 ? 1 : 0) + (nivel >= 5 ? 1 : 0);

/** Lista os problemas de atributos. Lista vazia = ficha dentro da regra. */
export function problemasDeAtributos(
  atributos: Atributos | undefined,
  atributoPrincipal: AtributoNome | undefined | null,
  nivel: number
): string[] {
  const problemas: string[] = [];
  const valores = ATRIBUTOS.map(a => Number(atributos?.[a] ?? 0));
  if (valores.some(v => !Number.isInteger(v))) {
    problemas.push('Os atributos precisam ser números inteiros.');
    return problemas;
  }
  if (!atributoPrincipal || !ATRIBUTOS.includes(atributoPrincipal)) {
    problemas.push('Escolha o Atributo Principal.');
  }
  const valorPrincipal = atributoPrincipal ? Number(atributos?.[atributoPrincipal] ?? 0) : 0;
  const nomePrincipal = atributoPrincipal ? ATRIBUTO_ROTULOS[atributoPrincipal] : '';
  const soma = valores.reduce((a, b) => a + b, 0);

  if (nivel <= 2) {
    const ordenados = [...valores].sort((a, b) => a - b).join(',');
    if (ordenados !== '-1,0,1,2') {
      problemas.push(`Os atributos de nível ${nivel} devem ser +2, +1, 0 e −1 (hoje: ${valores.map(assinar).join(', ')}; soma ${soma}).`);
    }
    if (atributoPrincipal && valorPrincipal !== 2) {
      problemas.push(`O Atributo Principal (${nomePrincipal}) deve ter +2 (hoje: ${assinar(valorPrincipal)}).`);
    }
  } else {
    const somaEsperada = 2 + aumentosDeAtributo(nivel);
    if (soma !== somaEsperada) {
      problemas.push(`No nível ${nivel}, a soma dos atributos deve ser ${somaEsperada} (+2, +1, 0, −1 e ${aumentosDeAtributo(nivel)} aumento(s) da progressão); hoje é ${soma}.`);
    }
    if (atributoPrincipal && valorPrincipal < 2) {
      problemas.push(`O Atributo Principal (${nomePrincipal}) deve ter pelo menos +2 (hoje: ${assinar(valorPrincipal)}).`);
    }
    if (valores.some(v => v < -1)) {
      problemas.push('Nenhum atributo pode ficar abaixo de −1.');
    }
  }
  return problemas;
}

// ---------------------------------------------------------------------------
// Validação da ficha inteira
// ---------------------------------------------------------------------------

export type ModoValidacaoFicha = 'criacao' | 'edicao_atributos' | 'salvar';

export interface ValidacaoFicha {
  /** Impedem a ação. */
  erros: string[];
  /** Aparecem na ficha, mas não impedem salvar. */
  avisos: string[];
  bloqueia: boolean;
}

export function validarFichaDesvelado(
  p: Partial<Personagem>,
  { modo }: { modo: ModoValidacaoFicha }
): ValidacaoFicha {
  const nivel = Number(p.nivel ?? 1);
  const erros: string[] = [];
  const avisos: string[] = [];

  const atributos = problemasDeAtributos(p.atributos, p.atributoPrincipal, nivel);
  if (modo === 'salvar') avisos.push(...atributos);
  else erros.push(...atributos);

  if (modo === 'criacao' && p.dominios) {
    const dominios = validarDistribuicaoDominios(p.dominios, nivel);
    erros.push(...dominios.erros);
    if (dominios.pontosUsados !== dominios.pontosTotais) {
      erros.push(`Distribua todos os Pontos de Sonhar (${dominios.pontosUsados}/${dominios.pontosTotais}).`);
    }
  }

  if (p.recursosNivel !== undefined && !ehRecursosNivel(p.recursosNivel)) {
    erros.push('Recursos deve ser um nível de 1 a 5.');
  }
  if (p.ruptura !== undefined && (!Number.isInteger(p.ruptura) || p.ruptura < 0 || p.ruptura > 6)) {
    erros.push('Ruptura deve ficar entre 0 e 6.');
  }

  return { erros, avisos, bloqueia: erros.length > 0 };
}

// ---------------------------------------------------------------------------
// Teste Onírico (VF18 p. 29): sempre o Atributo Principal, com o valor atual
// ---------------------------------------------------------------------------

export function atributoDoTesteOnirico(p: Pick<Personagem, 'atributoPrincipal' | 'atributos'>): {
  atributo: AtributoNome;
  valor: number;
} {
  const atributo = p.atributoPrincipal;
  return { atributo, valor: Number(p.atributos?.[atributo] ?? 0) };
}
