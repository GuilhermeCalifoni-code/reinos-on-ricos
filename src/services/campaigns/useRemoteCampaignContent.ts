import { useCallback, useEffect, useState } from 'react';
import { Adversario, Anotacao, Cena, Handout, Local, LoreEntry, NPC, NovaSessaoInput, Pista, Sessao } from '../../types/campaign';
import { campaignContentRepository } from './campaignContentRepository';

const empty = {
  sessoes: [] as Sessao[],
  npcs: [] as NPC[],
  adversarios: [] as Adversario[],
  locais: [] as Local[],
  pistas: [] as Pista[],
  loreEntries: [] as LoreEntry[],
  anotacoes: [] as Anotacao[],
  cenas: [] as Cena[],
  handouts: [] as Handout[]
};

export function useRemoteCampaignContent(campaignId?: string, enabled = false) {
  const [state, setState] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const recarregar = useCallback(async () => {
    if (!enabled || !campaignId) { setState(empty); return; }
    setLoading(true); setError('');
    try { setState(await campaignContentRepository.carregar(campaignId)); }
    catch (cause: any) { setError(cause.message || 'Não foi possível carregar a preparação da campanha.'); }
    finally { setLoading(false); }
  }, [campaignId, enabled]);

  useEffect(() => { void recarregar(); }, [recarregar]);

  const run = useCallback(async (operation: () => Promise<unknown>) => {
    try { setError(''); await operation(); await recarregar(); }
    catch (cause: any) { setError(cause.message || 'Não foi possível salvar a preparação da campanha.'); throw cause; }
  }, [recarregar]);

  return {
    ...state, loading, error, recarregar,
    criarSessao: (id: string, dados: NovaSessaoInput) => run(() => campaignContentRepository.criarSessao(id, dados)),
    adicionarNPC: (item: Omit<NPC, 'id'>) => run(() => campaignContentRepository.adicionarNPC(item)),
    adicionarAdversario: (item: Omit<Adversario, 'id'>) => run(() => campaignContentRepository.adicionarAdversario(item)),
    adicionarLocal: (item: Omit<Local, 'id'>) => run(() => campaignContentRepository.adicionarLocal(item)),
    adicionarPista: (item: Omit<Pista, 'id'>) => run(() => campaignContentRepository.adicionarPista(item)),
    adicionarLore: (item: Omit<LoreEntry, 'id'>) => run(() => campaignContentRepository.adicionarLore(item)),
    adicionarAnotacao: (id: string, titulo: string, conteudo: string) => run(() => campaignContentRepository.adicionarAnotacao(id, titulo, conteudo)),
    adicionarCena: (item: Omit<Cena, 'id'>) => run(() => campaignContentRepository.adicionarCena(item)),
    atualizarCena: (id: string, patch: Partial<Cena>) => run(() => campaignContentRepository.atualizarCena(id, patch)),
    removerCena: (id: string) => run(() => campaignContentRepository.removerCena(id)),
    adicionarHandout: (item: Omit<Handout, 'id'>) => run(() => campaignContentRepository.adicionarHandout(item)),
    atualizarHandout: (id: string, patch: Partial<Handout>) => run(() => campaignContentRepository.atualizarHandout(id, patch)),
    removerHandout: (id: string) => run(() => campaignContentRepository.removerHandout(id))
  };
}
