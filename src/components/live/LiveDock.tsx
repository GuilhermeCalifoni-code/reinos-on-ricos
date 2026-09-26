import React from 'react';

export type LiveTool = 'nenhuma' | 'dados' | 'sonhar' | 'ficha' | 'contadores' | 'mapa' | 'regras';

interface LiveDockProps { ferramenta: LiveTool; onSelecionar: (ferramenta: LiveTool) => void; }
export const LiveDock: React.FC<LiveDockProps> = ({ ferramenta, onSelecionar }) => (
  <nav className="live-table__dock" aria-label="Ferramentas da mesa">
    {([['dados', 'Dados'], ['sonhar', 'Sonhar'], ['ficha', 'Ficha'], ['contadores', 'Contadores'], ['mapa', 'Mapa'], ['regras', 'Mais']] as const).map(([id, label]) => <button key={id} onClick={() => onSelecionar(id)} className={ferramenta === id ? 'is-active' : ''}>{label}</button>)}
  </nav>
);
