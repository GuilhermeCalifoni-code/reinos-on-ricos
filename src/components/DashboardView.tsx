import React, { useState } from 'react';
import { Campanha } from '../types/campaign';
import { Personagem } from '../types/character';

interface DashboardViewProps {
  campanhas: Campanha[];
  onNovaCampanha: () => void;
  onContinuarCampanha: (campanha: Campanha) => void;
  onDetalhesCampanha: (campanha: Campanha) => void;
  personagensParaVinculo?: Personagem[];
  onEntrarComCodigo?: (codigo: string, personagemId?: string) => Promise<void>;
}

const statusLabel: Record<Campanha['status'], string> = {
  em_andamento: 'Em andamento',
  planejamento: 'Em preparação',
  concluida: 'Concluída'
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  campanhas,
  onNovaCampanha,
  onContinuarCampanha,
  onDetalhesCampanha, onEntrarComCodigo, personagensParaVinculo = []
}) => {
  const [codigo, setCodigo] = useState(''); const [personagemId, setPersonagemId] = useState(''); const [erro, setErro] = useState('');
  const entrar = async (event: React.FormEvent) => { event.preventDefault(); if (!onEntrarComCodigo || !codigo.trim()) return; try { setErro(''); await onEntrarComCodigo(codigo, personagemId || undefined); setCodigo(''); } catch (e: any) { setErro(e.message || 'Não foi possível entrar com este código.'); } };
  return (
  <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-9">
    <header className="grid gap-6 border-b border-[var(--ro-line)] pb-6 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="ro-eyebrow">Arquivo de campanhas</p>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[var(--ro-paper)] sm:text-4xl">Meus Reinos</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ro-paper-muted)]">Prepare, registre e conduza as histórias que atravessam a vigília e o Sonhar.</p>
      </div>
      <div className="flex flex-wrap gap-3"><button onClick={onNovaCampanha} className="ro-button"><span aria-hidden="true">+</span> Nova campanha</button>{onEntrarComCodigo && <form onSubmit={entrar} className="flex flex-wrap gap-2"><input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="Código de convite" className="w-40 border border-[var(--ro-line)] bg-[var(--ro-input)] px-3 text-xs text-[var(--ro-paper)]" />{personagensParaVinculo.length > 0 && <select value={personagemId} onChange={e => setPersonagemId(e.target.value)} className="border border-[var(--ro-line)] bg-[var(--ro-input)] px-2 text-xs text-[var(--ro-paper)]"><option value="">Vincular ficha depois</option>{personagensParaVinculo.map(personagem => <option key={personagem.id} value={personagem.id}>{personagem.nome}</option>)}</select>}<button className="ro-button--quiet">Entrar com código</button></form>}{erro && <p className="basis-full text-xs text-rose-400">{erro}</p>}</div>
    </header>

    {campanhas.length === 0 ? (
      <div className="ro-empty-state mt-8 grid min-h-80 place-items-center px-6 text-center">
        <div className="max-w-sm">
          <p className="ro-eyebrow">O arquivo está vazio</p>
          <h2 className="mt-3 font-serif text-3xl text-[var(--ro-paper)]">A primeira fissura começa aqui.</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ro-paper-muted)]">Crie uma campanha para reunir cenas, personagens e anotações de mesa.</p>
          <button onClick={onNovaCampanha} className="ro-button mt-6">Criar campanha</button>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-5 pt-8 md:grid-cols-2 xl:grid-cols-3">
        {campanhas.map((campanha) => (
          <article key={campanha.id} className="ro-surface group flex min-h-[24rem] flex-col overflow-hidden">
            <div className="ro-campaign-card__media relative h-36 sm:h-40 overflow-hidden bg-[var(--ro-media-fallback)]">
              <img src={campanha.imagemUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover brightness-[.56] contrast-[.9] grayscale-[18%] transition duration-500 group-hover:scale-[1.035]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,17,.05),rgba(8,12,17,.94))]" />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="border border-[var(--ro-line-strong)] bg-[#12110f]/75 px-2 py-1 font-mono text-[9px] uppercase tracking-[.15em] text-[var(--ro-media-accent)]">{campanha.tipo}</span>
                <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[var(--ro-media-muted)]">{statusLabel[campanha.status]}</span>
              </div>
              <div className="absolute bottom-4 left-5 right-5">
                <p className="ro-eyebrow ro-eyebrow--media">{campanha.codigo}</p>
                <h2 className="mt-2 font-serif text-3xl leading-none text-[var(--ro-media-text)]">{campanha.nome}</h2>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <p className="line-clamp-3 text-sm leading-relaxed text-[var(--ro-paper-muted)]">{campanha.descricao}</p>
              <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-[var(--ro-line)] py-4 text-center">
                <div><dt className="font-mono text-[9px] uppercase tracking-[.12em] text-[var(--ro-ash)]">Mesa</dt><dd className="mt-1 text-sm text-[var(--ro-paper)]">{campanha.jogadoresCount || 0}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[.12em] text-[var(--ro-ash)]">Sessão</dt><dd className="mt-1 text-sm text-[var(--ro-paper)]">{String(campanha.sessaoAtual).padStart(2, '0')}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[.12em] text-[var(--ro-ash)]">Ruptura</dt><dd className="mt-1 text-sm text-[var(--ro-gold)]">{campanha.rupturaGeral}/6</dd></div>
              </dl>
              <div className="mt-auto flex gap-3 pt-5">
                <button onClick={() => onContinuarCampanha(campanha)} className="ro-button flex-1">Entrar na mesa <span aria-hidden="true">→</span></button>
                <button onClick={() => onDetalhesCampanha(campanha)} className="ro-button--quiet">Abrir</button>
              </div>
            </div>
          </article>
        ))}
        <button onClick={onNovaCampanha} className="ro-empty-state group flex min-h-[24rem] flex-col items-center justify-center p-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-[var(--ro-line-strong)] text-2xl text-[var(--ro-gold)] transition group-hover:bg-[var(--ro-gold)] group-hover:text-[#21180c]">+</span>
          <span className="mt-5 font-serif text-2xl text-[var(--ro-paper)]">Nova campanha</span>
          <span className="mt-2 max-w-52 text-xs leading-relaxed text-[var(--ro-paper-muted)]">Abra um espaço para a próxima história.</span>
        </button>
      </div>
    )}
  </section>
  );
};
