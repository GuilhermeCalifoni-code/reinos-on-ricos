import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Campanha, CampanhaTipo, MembroCampanha } from '../../types/campaign';
import { campaignRepository } from './campaignRepository';
import { supabase } from '../../lib/supabaseClient';
import { campaignAssetService } from '../storage/campaignAssetService';

export function useRemoteCampaigns(userId?: string) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [membros, setMembros] = useState<MembroCampanha[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const requestSeq = useRef(0);

  const recarregar = useCallback(async () => {
    const currentRequest = ++requestSeq.current;
    if (!userId) {
      setCampanhas([]);
      setMembros([]);
      setCarregando(false);
      setErro('');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const [novasCampanhas, novosMembros] = await Promise.all([
        campaignRepository.listar(),
        campaignRepository.membros()
      ]);

      if (currentRequest !== requestSeq.current) return;
      const membrosAtivosPorCampanha = novosMembros.reduce((acc, membro) => {
        if (membro.status !== 'ativo') return acc;
        acc.set(membro.campaignId, (acc.get(membro.campaignId) || 0) + 1);
        return acc;
      }, new Map<string, number>());

      setMembros(novosMembros);
      setCampanhas(
        novasCampanhas.map(campanha => ({
          ...campanha,
          jogadoresCount: membrosAtivosPorCampanha.get(campanha.id) || 0
        }))
      );
    } catch (e: any) {
      if (currentRequest === requestSeq.current) {
        setCampanhas([]);
        setMembros([]);
        setErro(e.message || 'Não foi possível carregar as campanhas.');
      }
    } finally {
      if (currentRequest === requestSeq.current) setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    setCampanhas([]);
    setMembros([]);
    setErro('');

    if (!userId) {
      setCarregando(false);
      return;
    }

    void recarregar();
  }, [userId, recarregar]);

  // The membership publication is installed by migration 037. Refresh on
  // changes, reconnect and focus so a live GM sees newly linked sheets.
  useEffect(() => {
    if (!userId || !supabase) return;
    const api = supabase;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const refreshSoon = () => {
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => { void recarregar(); }, 150);
    };
    const channel = api.channel(`campaign-members:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_members' }, refreshSoon)
      .subscribe(status => { if (status === 'SUBSCRIBED') refreshSoon(); });
    window.addEventListener('focus', refreshSoon);
    return () => {
      if (pending) clearTimeout(pending);
      window.removeEventListener('focus', refreshSoon);
      void api.removeChannel(channel);
    };
  }, [userId, recarregar]);

  const criar = useCallback(async (input: {
    nome: string;
    descricao: string;
    imagemUrl: string;
    tipo: CampanhaTipo;
  }) => {
    const campanha = await campaignRepository.criar(input);
    await recarregar();
    return campanha;
  }, [recarregar]);

  const entrarComCodigo = useCallback(async (codigo: string) => {
    const id = await campaignRepository.entrarComCodigo(codigo);
    await recarregar();
    return id;
  }, [recarregar]);

  const remover = useCallback(async (campaignId: string) => {
    await campaignAssetService.removeCampaignAssets(campaignId);
    await campaignRepository.remover(campaignId);
    await recarregar();
  }, [recarregar]);

  const regenerarCodigo = useCallback(async (campaignId: string) => {
    const code = await campaignRepository.regenerarCodigo(campaignId);
    await recarregar();
    return code;
  }, [recarregar]);

  const atualizarMembro = useCallback(async (
    campaignId: string,
    memberUserId: string,
    patch: Parameters<typeof campaignRepository.atualizarMembro>[2]
  ) => {
    await campaignRepository.atualizarMembro(campaignId, memberUserId, patch);
    await recarregar();
  }, [recarregar]);

  const roleDaCampanha = useMemo(
    () => (campaignId?: string) =>
      membros.find(
        membro =>
          membro.campaignId === campaignId &&
          membro.userId === userId &&
          membro.status === 'ativo'
      )?.role,
    [membros, userId]
  );

  return {
    campanhas,
    membros,
    carregando,
    erro,
    recarregar,
    criar,
    entrarComCodigo,
    remover,
    regenerarCodigo,
    atualizarMembro,
    roleDaCampanha
  };
}
