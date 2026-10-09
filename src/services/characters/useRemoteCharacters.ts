import { useCallback, useEffect, useMemo, useState } from 'react';
import { Personagem } from '../../types/character';
import { characterRepository } from './characterRepository';
import { CharacterResourceUpdate } from '../../features/realtime/liveTableRepository';
import { applyLiveCharacterResources } from './characterRealtimeState';

const mergeById = (items: Personagem[]) => {
  const map = new Map<string, Personagem>();
  items.forEach(item => map.set(item.id, item));
  return Array.from(map.values()).sort((a, b) =>
    new Date(b.atualizadoEm || 0).getTime() - new Date(a.atualizadoEm || 0).getTime()
  );
};

export function useRemoteCharacters(userId?: string, campaignId?: string, enabled = false) {
  const [characters, setCharacters] = useState<Personagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled || !userId) {
      setCharacters([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const own = await characterRepository.listarDoUsuario();
      if (!campaignId) {
        setCharacters(mergeById(own));
        return;
      }

      const campaign = await characterRepository.listar(campaignId);
      setCharacters(mergeById([...own, ...campaign]));
    } catch (cause: any) {
      setError(cause.message || 'Não foi possível carregar suas fichas da nuvem.');
    } finally {
      setLoading(false);
    }
  }, [campaignId, enabled, userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (character: Personagem) => {
    if (!userId) throw new Error('Sessão autenticada não encontrada.');
    const saved = await characterRepository.salvar({
      ...character,
      ownerUserId: character.ownerUserId || userId
    });
    setCharacters(items => mergeById([...items.filter(item => item.id !== saved.id), saved]));
    return saved;
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    await characterRepository.excluir(id);
    setCharacters(items => items.filter(item => item.id !== id));
  }, []);

  const merge = useCallback((received: Personagem[]) => {
    setCharacters(items => mergeById([...items, ...received]));
  }, []);

  // Eventos de mudança de PV/Foco/Ruptura: atualizar a UI sem reenviar ao banco.
  const applyResourceUpdate = useCallback((update: CharacterResourceUpdate) => {
    setCharacters(current => applyLiveCharacterResources(current, update));
  }, []);

  const personal = useMemo(
    () => characters.filter(item => item.ownerUserId === userId),
    [characters, userId]
  );

  return { characters, personal, loading, error, refresh, save, remove, merge, applyResourceUpdate };
}
