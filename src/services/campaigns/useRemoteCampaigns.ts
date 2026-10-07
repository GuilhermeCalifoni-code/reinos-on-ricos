import { useCallback, useEffect, useMemo, useState } from 'react';
import { Campanha, CampanhaTipo, MembroCampanha } from '../../types/campaign';
import { campaignRepository } from './campaignRepository';
import { campaignAssetService } from '../storage/campaignAssetService';

export function useRemoteCampaigns(userId?: string) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [membros, setMembros] = useState<MembroCampanha[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
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
      setCampanhas([]);
      setMembros([]);
      setErro(e.message || 'Não foi possível carregar as campanhas.');
    } finally {
      setCarregando(false);
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
