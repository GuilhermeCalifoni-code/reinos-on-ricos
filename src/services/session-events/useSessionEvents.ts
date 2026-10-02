import { useCallback, useEffect, useState } from 'react';
import { NewSessionEvent, SessionEvent } from '../../types/sessionEvent';
import { sessionEventRepository } from './sessionEventRepository';

interface SessionEventsOptions { campaignId?: string; sessionId?: string; userId?: string; enabled: boolean; characterId?: string; }

export function useSessionEvents({ campaignId, sessionId, userId, enabled, characterId }: SessionEventsOptions) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!enabled || !campaignId || !userId) { setEvents([]); setError(''); return; }
    let active = true;
    setLoading(true); setError('');
    void sessionEventRepository.listar(campaignId, sessionId).then(items => { if (active) setEvents(items); }).catch((cause: any) => {
      if (active) setError(cause.message || 'Não foi possível carregar o Registro Vivo.');
    }).finally(() => { if (active) setLoading(false); });
    const channel = sessionEventRepository.assinar(campaignId, incoming => {
      if (!active || (sessionId && incoming.sessionId !== sessionId)) return;
      setEvents(current => current.some(item => item.id === incoming.id) ? current : [...current, incoming]);
    });
    return () => { active = false; void channel.unsubscribe(); };
  }, [campaignId, enabled, sessionId, userId]);
  const registrar = useCallback(async (input: NewSessionEvent) => {
    if (!enabled || !campaignId || !userId) throw new Error('O Registro Vivo exige uma campanha remota e uma sessão autenticada.');
    setError('');
    const saved = await sessionEventRepository.criar(campaignId, userId, { ...input, sessionId: input.sessionId || sessionId, characterId: input.characterId || characterId, metadata: input.metadata });
    setEvents(current => current.some(item => item.id === saved.id) ? current : [...current, saved]);
    return saved;
  }, [campaignId, characterId, enabled, sessionId, userId]);
  return { events, loading, error, registrar };
}
