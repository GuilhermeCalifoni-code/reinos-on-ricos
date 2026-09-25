import React from 'react';
import { Sessao, SessaoStatus } from '../../types/campaign';

interface SessionPlannerProps {
  sessoes: Sessao[];
  onCreate: () => void;
  onOpen: (sessao: Sessao) => void;
}

const statusLabel: Record<SessaoStatus, string> = {
  planejamento: 'Em preparação',
  pronta: 'Pronta para a mesa',
  ao_vivo: 'Ao vivo',
  concluida: 'Concluída'
};

export const SessionPlanner: React.FC<SessionPlannerProps> = ({ sessoes, onCreate, onOpen }) => (
  <section className="space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--ro-line)] pb-5">
      <div>
        <p className="ro-eyebrow">Preparação da mesa</p>
        <h2 className="mt-2 font-serif text-3xl text-[var(--ro-paper)]">Sessões</h2>
        <p className="mt-1 text-sm text-[var(--ro-paper-muted)]">Capítulos, referências e decisões do Mestre em uma linha do tempo.</p>
      </div>
      <button onClick={onCreate} className="ro-button">+ Nova sessão</button>
    </header>

    <div className="space-y-3">
      {sessoes.map((sessao) => {
        const status = sessao.status || (sessao.concluida ? 'concluida' : 'planejamento');
        const referencias = (sessao.cenaIds?.length || 0) + (sessao.npcIds?.length || 0) + (sessao.pistaIds?.length || 0) + (sessao.localIds?.length || 0) + (sessao.adversarioIds?.length || 0);
        return (
          <article key={sessao.id} className="ro-session-row">
            <div className="ro-session-number">{String(sessao.numero).padStart(2, '0')}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="font-serif text-2xl text-[var(--ro-paper)]">{sessao.titulo}</h3>
                <span className="ro-session-status">{statusLabel[status]}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--ro-paper-muted)]">{sessao.data} · {sessao.jogadoresCount} participantes</p>
              {(sessao.descricao || sessao.resumo) && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ro-paper-muted)]">{sessao.descricao || sessao.resumo}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[var(--ro-ash)]">
                <span>{referencias} referências preparadas</span>
                {sessao.anotacoesMestre && <span className="text-[var(--ro-wine)]">Notas privadas do Mestre</span>}
              </div>
            </div>
            <button onClick={() => onOpen(sessao)} className="ro-button--quiet shrink-0">Abrir mesa</button>
          </article>
        );
      })}
      {sessoes.length === 0 && <div className="ro-empty-state p-10 text-center text-sm text-[var(--ro-paper-muted)]">Ainda não há sessões nesta campanha.</div>}
    </div>
  </section>
);
