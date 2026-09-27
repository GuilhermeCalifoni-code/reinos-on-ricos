import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UserRole } from '../../types/auth';

export interface PresenceParticipant { userId: string; name: string; role: UserRole; online: boolean; }
export function useSessionPresence(campaignId: string | undefined, userId: string | undefined, name: string | undefined, role: UserRole, enabled: boolean) {
  const [participants, setParticipants] = useState<PresenceParticipant[]>([]);
  useEffect(() => { if (!enabled || !campaignId || !userId || !supabase) { setParticipants([]); return; } const channel = supabase.channel(`presence:${campaignId}`, { config: { presence: { key: userId } } }); const sync = () => { const state = channel.presenceState<Record<string, unknown>>(); setParticipants(Object.entries(state).flatMap(([id, values]) => values.map(value => ({ userId: id, name: String(value.name || 'Participante'), role: value.role as UserRole, online: true })))); }; channel.on('presence', { event: 'sync' }, sync).subscribe(async status => { if (status === 'SUBSCRIBED') await channel.track({ name: name || 'Participante', role, online: true }); }); return () => { void channel.untrack(); void channel.unsubscribe(); }; }, [campaignId, enabled, name, role, userId]);
  return participants;
}
