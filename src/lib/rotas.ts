// T6 · Endereços (URLs) das telas.
// Cada tela principal tem um endereço próprio: o F5 mantém a tela,
// o botão voltar do navegador funciona e dá para copiar o link.
// Não usa biblioteca de rotas: o App continua mandando na tela ativa
// (`viewAtiva`) e este módulo só traduz tela ⇄ endereço.
import type { MainViewType } from '../components/Sidebar';

export interface Rota {
  view: MainViewType;
  campanhaId?: string;
}

const CAMINHO_FIXO: Partial<Record<MainViewType, string>> = {
  dashboard: '/',
  campanhas: '/campanhas',
  criar_campanha: '/campanhas/nova',
  personagens: '/personagens',
  compendio: '/compendio',
  comunidade: '/comunidade',
  configuracoes: '/configuracoes',
  administracao: '/admin'
};

const VIEW_DO_CAMINHO: Record<string, MainViewType> = Object.fromEntries(
  Object.entries(CAMINHO_FIXO).map(([view, caminho]) => [caminho, view as MainViewType])
);

// Ids de campanha são uuid; aceitamos qualquer trecho seguro para não quebrar ids antigos.
const ID_VALIDO = /^[A-Za-z0-9_-]{1,80}$/;

/** Endereço da tela. Telas de campanha sem campanha escolhida caem na lista. */
export function caminhoDaRota(view: MainViewType, campanhaId?: string | null): string {
  if (view === 'detalhe_campanha' || view === 'modo_mesa') {
    if (!campanhaId) return '/campanhas';
    const id = encodeURIComponent(campanhaId);
    return view === 'modo_mesa' ? `/mesa/${id}` : `/campanhas/${id}`;
  }
  return CAMINHO_FIXO[view] ?? '/';
}

/** Tela de um endereço. Endereço desconhecido abre o Início. */
export function rotaDoCaminho(pathname: string): Rota {
  const limpo = (pathname || '/').replace(/\/+$/, '') || '/';
  const fixa = VIEW_DO_CAMINHO[limpo];
  if (fixa) return { view: fixa };

  const partes = limpo.split('/').filter(Boolean);
  if (partes.length === 2) {
    let id = '';
    try { id = decodeURIComponent(partes[1]); } catch { id = ''; }
    if (ID_VALIDO.test(id)) {
      if (partes[0] === 'mesa') return { view: 'modo_mesa', campanhaId: id };
      if (partes[0] === 'campanhas') return { view: 'detalhe_campanha', campanhaId: id };
    }
  }
  return { view: 'dashboard' };
}

/** Telas que dependem de uma campanha aberta. */
export function telaDeCampanha(view: MainViewType): boolean {
  return view === 'detalhe_campanha' || view === 'modo_mesa';
}
