import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { NewSessionEvent, SessionEvent } from '../../types/sessionEvent';

type SessionEventRow = {
  id: string; campaign_id: string; session_id: string | null; created_by: string;
  character_id: string | null; type: SessionEvent['type']; visibility: SessionEvent['visibility'];
  recipient_user_id: string | null; content: string; metadata: Record<string, unknown> | null; created_at: string;
};

const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado para o Registro Vivo.');
  return supabase;
};

const toEvent = (row: SessionEventRow): SessionEvent => ({
  id: row.id, campaignId: row.campaign_id, sessionId: row.session_id || undefined,
  createdBy: row.created_by, characterId: row.character_id || undefined, type: row.type,
  visibility: row.visibility, recipientUserId: row.recipient_user_id || undefined,
  content: row.content, metadata: row.metadata || {}, createdAt: row.created_at
});

export const sessionEventRepository = {
  async listar(campaignId: string) {
    const { data, error } = await client().from('session_events').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data as SessionEventRow[]).map(toEvent);
  },
  async criar(campaignId: string, userId: string, event: NewSessionEvent) {
    const { data, error } = await client().from('session_events').insert({
      campaign_id: campaignId, created_by: userId, session_id: event.sessionId || null,
      character_id: event.characterId || null, type: event.type, visibility: event.visibility || 'todos',
      recipient_user_id: event.recipientUserId || null, content: event.content.trim(), metadata: event.metadata || {}
    }).select().single();
    if (error) throw error;
    return toEvent(data as SessionEventRow);
  },
  assinar(campaignId: string, onInsert: (event: SessionEvent) => void): RealtimeChannel {
    return client().channel(`session-events:${campaignId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_events', filter: `campaign_id=eq.${campaignId}` }, payload => onInsert(toEvent(payload.new as SessionEventRow)))
      .subscribe();
  }
};
