import React from 'react';
import { Contador } from '../../types/campaign';
import { CounterPanel } from './CounterPanel';

interface SessionPanelProps { contadores: Contador[]; mestre: boolean; }
export const SessionPanel: React.FC<SessionPanelProps> = ({ contadores, mestre }) => (
  <aside className="live-table__session">
    <div className="live-table__panel-head"><span>Sessão</span><small>local</small></div>
    <section className="live-table__record"><p className="ro-eyebrow">Registro vivo</p><h2>Em preparação</h2><p>Rolagens, eventos e mensagens reveladas ocuparão este painel quando a sincronização da sessão for adicionada.</p></section>
    <section className="live-table__counter-slot"><p>Contadores</p><CounterPanel campanhaId="" contadores={contadores} mestre={mestre} onAdicionar={() => undefined} onAtualizar={() => undefined} onRemover={() => undefined} onDuplicar={() => undefined} compacto /></section>
    {mestre && <section className="live-table__master-note"><p className="ro-eyebrow">Mestre</p><span>Controles de cena ativos. Pistas, adversários e notas privadas permanecem ocultos para jogadores.</span></section>}
  </aside>
);
