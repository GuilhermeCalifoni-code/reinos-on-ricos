import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserRole } from '../../types/auth';
import { MembroCampanha } from '../../types/campaign';
import { NewSessionEvent, SessionEvent, SessionEventType, SessionEventVisibility } from '../../types/sessionEvent';

interface SessionFeedProps {
  events: SessionEvent[];
  loading: boolean;
  error: string;
  enabled: boolean;
  role: UserRole;
  userId?: string;
  members: MembroCampanha[];
  onSend: (event: NewSessionEvent) => Promise<unknown>;
}

const labels: Record<SessionEventType, string> = {
  chat: 'Mesa',
  character_speech: 'Personagem',
  ooc: 'Fora de personagem',
  whisper: 'Mensagem privada',
  roll: 'Rolagem',
  system: 'Sistema',
  rupture: 'Ruptura',
  damage: 'Dano',
  condition: 'Condição',
  counter_update: 'Contador',
  scene_change: 'Cena',
  clue_reveal: 'Pista revelada',
  map_event: 'Mapa'
};

const eventClass = (event: SessionEvent) =>
  `session-feed__event session-feed__event--${event.type}${event.visibility !== 'todos' ? ' is-private' : ''}${event.metadata.authorRole === 'mestre' ? ' is-master' : ''}${event.metadata.presentation === 'narrative' ? ' is-narrative' : ''}`;

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const SessionFeed: React.FC<SessionFeedProps> = ({
  events, loading, error, enabled, role, userId, members, onSend
}) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState<SessionEventType>(role === 'jogador' ? 'character_speech' : 'chat');
  const [visibility, setVisibility] = useState<SessionEventVisibility>('todos');
  const [presentation, setPresentation] = useState<'normal' | 'narrative'>('narrative');
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  const recipients = useMemo(() => members.filter(member =>
    member.status === 'ativo'
    && member.userId !== userId
    && (role !== 'jogador' || member.role === 'mestre')
  ), [members, role, userId]);

  useEffect(() => {
    setType(role === 'jogador' ? 'character_speech' : 'chat');
    setVisibility('todos');
  }, [role]);

  useEffect(() => {
    if (type === 'whisper') {
      setVisibility('usuario_especifico');
      if (!recipient) {
        const preferred = recipients[0];
        if (preferred) setRecipient(preferred.userId);
      }
    } else if (role === 'jogador') {
      setVisibility('todos');
      setRecipient('');
    }
  }, [type, role, recipient, recipients]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [events.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() || sending) return;
    if (visibility === 'usuario_especifico' && !recipient) {
      setSendError('Escolha um destinatário.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      await onSend({
        type,
        visibility,
        recipientUserId: visibility === 'usuario_especifico' ? recipient : undefined,
        content,
        metadata: { presentation: type === 'chat' && role === 'mestre' ? presentation : undefined }
      });
      setContent('');
    } catch (cause: any) {
      setSendError(cause.message || 'Não foi possível registrar o evento.');
    } finally {
      setSending(false);
    }
  };

  if (!enabled) {
    return (
      <section className="session-feed session-feed--offline">
        <p className="ro-eyebrow">Registro vivo</p>
        <h2>Disponível online</h2>
        <p>Entre em uma campanha remota para compartilhar mensagens, rolagens e eventos com a mesa.</p>
      </section>
    );
  }

  const allowedTypes: SessionEventType[] = role === 'mestre'
    ? ['chat', 'system', 'whisper', 'clue_reveal']
    : role === 'jogador'
      ? ['character_speech', 'chat', 'ooc', 'whisper']
      : [];

  const authorName = (event: SessionEvent) =>
    String(event.metadata.authorName || members.find(member => member.userId === event.createdBy)?.nome || 'Participante');

  return (
    <section className="session-feed">
      <div className="session-feed__header">
        <div><p className="ro-eyebrow">Registro vivo</p><h2>Mesa compartilhada</h2></div>
        <small>online</small>
      </div>

      <div ref={feedRef} className="session-feed__events" aria-live="polite">
        {loading && <p>Carregando eventos…</p>}
        {error && <p className="session-feed__error">{error}</p>}
        {!loading && !error && events.length === 0 && <p>O registro começa quando alguém fala, rola ou muda a cena.</p>}
        {events.map(event => (
          <article key={event.id} className={eventClass(event)}>
            <div>
              <strong>{authorName(event)} · {labels[event.type]}</strong>
              <small>
                {event.visibility === 'mestre'
                  ? 'Só Mestre'
                  : event.visibility === 'usuario_especifico'
                    ? `Privado · ${formatTime(event.createdAt)}`
                    : formatTime(event.createdAt)}
              </small>
            </div>
            <p>{event.content}</p>
          </article>
        ))}
      </div>

      {role === 'observador' ? (
        <p className="session-feed__readonly">Você acompanha a mesa como observador.</p>
      ) : (
        <form className="session-feed__composer" onSubmit={send}>
          <div className="session-feed__options">
            <select value={type} onChange={e => setType(e.target.value as SessionEventType)} aria-label="Tipo de mensagem">
              {allowedTypes.map(option => <option key={option} value={option}>{labels[option]}</option>)}
            </select>

            {role === 'mestre' && type === 'chat' && (
              <select value={presentation} onChange={e => setPresentation(e.target.value as 'normal' | 'narrative')} aria-label="Tom da mensagem">
                <option value="normal">Normal</option>
                <option value="narrative">Narrativa</option>
              </select>
            )}

            {role === 'mestre' && type !== 'whisper' && (
              <select value={visibility} onChange={e => setVisibility(e.target.value as SessionEventVisibility)} aria-label="Visibilidade">
                <option value="todos">Todos</option>
                <option value="mestre">Só Mestre</option>
                <option value="usuario_especifico">Usuário específico</option>
              </select>
            )}
          </div>

          {visibility === 'usuario_especifico' && (
            <select value={recipient} onChange={e => setRecipient(e.target.value)} aria-label="Destinatário" required>
              <option value="">Escolha o destinatário</option>
              {recipients.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.nome || 'Participante'} · {member.role}
                </option>
              ))}
            </select>
          )}

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={4000}
            placeholder={type === 'character_speech' ? 'O que seu personagem diz?' : type === 'whisper' ? 'Mensagem privada…' : 'Registrar na mesa…'}
            rows={3}
          />
          <button className="ro-button" disabled={sending}>{sending ? 'Enviando…' : 'Registrar'}</button>
          {sendError && <p className="session-feed__error">{sendError}</p>}
        </form>
      )}
    </section>
  );
};
