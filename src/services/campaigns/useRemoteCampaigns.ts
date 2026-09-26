import { useCallback, useEffect, useMemo, useState } from 'react';
import { Campanha, CampanhaTipo, MembroCampanha } from '../../types/campaign';
import { campaignRepository } from './campaignRepository';

export function useRemoteCampaigns(userId?: string) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]); const [membros, setMembros] = useState<MembroCampanha[]>([]); const [carregando, setCarregando] = useState(false); const [erro, setErro] = useState('');
  const recarregar = useCallback(async () => { if (!userId) return; setCarregando(true); setErro(''); try { const [novasCampanhas, novosMembros] = await Promise.all([campaignRepository.listar(), campaignRepository.membros()]); setCampanhas(novasCampanhas); setMembros(novosMembros); } catch (e: any) { setErro(e.message || 'Não foi possível carregar as campanhas.'); } finally { setCarregando(false); } }, [userId]);
  useEffect(() => { void recarregar(); }, [recarregar]);
  const criar = useCallback(async (input: { nome: string; descricao: string; imagemUrl: string; tipo: CampanhaTipo }) => { const campanha = await campaignRepository.criar(input); await recarregar(); return campanha; }, [recarregar]);
  const entrarComCodigo = useCallback(async (codigo: string) => { const id = await campaignRepository.entrarComCodigo(codigo); await recarregar(); return id; }, [recarregar]);
  const roleDaCampanha = useMemo(() => (campaignId?: string) => membros.find(m => m.campaignId === campaignId && m.userId === userId)?.role, [membros, userId]);
  return { campanhas, membros, carregando, erro, recarregar, criar, entrarComCodigo, roleDaCampanha };
}
