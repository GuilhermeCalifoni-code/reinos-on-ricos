import React from 'react';
import { Campanha } from '../types/campaign';

export type MainViewType = 
  | 'dashboard' 
  | 'campanhas' 
  | 'personagens' 
  | 'criar_campanha' 
  | 'detalhe_campanha' 
  | 'modo_mesa'
  | 'configuracoes';

interface SidebarProps {
  viewAtiva: MainViewType;
  setViewAtiva: (v: MainViewType) => void;
  campanhas: Campanha[];
  campanhaAtivaId: string | null;
  onSelecionarCampanha: (id: string) => void;
  onNovaCampanha: () => void;
  onSair: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  viewAtiva,
  setViewAtiva,
  campanhas,
  campanhaAtivaId,
  onSelecionarCampanha,
  onNovaCampanha,
  onSair
}) => {
  return (
    <aside className="w-[220px] shrink-0 bg-[#171717] border-r border-[#292929] flex flex-col justify-between select-none h-screen sticky top-0">
      {/* Topo / Logo */}
      <div className="flex flex-col">
        {/* Brand / Logo */}
        <div 
          onClick={() => setViewAtiva('dashboard')}
          className="px-6 py-6 border-b border-[#292929] cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold tracking-widest text-[#A88952] border border-[#75603D]/60 px-1.5 py-0.5 rounded-sm">
              RO
            </span>
            <span className="font-serif text-base tracking-[0.18em] text-[#F5F3EE] group-hover:text-[#A88952] transition-colors uppercase font-medium">
              Reinos Oníricos
            </span>
          </div>
        </div>

        {/* Seção Início */}
        <div className="px-3 pt-6 pb-2">
          <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-[#666666] uppercase">
            Início
          </div>

          <nav className="space-y-0.5 text-xs font-normal">
            <button
              onClick={() => setViewAtiva('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-left transition-colors ${
                viewAtiva === 'dashboard'
                  ? 'bg-[#292929] text-[#D9D7D2]'
                  : 'text-[#666666] hover:text-[#D9D7D2] hover:bg-[#292929]/50'
              }`}
            >
              <span className="text-[#A88952] text-xs">▦</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setViewAtiva('campanhas')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-left transition-colors ${
                viewAtiva === 'campanhas'
                  ? 'bg-[#292929] text-[#D9D7D2]'
                  : 'text-[#666666] hover:text-[#D9D7D2] hover:bg-[#292929]/50'
              }`}
            >
              <span className="text-xs">◇</span>
              <span>Minhas Campanhas</span>
            </button>

            <button
              onClick={() => setViewAtiva('personagens')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-left transition-colors ${
                viewAtiva === 'personagens'
                  ? 'bg-[#292929] text-[#D9D7D2]'
                  : 'text-[#666666] hover:text-[#D9D7D2] hover:bg-[#292929]/50'
              }`}
            >
              <span className="text-xs">♙</span>
              <span>Personagens</span>
            </button>
          </nav>
        </div>

        {/* Seção Campanhas */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[10px] font-mono tracking-widest text-[#666666] uppercase">
              Campanhas
            </span>
            <button
              onClick={onNovaCampanha}
              className="text-[#666666] hover:text-[#A88952] text-xs transition-colors p-0.5"
              title="Nova Campanha"
            >
              +
            </button>
          </div>

          <div className="space-y-0.5 text-xs max-h-[38vh] overflow-y-auto pr-1">
            {campanhas.map(c => {
              const isActive = (viewAtiva === 'detalhe_campanha' || viewAtiva === 'modo_mesa') && campanhaAtivaId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelecionarCampanha(c.id);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-colors truncate ${
                    isActive
                      ? 'bg-[#292929] text-[#D9D7D2]'
                      : 'text-[#666666] hover:text-[#D9D7D2] hover:bg-[#292929]/40'
                  }`}
                >
                  <span className={`text-[8px] shrink-0 ${isActive ? 'text-[#A88952]' : 'text-[#666666]'}`}>
                    ●
                  </span>
                  <span className="truncate">{c.nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="px-3 py-4 border-t border-[#292929] space-y-0.5 text-xs font-normal">
        <button
          onClick={() => setViewAtiva('configuracoes')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-colors ${
            viewAtiva === 'configuracoes'
              ? 'bg-[#292929] text-[#D9D7D2]'
              : 'text-[#666666] hover:text-[#D9D7D2] hover:bg-[#292929]/40'
          }`}
        >
          <span className="text-xs">⚙</span>
          <span>Configurações</span>
        </button>

        <button
          onClick={onSair}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left text-[#666666] hover:text-[#D9D7D2] hover:bg-[#292929]/40 transition-colors"
        >
          <span className="text-xs">↪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
