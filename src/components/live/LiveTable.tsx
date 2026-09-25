import React, { useMemo, useState } from 'react';
import { AtributoNome, Personagem } from '../../types/character';
import { Campanha, ConteudoDeCena } from '../../types/campaign';
import { UserRole } from '../../types/auth';
import { DiceRoller } from '../DiceRoller';
import { DreamGuide } from '../DreamGuide';
import { RulesReference } from '../RulesReference';

type LiveTool = 'nenhuma' | 'dados' | 'sonhar' | 'ficha' | 'regras' | 'contadores' | 'mapa';

interface LiveTableProps {
  campanha: Campanha;
  personagens: Personagem[];
  role: UserRole;
  personagemJogadorId?: string;
  onVoltar: () => void;
  onAtualizarPersonagem: (personagem: Personagem) => void;
  onAbrirRuptura: (personagem: Personagem, delta: number, motivo: string) => void;
  onAbrirFicha: (personagem: Personagem) => void;
}

const stageCopy: Record<ConteudoDeCena, { title: string; hint: string }> = {
  ambientacao: { title: 'A cidade contém a respiração', hint: 'Ambientação da cena. O Mestre pode preparar imagem, mapa ou handout para esta área.' },
  imagem: { title: 'A imagem da cena', hint: 'Imagem narrativa pronta para a projeção da mesa.' },
  mapa: { title: 'Mapa narrativo', hint: 'Superfície reservada para pan, zoom e tokens em uma fase futura.' },
  handout: { title: 'Documento encontrado', hint: 'Handout revelado à mesa quando o Mestre decidir.' }
};

export const LiveTable: React.FC<LiveTableProps> = ({
  campanha, personagens, role, personagemJogadorId, onVoltar, onAtualizarPersonagem, onAbrirRuptura, onAbrirFicha
}) => {
  const mestre = role === 'mestre';
  const personagensVisiveis = useMemo(() => mestre ? personagens : personagens.filter(p => p.id === personagemJogadorId), [mestre, personagemJogadorId, personagens]);
  const [selecionadoId, setSelecionadoId] = useState(personagensVisiveis[0]?.id || personagens[0]?.id || '');
  const [ferramenta, setFerramenta] = useState<LiveTool>('nenhuma');
  const [conteudo, setConteudo] = useState<ConteudoDeCena>('ambientacao');
  const selecionado = personagens.find(p => p.id === selecionadoId) || personagensVisiveis[0] || null;
  const copy = stageCopy[conteudo];

  const selecionarFerramenta = (proxima: LiveTool) => setFerramenta(atual => atual === proxima ? 'nenhuma' : proxima);
  const ajustar = (personagem: Personagem, campo: 'vidaAtual' | 'focoAtual', delta: number) => {
    const maximo = campo === 'vidaAtual' ? personagem.vidaMaxima : personagem.focoMaximo;
    onAtualizarPersonagem({ ...personagem, [campo]: Math.max(0, Math.min(maximo, personagem[campo] + delta)), atualizadoEm: new Date().toISOString() });
  };

  return (
    <section className="live-table">
      <header className="live-table__bar">
        <button onClick={onVoltar} className="live-table__back">← Campanha</button>
        <div className="min-w-0 text-center">
          <p className="ro-eyebrow">{campanha.nome}</p>
          <h1>Sessão {String(campanha.sessaoAtual).padStart(2, '0')}</h1>
        </div>
        <span className="live-table__live"><i /> Ao vivo</span>
      </header>

      <div className="live-table__grid">
        <aside className="live-table__party">
          <div className="live-table__panel-head"><span>{mestre ? 'Personagens' : 'Seu personagem'}</span><small>{personagensVisiveis.length}</small></div>
          {personagensVisiveis.length === 0 ? <p className="live-table__empty">Nenhum personagem vinculado a esta mesa.</p> : personagensVisiveis.map(personagem => (
            <article key={personagem.id} className={`live-table__character ${selecionado?.id === personagem.id ? 'is-selected' : ''}`}>
              <button onClick={() => setSelecionadoId(personagem.id)} className="live-table__character-main">
                <span className="live-table__avatar">{personagem.nome.slice(0, 2).toUpperCase()}</span>
                <span><strong>{personagem.nome}</strong><small>{personagem.conceito} · Nível {personagem.nivel}</small></span>
              </button>
              <div className="live-table__resources">
                <span>Vida <b>{personagem.vidaAtual}/{personagem.vidaMaxima}</b></span>
                <span>Foco <b>{personagem.focoAtual}/{personagem.focoMaximo}</b></span>
                <span>PO <b>{personagem.protecaoOniricaAtual}/{personagem.protecaoOniricaMaxima}</b></span>
                <span className={personagem.ruptura >= 4 ? 'is-danger' : ''}>Ruptura <b>{personagem.ruptura}/6</b></span>
              </div>
              {mestre && <div className="live-table__character-actions"><button onClick={() => ajustar(personagem, 'vidaAtual', -1)}>− Vida</button><button onClick={() => ajustar(personagem, 'vidaAtual', 1)}>+ Vida</button><button onClick={() => onAbrirRuptura(personagem, 1, 'Ajuste na Mesa Ao Vivo')}>Ruptura</button></div>}
            </article>
          ))}
        </aside>

        <main className={`live-table__stage live-table__stage--${conteudo}`}>
          <div className="live-table__geometry" />
          {conteudo === 'imagem' && <img src={campanha.imagemUrl} alt="Cena atual" />}
          {conteudo === 'mapa' && <div className="live-table__map-grid" aria-hidden="true" />}
          <div className="live-table__stage-copy">
            <p className="ro-eyebrow">Cena atual</p>
            <h2>{copy.title}</h2>
            <p>{copy.hint}</p>
          </div>
          {mestre && <div className="live-table__scene-controls"><span>Conteúdo da cena</span>{(Object.keys(stageCopy) as ConteudoDeCena[]).map(tipo => <button key={tipo} onClick={() => setConteudo(tipo)} className={conteudo === tipo ? 'is-active' : ''}>{tipo}</button>)}</div>}
        </main>

        <aside className="live-table__session">
          <div className="live-table__panel-head"><span>Sessão</span><small>local</small></div>
          <section className="live-table__record">
            <p className="ro-eyebrow">Registro vivo</p>
            <h2>Em preparação</h2>
            <p>Rolagens, eventos e mensagens reveladas ocuparão este painel quando a sincronização da sessão for adicionada.</p>
          </section>
          <section className="live-table__counter-slot">
            <p>Contadores</p>
            <div><span>◔</span><strong>Porta Selada</strong><small>3 / 6</small></div>
            <em>Espaço reservado para a próxima fase.</em>
          </section>
          {mestre && <section className="live-table__master-note"><p className="ro-eyebrow">Mestre</p><span>Controles de cena ativos. Pistas, adversários e notas privadas permanecem ocultos para jogadores.</span></section>}
        </aside>
      </div>

      <nav className="live-table__dock" aria-label="Ferramentas da mesa">
        <button onClick={() => selecionarFerramenta('dados')} className={ferramenta === 'dados' ? 'is-active' : ''}>Dados</button>
        <button onClick={() => selecionarFerramenta('sonhar')} className={ferramenta === 'sonhar' ? 'is-active' : ''}>Sonhar</button>
        <button onClick={() => selecionarFerramenta('ficha')} className={ferramenta === 'ficha' ? 'is-active' : ''}>Ficha</button>
        <button onClick={() => selecionarFerramenta('contadores')} className={ferramenta === 'contadores' ? 'is-active' : ''}>Contadores</button>
        <button onClick={() => selecionarFerramenta('mapa')} className={ferramenta === 'mapa' ? 'is-active' : ''}>Mapa</button>
        <button onClick={() => selecionarFerramenta('regras')} className={ferramenta === 'regras' ? 'is-active' : ''}>Mais</button>
      </nav>

      {ferramenta !== 'nenhuma' && <section className="live-table__tool">
        {ferramenta === 'dados' && <DiceRoller personagemAtivo={selecionado} atributoInicial={undefined as AtributoNome | undefined} onSalvarPersonagem={onAtualizarPersonagem} onAbrirModalRuptura={(delta, motivo) => selecionado && onAbrirRuptura(selecionado, delta, motivo)} />}
        {ferramenta === 'sonhar' && <DreamGuide personagemAtivo={selecionado} onIrParaRoladorOnirico={() => setFerramenta('dados')} />}
        {ferramenta === 'ficha' && (selecionado ? <div className="live-table__quick-sheet"><p className="ro-eyebrow">Ficha rápida</p><h2>{selecionado.nome}</h2><p>Defesa {selecionado.defesa} · Resistência {selecionado.resistencia}</p><button onClick={() => onAbrirFicha(selecionado)} className="ro-button mt-4">Abrir ficha completa</button></div> : <p className="live-table__empty">Selecione um personagem.</p>)}
        {ferramenta === 'contadores' && <div className="live-table__quick-sheet"><p className="ro-eyebrow">Preparação</p><h2>Contadores de sessão</h2><p>A modelagem e o espaço visual estão reservados. A criação e a sincronização em tempo real serão feitas na próxima fase.</p></div>}
        {ferramenta === 'mapa' && <div className="live-table__quick-sheet"><p className="ro-eyebrow">Preparação</p><h2>Mapa narrativo</h2><p>Esta cena já aceita o modo mapa. Pan, zoom, tokens e revelação serão adicionados sem alterar a composição da Mesa Ao Vivo.</p></div>}
        {ferramenta === 'regras' && <RulesReference />}
      </section>}
    </section>
  );
};
