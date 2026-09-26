import React from 'react';
import { Contador } from '../../types/campaign';
import { CounterPanel } from './CounterPanel';
import { UserRole } from '../../types/auth';
import { NewSessionEvent, SessionEvent } from '../../types/sessionEvent';
import { SessionFeed } from './SessionFeed';

interface SessionPanelProps { contadores: Contador[]; mestre: boolean; role: UserRole; enabled: boolean; events: SessionEvent[]; loading: boolean; error: string; onSend: (event: NewSessionEvent) => Promise<unknown>; }
export const SessionPanel: React.FC<SessionPanelProps> = ({ contadores, mestre, role, enabled, events, loading, error, onSend }) => (
  <aside className="live-table__session">
    <div className="live-table__panel-head"><span>Sessão</span><small>{enabled ? 'online' : 'local'}</small></div>
    <SessionFeed events={events} loading={loading} error={error} enabled={enabled} role={role} onSend={onSend} />
    <section className="live-table__counter-slot"><p>Contadores</p><CounterPanel campanhaId="" contadores={contadores} mestre={mestre} onAdicionar={() => undefined} onAtualizar={() => undefined} onRemover={() => undefined} onDuplicar={() => undefined} compacto /></section>
    {mestre && <section className="live-table__master-note"><p className="ro-eyebrow">Mestre</p><span>Controles de cena ativos. Pistas, adversários e notas privadas permanecem ocultos para jogadores.</span></section>}
  </aside>
);
