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
  const [counters, setCounters] = useState<Contador[]>(role === 'mestre' ? fallback.counters : []);
  const countersRef = useRef<Contador[]>(role === 'mestre' ? fallback.counters : []);
  const pendingCounterWritesRef = useRef(new Map<string, Promise<Contador>>());
  const syncCounters = (items: Contador[]) => {
    countersRef.current = items;
    setCounters(items);
  };
  const [maps, setMaps] = useState<MapaNarrativo[]>(fallback.maps);
  const [tokens, setTokens] = useState<TokenMapa[]>(fallback.tokens);
  const pendingConditionWritesRef = useRef(new Map<string, Promise<TokenMapa>>());
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [error, setError] = useState<string>();
  const onCharacterUpdateRef = useRef(onCharacterUpdate);
  useEffect(() => { onCharacterUpdateRef.current = onCharacterUpdate; }, [onCharacterUpdate]);
  const presence = useSessionPresence(campaignId, userId, userName, role, enabled);

  useEffect(() => {
    if (!enabled || !campaignId || !userId) {
      setState(undefined); syncCounters(role === 'mestre' ? fallback.counters : []); setMaps(fallback.maps); setTokens(fallback.tokens); setReady(false); setStatus('offline'); return;
    }
    let active = true;
    setReady(false); setStatus('connecting'); setError(undefined);
    void liveTableRepository.load(campaignId, role === 'mestre').then(data => {
      if (!active) return;
      setState(data.state); syncCounters(role === 'mestre' ? data.counters : []); setMaps(data.maps); setTokens(data.tokens); setReady(true);
    }).catch(reason => { if (active) { setError(reason.message || String(reason)); setStatus('offline'); } });
    const channel = liveTableRepository.subscribe(campaignId, {
      state: item => active && setState(item),
      counter: (event, item) => {
        if (!active || role !== 'mestre' || pendingCounterWritesRef.current.has(item.id)) return;
        syncCounters(applyEvent(countersRef.current, event, item));
      },
      map: (event, item) => active && setMaps(items => applyEvent(items, event, item)),
      token: (event,item) => active && setTokens(items => {
        if (event === 'DELETE') return items.filter(t=>t.id!==item.id);
        // Keep the most recent local condition selection while queued saves
        // are in flight. Realtime echoes can arrive before the last write.
        const pending = pendingConditionWritesRef.current.has(item.id);
        const local = items.find(t=>t.id===item.id);
        return mergeToken(items, pending && local ? {...item,condicoes:local.condicoes} : item);
      }),
      resource: item => active && setTokens(items => items.map(t=>t.id===item.tokenId
        ? {...t,hpCurrent:item.hpCurrent,hpMax:item.hpMax} : t)),
      character: item => active && onCharacterUpdateRef.current?.(item),
      status: value => { if (active) setStatus(value === 'SUBSCRIBED' ? 'connected' : value === 'CHANNEL_ERROR' || value === 'TIMED_OUT' || value === 'CLOSED' ? 'offline' : 'connecting'); }
    }, role === 'mestre');
    return () => { active = false; void channel.unsubscribe(); };
  }, [campaignId, enabled, fallback.counters, fallback.maps, fallback.tokens, role, userId]);

  const action = useCallback(async <T,>(operation: () => Promise<T>) => {
    try { setError(undefined); return await operation(); }
    catch (reason) { const message = reason instanceof Error ? reason.message : String(reason); setError(message); throw reason; }
  }, []);

  return {
    state, counters, maps, tokens, ready, status, error, presence,
    saveState: (patch: Partial<LiveSessionState>) => userId ? action(async () => { const item = await liveTableRepository.saveState(campaignId, userId, patch); setState(item); return item; }) : Promise.reject(new Error('Sessão indisponível.')),
    addCounter: (item: DraftCounter) => action(async () => {
      if (role !== 'mestre') throw new Error('Contadores são exclusivos do Mestre.');
      const created = await liveTableRepository.addCounter({...item,visibilidade:'mestre_privado'});
      syncCounters(replace(countersRef.current, created));
      return created;
    }),
    patchCounter: (id: string, patch: Partial<Contador>) => action(async () => {
      if (role !== 'mestre') throw new Error('Contadores são exclusivos do Mestre.');
      const previous = countersRef.current.find(item => item.id === id);
      if (!previous) throw new Error('Contador não encontrado.');
      // Alterações rápidas refletem imediatamente e são salvas em sequência.
      syncCounters(replace(countersRef.current, {...previous,...patch,visibilidade:'mestre_privado'}));
      const prior = pendingCounterWritesRef.current.get(id);
      const write = (prior ? prior.catch(() => previous) : Promise.resolve(previous))
        .then(() => liveTableRepository.patchCounter(id, {...patch,visibilidade:'mestre_privado'}));
      pendingCounterWritesRef.current.set(id, write);
      try {
        const result = await write;
        if (pendingCounterWritesRef.current.get(id) === write) {
          pendingCounterWritesRef.current.delete(id);
          syncCounters(replace(countersRef.current,result));
        }
        return result;
      } catch(error) {
        if (pendingCounterWritesRef.current.get(id) === write) {
          pendingCounterWritesRef.current.delete(id);
          syncCounters(replace(countersRef.current,previous));
        }
        throw error;
      }
    }),
    removeCounter: (id: string) => action(async () => {
      if (role !== 'mestre') throw new Error('Contadores são exclusivos do Mestre.');
      await liveTableRepository.removeCounter(id);
      syncCounters(countersRef.current.filter(item => item.id !== id));
    }),
    addMap: (item: DraftMap) => action(async () => { const created = await liveTableRepository.addMap(item); setMaps(items => replace(items, created)); return created; }),
    patchMap: (id: string, patch: Partial<MapaNarrativo>) => action(async () => { const updated = await liveTableRepository.patchMap(id, patch); setMaps(items => replace(items, updated)); return updated; }),
    removeMap: (id: string) => action(async () => { await liveTableRepository.removeMap(id); setMaps(items => items.filter(item => item.id !== id)); }),
    addToken: (item: DraftToken) => action(async () => { const created = await liveTableRepository.addToken(item); setTokens(items => replace(items, created)); return created; }),
    patchToken: (id: string, patch: Partial<TokenMapa>) => action(async () => {
      if (patch.condicoes !== undefined) {
        if (role === 'observador') throw new Error('Observadores não podem alterar condições.');
        const previous = tokens.find(item=>item.id===id);
        if (!previous) throw new Error('Token não encontrado.');
        const next = [...patch.condicoes];
        // Local feedback first, preserving all unrelated map/token fields.
        setTokens(items=>items.map(item=>item.id===id?{...item,condicoes:next}:item));
        const queued = pendingConditionWritesRef.current.get(id);
        const write = (queued ? queued.catch(()=>previous) : Promise.resolve(previous))
          .then(()=>role==='mestre'
            ? liveTableRepository.patchToken(id,{condicoes:next})
            : liveTableRepository.patchOwnToken(id,{condicoes:next}));
        pendingConditionWritesRef.current.set(id,write);
        try {
          const updated = await write;
          if (pendingConditionWritesRef.current.get(id)===write) {
            setTokens(items=>mergeToken(items,updated));
          }
          return updated;
        } catch (error) {
          // Roll back only the latest attempt. Never clobber a newer click.
          if (pendingConditionWritesRef.current.get(id)===write) {
            setTokens(items=>items.map(item=>item.id===id
              ? {...item,condicoes:previous.condicoes || []} : item));
          }
          throw error;
        } finally {
          if (pendingConditionWritesRef.current.get(id)===write)
            pendingConditionWritesRef.current.delete(id);
        }
      }
      // Ajustes de PV são exibidos imediatamente, sem esperar a resposta da rede.
      // A RLS continua autorizando o write no Supabase; isto é apenas visual.
      const hpPatch = role === 'mestre' && patch.hpCurrent !== undefined && patch.hpMax !== undefined;
      let original: TokenMapa | undefined;
      if (hpPatch) {
        setTokens(items => {
          original = items.find(item => item.id === id);
          return items.map(item => item.id === id ? { ...item, ...patch } : item);
        });
      }
      try {
        const updated = role === 'mestre'
          ? await liveTableRepository.patchToken(id, patch)
          : await liveTableRepository.patchOwnToken(id, patch);
        setTokens(items => mergeToken(items, updated));
        return updated;
      } catch (error) {
        if (hpPatch) {
          // Não substitui uma alteração mais recente feita no mesmo token.
          setTokens(items => items.map(item =>
            item.id === id && original &&
            item.hpCurrent === patch.hpCurrent && item.hpMax === patch.hpMax
              ? { ...item, hpCurrent: original.hpCurrent, hpMax: original.hpMax }
              : item
          ));
        }
        throw error;
      }
    }),
    removeToken: (id: string) => action(async () => { await liveTableRepository.removeToken(id); setTokens(items => items.filter(item => item.id !== id)); })
    , patchCharacterResources: (id: string, patch: Partial<CharacterResourceUpdate>) => action(() => liveTableRepository.patchCharacterResources(id, patch))
  };
}
