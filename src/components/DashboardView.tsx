import React, { useState } from 'react';
import { Campanha } from '../types/campaign';
import { Personagem } from '../types/character';

interface DashboardViewProps {
  campanhas: Campanha[];
  userName?: string;
  personagens?: Personagem[];
  onNovaCampanha: () => void;
  onNovoPersonagem?: () => void;
  onAbrirPersonagem?: (personagem: Personagem) => void;
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
  userName,
  personagens = [],
  onNovaCampanha,
  onNovoPersonagem,
  onAbrirPersonagem,
  onContinuarCampanha,
  onDetalhesCampanha,
  onEntrarComCodigo,
  personagensParaVinculo = []
}) => {
  const [codigo, setCodigo] = useState('');
  const [personagemId, setPersonagemId] = useState('');
  const [erro, setErro] = useState('');

  const entrar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onEntrarComCodigo || !codigo.trim()) return;
    try {
      setErro('');
      await onEntrarComCodigo(codigo, personagemId || undefined);
      setCodigo('');
    } catch (e: any) {
      setErro(e.message || 'Não foi possível entrar com este código.');
    }
  };

  const primeiraCampanha = campanhas.find(campanha => campanha.status === 'em_andamento') || campanhas[0];
  const primeiroNome = userName?.trim().split(/\s+/)[0] || 'Desvelado';

  return (
    <section className="ro-dashboard mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-8 sm:py-9">
      <header className="ro-dashboard__welcome">
        <div>
          <p className="ro-eyebrow">Arquivo da Vigília</p>
          <h1>Bem-vindo de volta, {primeiroNome}.</h1>
          <p>A Vigília continua. Organize o que já sabe antes de atravessar o Sonhar outra vez.</p>
        </div>
        <blockquote>“Entre o concreto e o impossível, existem aqueles que ainda investigam.”</blockquote>
      </header>

      {primeiraCampanha && (
        <section className="ro-dashboard__continue">
          <div className="ro-dashboard__continue-copy">
            <p className="ro-eyebrow">Continuar na mesa</p>
            <h2>{primeiraCampanha.nome}</h2>
            <p>{primeiraCampanha.descricao}</p>
            <button onClick={() => onContinuarCampanha(primeiraCampanha)} className="ro-button">
              Entrar na mesa <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="ro-dashboard__continue-media">
            <img src={primeiraCampanha.imagemUrl} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />
          </div>
        </section>
      )}

      <div className="ro-dashboard__section-head">
        <div>
          <p className="ro-eyebrow">Crônicas</p>
          <h2>Minhas campanhas</h2>
        </div>
        <button onClick={onNovaCampanha} className="ro-button"><span aria-hidden="true">+</span> Nova campanha</button>
      </div>

      {onEntrarComCodigo && (
        <form onSubmit={entrar} className="ro-dashboard__join">
          <div>
            <strong>Entrar em uma campanha</strong>
            <span>Use o código enviado pelo Mestre.</span>
          </div>
          <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="REINO-XXXXXXXXXXXX" aria-label="Código de convite" />
          {personagensParaVinculo.length > 0 && (
            <select value={personagemId} onChange={e => setPersonagemId(e.target.value)} aria-label="Personagem para vincular">
              <option value="">Vincular ficha depois</option>
              {personagensParaVinculo.map(personagem => <option key={personagem.id} value={personagem.id}>{personagem.nome}</option>)}
            </select>
          )}
          <button className="ro-button--quiet">Entrar com código</button>
          {erro && <p className="ro-dashboard__join-error">{erro}</p>}
        </form>
      )}

      {campanhas.length === 0 ? (
        <div className="ro-empty-state mt-6 grid min-h-72 place-items-center px-6 text-center">
          <div className="max-w-sm">
            <img src="/ro-mark.svg" alt="" className="mx-auto h-20 w-16 opacity-70" />
            <p className="ro-eyebrow mt-4">O arquivo está vazio</p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--ro-paper)]">A primeira fissura começa aqui.</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ro-paper-muted)]">Crie uma campanha para reunir cenas, personagens, pistas e anotações de mesa.</p>
            <button onClick={onNovaCampanha} className="ro-button mt-6">Criar campanha</button>
          </div>
        </div>
      ) : (
        <div className="ro-dashboard__campaign-grid">
          {campanhas.map(campanha => (
            <article key={campanha.id} className="ro-dashboard__campaign-card">
              <button onClick={() => onDetalhesCampanha(campanha)} className="ro-dashboard__campaign-media" aria-label={`Abrir ${campanha.nome}`}>
                <img src={campanha.imagemUrl} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />
                <div className="ro-dashboard__campaign-overlay" />
                <div className="ro-dashboard__campaign-copy">
                  <span>{statusLabel[campanha.status]} · Sessão {String(campanha.sessaoAtual).padStart(2, '0')}</span>
                  <h3>{campanha.nome}</h3>
                  <small>{campanha.jogadoresCount || 0} participantes · Ruptura {campanha.rupturaGeral}/6</small>
                </div>
              </button>
              <div className="ro-dashboard__campaign-actions">
                <button onClick={() => onContinuarCampanha(campanha)}>Entrar na mesa</button>
                <button onClick={() => onDetalhesCampanha(campanha)}>Gerenciar</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="ro-dashboard__section-head ro-dashboard__section-head--characters">
        <div>
          <p className="ro-eyebrow">Desvelados</p>
          <h2>Seus personagens</h2>
        </div>
        {onNovoPersonagem && <button onClick={onNovoPersonagem} className="ro-button--quiet">+ Novo Desvelado</button>}
      </div>

      <div className="ro-dashboard__characters">
        {personagens.slice(0, 5).map(personagem => (
          <button key={personagem.id} onClick={() => onAbrirPersonagem?.(personagem)} className="ro-dashboard__character">
            <span className="ro-dashboard__character-avatar">{personagem.nome.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{personagem.nome}</strong>
              <small>{personagem.conceito} · Nível {personagem.nivel}</small>
            </span>
          </button>
        ))}
        {personagens.length === 0 && <p className="ro-dashboard__characters-empty">Nenhum Desvelado criado ainda.</p>}
        {onNovoPersonagem && (
          <button onClick={onNovoPersonagem} className="ro-dashboard__character ro-dashboard__character--new">
            <span className="ro-dashboard__character-avatar">+</span>
            <span><strong>Criar personagem</strong><small>Novo Desvelado</small></span>
          </button>
        )}
      </div>
    </section>
  );
};
