import React from 'react';
import { Campanha } from '../types/campaign';

interface DashboardViewProps {
  campanhas: Campanha[];
  onNovaCampanha: () => void;
  onContinuarCampanha: (campanha: Campanha) => void;
  onDetalhesCampanha: (campanha: Campanha) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  campanhas,
  onNovaCampanha,
  onContinuarCampanha,
  onDetalhesCampanha
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-10">
      {/* Topo do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-10 border-b border-[#292929]/70 gap-6">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#F5F3EE] tracking-tight">
            Meus Reinos
          </h1>
          <p className="text-sm text-[#666666] mt-2 font-normal">
            Suas campanhas, histórias e mundos.
          </p>
        </div>

        <div>
          <button
            onClick={onNovaCampanha}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#292929] hover:bg-[#333333] border border-[#333333] hover:border-[#A88952]/50 text-[#F5F3EE] text-xs font-medium tracking-wider uppercase transition-colors rounded-sm"
          >
            <span className="text-[#A88952] text-sm leading-none">+</span>
            <span>Nova Campanha</span>
          </button>
        </div>
      </div>

      {/* Grid de Campanhas Grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
        {campanhas.map((campanha) => (
          <article
            key={campanha.id}
            className="bg-[#171717] border border-[#292929] flex flex-col group overflow-hidden transition-all duration-200 hover:border-[#3a3a3a]"
          >
            {/* Imagem Atmosférica */}
            <div className="relative h-56 w-full overflow-hidden bg-[#0B0B0B]">
              <img
                src={campanha.imagemUrl}
                alt={campanha.nome}
                className="w-full h-full object-cover filter brightness-[0.65] contrast-[0.95] grayscale-[25%] group-hover:scale-[1.02] transition-transform duration-500"
              />
              {/* Overlay Escuro com gradiente cinematográfico suave */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-[#171717]/40 to-transparent" />
              
              {/* Badge de Tipo ou Status discreto */}
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 bg-[#0B0B0B]/80 text-[#D9D7D2] border border-[#292929] rounded-sm">
                  {campanha.tipo}
                </span>
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE] font-normal leading-snug tracking-normal">
                  {campanha.nome}
                </h2>
                
                <p className="text-xs text-[#D9D7D2]/80 mt-2.5 line-clamp-2 leading-relaxed font-normal">
                  {campanha.descricao}
                </p>
              </div>

              <div className="pt-6">
                {/* Linha Divisória */}
                <div className="h-px bg-[#292929] mb-4" />

                {/* Metadados */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[#666666] tracking-wider uppercase mb-5">
                  <span>{campanha.jogadoresCount || 4} Jogadores</span>
                  <span>Sessão #{String(campanha.sessaoAtual).padStart(2, '0')}</span>
                  <span className="text-[#A88952]/90">Em Andamento</span>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onContinuarCampanha(campanha)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium tracking-wide uppercase transition-colors rounded-sm"
                  >
                    <span>Continuar</span>
                    <span className="text-xs">→</span>
                  </button>

                  <button
                    onClick={() => onDetalhesCampanha(campanha)}
                    className="py-2.5 px-4 bg-[#292929]/80 hover:bg-[#292929] hover:text-[#F5F3EE] text-[#D9D7D2] text-xs font-normal tracking-wide uppercase transition-colors rounded-sm border border-[#292929]"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        {/* Card Especial: Criar Nova Campanha */}
        <div
          onClick={onNovaCampanha}
          className="bg-[#171717]/40 border border-dashed border-[#292929] hover:border-[#A88952]/40 p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[420px] transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-full border border-[#292929] group-hover:border-[#A88952]/50 flex items-center justify-center text-[#666666] group-hover:text-[#A88952] text-xl font-light mb-4 transition-colors">
            +
          </div>

          <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal tracking-tight">
            Criar Nova Campanha
          </h3>

          <p className="text-xs text-[#666666] mt-2 max-w-[220px] leading-relaxed">
            Crie um novo espaço para sua próxima história.
          </p>
        </div>
      </div>
    </div>
  );
};
