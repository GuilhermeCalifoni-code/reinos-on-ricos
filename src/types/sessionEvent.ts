export type SessionEventType =
  | 'chat' | 'character_speech' | 'ooc' | 'whisper' | 'roll' | 'system'
  | 'rupture' | 'damage' | 'condition' | 'counter_update' | 'scene_change'
  | 'clue_reveal' | 'map_event';

export type SessionEventVisibility = 'todos' | 'mestre' | 'usuario_especifico';

export interface SessionEvent {
  id: string;
  campaignId: string;
  sessionId?: string;
  createdBy: string;
  characterId?: string;
  type: SessionEventType;
  visibility: SessionEventVisibility;
  recipientUserId?: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NewSessionEvent {
  sessionId?: string;
  characterId?: string;
  type: SessionEventType;
  visibility?: SessionEventVisibility;
  recipientUserId?: string;
  content: string;
  metadata?: Record<string, unknown>;
}
