import React from 'react';
import { BookOpen, Dices, Gauge, ScrollText, Sparkles } from 'lucide-react';

export type LiveTool = 'nenhuma' | 'dados' | 'sonhar' | 'ficha' | 'contadores' | 'regras';

interface LiveDockProps {
  ferramenta: LiveTool;
  onSelecionar: (ferramenta: LiveTool) => void;
  mestre: boolean;
}

const tools = [
  ['dados', 'Dados', Dices],
  ['sonhar', 'Sonhar', Sparkles],
  ['ficha', 'Ficha', ScrollText],
  ['contadores', 'Contadores', Gauge],
  ['regras', 'Regras', BookOpen]
] as const;

export const LiveDock: React.FC<LiveDockProps> = ({ ferramenta, onSelecionar, mestre }) => (
  <nav className="live-vtt__dock" aria-label="Ferramentas da mesa">
    {tools.filter(([id]) => mestre || id !== 'contadores').map(([id, label, Icon]) => (
      <button
        key={id}
        type="button"
        onClick={() => onSelecionar(id)}
        className={ferramenta === id ? 'is-active' : ''}
        aria-pressed={ferramenta === id}
        title={label}
      >
        <Icon size={18} />
        <span>{label}</span>
      </button>
    ))}
  </nav>
);
