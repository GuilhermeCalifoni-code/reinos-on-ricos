import React from 'react';
import { Personagem } from '../types/character';

interface CharactersListViewProps {
  personagens: Personagem[];
  onSelecionarPersonagem: (p: Personagem) => void;
  onNovoPersonagem: () => void;
  onImportarJSON: () => void;
}

export const CharactersListView: React.FC<CharactersListViewProps> = ({
  personagens,
  onSelecionarPersonagem,
  onNovoPersonagem,
  onImportarJSON
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-[var(--ro-line)] gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ro-paper)] font-normal tracking-tight">
            Personagens Desvelados
          </h1>
          <p className="text-sm text-[var(--ro-ash)] mt-2">
            Agentes conscientes da fronteira entre a Vigília e o Sonhar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onImportarJSON}
            className="px-4 py-2 bg-[var(--ro-surface)] hover:bg-[var(--ro-surface-raised)] border border-[var(--ro-line)] text-[var(--ro-paper-muted)] text-xs font-mono uppercase tracking-wider rounded-sm transition-colors"
          >
            Importar (.json)
          </button>
          <button
            onClick={onNovoPersonagem}
            className="px-4 py-2 bg-[var(--ro-copper)] hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-medium uppercase tracking-wider rounded-sm transition-colors"
          >
            + Novo Desvelado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
        {personagens.map((pj) => (
          <div
            key={pj.id}
            onClick={() => onSelecionarPersonagem(pj)}
            className="bg-[var(--ro-surface)] border border-[var(--ro-line)] hover:border-[var(--ro-line-strong)] p-6 rounded-sm cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-2xl text-[var(--ro-paper)] group-hover:text-[var(--ro-copper)] transition-colors font-normal">
                    {pj.nome}
                  </h3>
                  <p className="text-xs font-mono text-[var(--ro-ash)] mt-1 uppercase tracking-wider">
                    {pj.conceito} · Nível {pj.nivel}
                  </p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 bg-[var(--ro-bg)] border border-[var(--ro-line)] text-[var(--ro-copper)]">
                  {pj.jogador || 'Jogador'}
                </span>
              </div>

              {/* Atributos Chave */}
              <div className="grid grid-cols-4 gap-2 pt-6 pb-2 text-center text-xs font-mono">
                <div className="p-2 bg-[var(--ro-bg)] border border-[var(--ro-line)] rounded-sm">
                  <div className="text-[10px] text-[var(--ro-ash)] uppercase">Cor</div>
                  <div className="text-[var(--ro-paper)] font-bold mt-0.5">{pj.atributos.corpo}</div>
                </div>
                <div className="p-2 bg-[var(--ro-bg)] border border-[var(--ro-line)] rounded-sm">
                  <div className="text-[10px] text-[var(--ro-ash)] uppercase">Men</div>
                  <div className="text-[var(--ro-paper)] font-bold mt-0.5">{pj.atributos.mente}</div>
                </div>
                <div className="p-2 bg-[var(--ro-bg)] border border-[var(--ro-line)] rounded-sm">
                  <div className="text-[10px] text-[var(--ro-ash)] uppercase">Von</div>
                  <div className="text-[var(--ro-paper)] font-bold mt-0.5">{pj.atributos.vontade}</div>
                </div>
                <div className="p-2 bg-[var(--ro-bg)] border border-[var(--ro-line)] rounded-sm">
                  <div className="text-[10px] text-[var(--ro-ash)] uppercase">Vín</div>
                  <div className="text-[var(--ro-paper)] font-bold mt-0.5">{pj.atributos.vinculo}</div>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-[var(--ro-line)] flex items-center justify-between text-xs font-mono">
              <div className="text-[var(--ro-paper-muted)]">
                <span className="text-[var(--ro-ash)] text-[10px] uppercase block">Vida</span>
                <span>{pj.vidaAtual}/{pj.vidaMaxima}</span>
              </div>

              <div className="text-[var(--ro-paper-muted)]">
                <span className="text-[var(--ro-ash)] text-[10px] uppercase block">Foco</span>
                <span>{pj.focoAtual}/{pj.focoMaximo}</span>
              </div>

              <div className="text-[var(--ro-paper-muted)]">
                <span className="text-[var(--ro-ash)] text-[10px] uppercase block">Ruptura</span>
                <span className={pj.ruptura >= 4 ? 'text-[var(--ro-paper)]' : 'text-[var(--ro-copper)]'}>
                  {pj.ruptura}/6
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
