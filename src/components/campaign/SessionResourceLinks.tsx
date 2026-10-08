import React, { useState } from 'react';
import { Sessao } from '../../types/campaign';

export type SessionResourceField =
  | 'cenaIds' | 'mapaIds' | 'pistaIds' | 'handoutIds'
  | 'npcIds' | 'adversarioIds' | 'localIds';

interface SessionResourceLinksProps {
  resourceId: string;
  field: SessionResourceField;
  sessions: Sessao[];
  canManage: boolean;
  onUpdateSession: (id: string, patch: Partial<Sessao>) => Promise<unknown> | unknown;
}

/** A sessão guarda os vínculos, sem duplicar NPCs, pistas e outros recursos. */
export const SessionResourceLinks: React.FC<SessionResourceLinksProps> = ({
  resourceId, field, sessions, canManage, onUpdateSession
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const linked = sessions.filter(session => (session[field] || []).includes(resourceId));
  const available = sessions.filter(session => !(session[field] || []).includes(resourceId));

  const update = async (session: Sessao, include: boolean) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const current = session[field] || [];
      const next = include
        ? [...new Set([...current, resourceId])]
        : current.filter(id => id !== resourceId);
      await onUpdateSession(session.id, { [field]: next } as Partial<Sessao>);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a sessão.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="session-resource-links" onClick={event => event.stopPropagation()}>
      <span className="session-resource-links__label">Sessões vinculadas</span>
      <div className="session-resource-links__chips">
        {linked.length === 0 && <small>Sem sessão vinculada</small>}
        {linked.map(session => (
          <span key={session.id} className="session-resource-links__chip">
            {session.numero}. {session.titulo}
            {canManage && (
              <button type="button" disabled={busy} aria-label={`Desvincular de ${session.titulo}`}
                onClick={() => void update(session, false)}>×</button>
            )}
          </span>
        ))}
      </div>
      {canManage && available.length > 0 && (
        <select value="" disabled={busy} aria-label="Vincular recurso a uma sessão"
          onChange={event => {
            const target = available.find(item => item.id === event.target.value);
            if (target) void update(target, true);
          }}>
          <option value="">+ Vincular a uma sessão…</option>
          {available.map(session => (
            <option key={session.id} value={session.id}>Sessão {session.numero} — {session.titulo}</option>
          ))}
        </select>
      )}
      {error && <small role="alert" className="session-resource-links__error">{error}</small>}
    </div>
  );
};
