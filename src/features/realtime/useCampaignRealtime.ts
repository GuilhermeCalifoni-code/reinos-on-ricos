import { useCallback, useEffect, useRef, useState } from 'react';
import { Contador, MapaNarrativo, TokenMapa } from '../../types/campaign';
import { UserRole } from '../../types/auth';
import { CharacterResourceUpdate, LiveSessionState, liveTableRepository } from './liveTableRepository';
import { useSessionPresence } from './useSessionPresence';

type ConnectionStatus = 'offline' | 'connecting' | 'connected';
type DraftCounter = Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>;
type DraftMap = Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>;
type DraftToken = Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>;

const replace = <T extends { id: string }>(items: T[], item: T) => items.some(current => current.id === item.id) ? items.map(current => current.id === item.id ? item : current) : [...items, item];
const applyEvent = <T extends { id: string }>(items: T[], event: string, item: T) => event === 'DELETE' ? items.filter(current => current.id !== item.id) : replace(items, item);
const mergeToken = (items:TokenMapa[],next:TokenMapa) => {
  const prev=items.find(t=>t.id===next.id);
  return replace(items,{
    ...prev,...next,
    hpCurrent:next.hpCurrent ?? prev?.hpCurrent,
    hpMax:next.hpMax ?? prev?.hpMax
  });
};

export function useCampaignRealtime({ campaignId, userId, userName, role, enabled, fallback, onCharacterUpdate }: {
  campaignId: string;
  userId?: string;
  userName?: string;
  role: UserRole;
  enabled: boolean;
  fallback: { counters: Contador[]; maps: MapaNarrativo[]; tokens: TokenMapa[] };
  onCharacterUpdate?: (update: CharacterResourceUpdate) => void;
}) {
  const [state, setState] = useState<LiveSessionState>();
  const [counters, setCounters] = useState<Contador[]>(fallback.counters);
  const [maps, setMaps] = useState<MapaNarrativo[]>(fallback.maps);
  const [tokens, setTokens] = useState<TokenMapa[]>(fallback.tokens);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [error, setError] = useState<string>();
  const onCharacterUpdateRef = useRef(onCharacterUpdate);
  useEffect(() => { onCharacterUpdateRef.current = onCharacterUpdate; }, [onCharacterUpdate]);
  const presence = useSessionPresence(campaignId, userId, userName, role, enabled);

  useEffect(() => {
    if (!enabled || !campaignId || !userId) {
      setState(undefined); setCounters(fallback.counters); setMaps(fallback.maps); setTokens(fallback.tokens); setReady(false); setStatus('offline'); return;
    }
    let active = true;
    setReady(false); setStatus('connecting'); setError(undefined);
    void liveTableRepository.load(campaignId).then(data => {
      if (!active) return;
      setState(data.state); setCounters(data.counters); setMaps(data.maps); setTokens(data.tokens); setReady(true);
    }).catch(reason => { if (active) { setError(reason.message || String(reason)); setStatus('offline'); } });
    const channel = liveTableRepository.subscribe(campaignId, {
      state: item => active && setState(item),
      counter: (event, item) => active && setCounters(items => applyEvent(items, event, item)),
      map: (event, item) => active && setMaps(items => applyEvent(items, event, item)),
      token: (event,item) => active && setTokens(items => event==='DELETE'
        ? items.filter(t=>t.id!==item.id) : mergeToken(items,item)),
      resource: item => active && setTokens(items => items.map(t=>t.id===item.tokenId
        ? {...t,hpCurrent:item.hpCurrent,hpMax:item.hpMax} : t)),
      character: item => active && onCharacterUpdateRef.current?.(item),
      status: value => { if (active) setStatus(value === 'SUBSCRIBED' ? 'connected' : value === 'CHANNEL_ERROR' || value === 'TIMED_OUT' || value === 'CLOSED' ? 'offline' : 'connecting'); }
    });
    return () => { active = false; void channel.unsubscribe(); };
  }, [campaignId, enabled, fallback.counters, fallback.maps, fallback.tokens, userId]);

  const action = useCallback(async <T,>(operation: () => Promise<T>) => {
    try { setError(undefined); return await operation(); }
    catch (reason) { const message = reason instanceof Error ? reason.message : String(reason); setError(message); throw reason; }
  }, []);

  return {
    state, counters, maps, tokens, ready, status, error, presence,
    saveState: (patch: Partial<LiveSessionState>) => userId ? action(async () => { const item = await liveTableRepository.saveState(campaignId, userId, patch); setState(item); return item; }) : Promise.reject(new Error('Sessão indisponível.')),
    addCounter: (item: DraftCounter) => action(async () => { const created = await liveTableRepository.addCounter(item); setCounters(items => replace(items, created)); return created; }),
    patchCounter: (id: string, patch: Partial<Contador>) => action(async () => { const updated = await liveTableRepository.patchCounter(id, patch); setCounters(items => replace(items, updated)); return updated; }),
    removeCounter: (id: string) => action(async () => { await liveTableRepository.removeCounter(id); setCounters(items => items.filter(item => item.id !== id)); }),
    addMap: (item: DraftMap) => action(async () => { const created = await liveTableRepository.addMap(item); setMaps(items => replace(items, created)); return created; }),
    patchMap: (id: string, patch: Partial<MapaNarrativo>) => action(async () => { const updated = await liveTableRepository.patchMap(id, patch); setMaps(items => replace(items, updated)); return updated; }),
    removeMap: (id: string) => action(async () => { await liveTableRepository.removeMap(id); setMaps(items => items.filter(item => item.id !== id)); }),
    addToken: (item: DraftToken) => action(async () => { const created = await liveTableRepository.addToken(item); setTokens(items => replace(items, created)); return created; }),
    patchToken: (id: string, patch: Partial<TokenMapa>) => action(async () => {
      const updated = role === 'mestre'
        ? await liveTableRepository.patchToken(id, patch)
        : await liveTableRepository.patchOwnToken(id, patch);
      setTokens(items => mergeToken(items, updated));
      return updated;
    }),
    removeToken: (id: string) => action(async () => { await liveTableRepository.removeToken(id); setTokens(items => items.filter(item => item.id !== id)); })
    , patchCharacterResources: (id: string, patch: Partial<CharacterResourceUpdate>) => action(() => liveTableRepository.patchCharacterResources(id, patch))
  };
}
