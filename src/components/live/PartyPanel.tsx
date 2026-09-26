import React from 'react';
import { Personagem } from '../../types/character';

interface PartyPanelProps {
  personagens: Personagem[];
  selecionadoId: string;
  mestre: boolean;
  onSelecionar: (id: string) => void;
  onAjustar: (personagem: Personagem, campo: 'vidaAtual' | 'focoAtual', delta: number) => void;
  onRuptura: (personagem: Personagem) => void;
}

export const PartyPanel: React.FC<PartyPanelProps> = ({ personagens, selecionadoId, mestre, onSelecionar, onAjustar, onRuptura }) => (
  <aside className="live-table__party">
    <div className="live-table__panel-head"><span>{mestre ? 'Personagens' : 'Seu personagem'}</span><small>{personagens.length}</small></div>
    {personagens.length === 0 && <p className="live-table__empty">Nenhum personagem vinculado a esta mesa.</p>}
    {personagens.map(personagem => <article key={personagem.id} className={`live-table__character ${selecionadoId === personagem.id ? 'is-selected' : ''}`}>
      <button onClick={() => onSelecionar(personagem.id)} className="live-table__character-main"><span className="live-table__avatar">{personagem.nome.slice(0, 2).toUpperCase()}</span><span><strong>{personagem.nome}</strong><small>{personagem.conceito} · Nível {personagem.nivel}</small></span></button>
      <div className="live-table__resources"><span>Vida <b>{personagem.vidaAtual}/{personagem.vidaMaxima}</b></span><span>Foco <b>{personagem.focoAtual}/{personagem.focoMaximo}</b></span><span>PO <b>{personagem.protecaoOniricaAtual}/{personagem.protecaoOniricaMaxima}</b></span><span className={personagem.ruptura >= 4 ? 'is-danger' : ''}>Ruptura <b>{personagem.ruptura}/6</b></span></div>
      {mestre && <div className="live-table__character-actions"><button onClick={() => onAjustar(personagem, 'vidaAtual', -1)}>− Vida</button><button onClick={() => onAjustar(personagem, 'vidaAtual', 1)}>+ Vida</button><button onClick={() => onRuptura(personagem)}>Ruptura</button></div>}
    </article>)}
  </aside>
);
