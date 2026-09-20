import React, { useState } from 'react';
import { ObjetivoCena, ContadorCena, AntagonistaCena } from '../../types/tension';

interface EndSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  objetivos: ObjetivoCena[];
  contadores: ContadorCena[];
  antagonistas: AntagonistaCena[];
  onConfirmarEncerramento: (consequenciasFinais: string) => void;
}

export const EndSceneModal: React.FC<EndSceneModalProps> = ({
  isOpen,
  onClose,
  objetivos,
  contadores,
  antagonistas,
  onConfirmarEncerramento
}) => {
  const [consequencias, setConsequencias] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#171717] border border-[#292929] w-full max-w-2xl flex flex-col rounded-sm shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-[#292929] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[#A88952] border border-[#75603D]/60 px-1.5 py-0.5 rounded-sm">
              DESFECHO
            </span>
            <h2 className="font-serif text-xl text-[#F5F3EE]">
              Encerrar Cena de Tensão
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-[#666666] hover:text-[#F5F3EE] font-mono text-sm px-2 py-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs font-mono">
          
          <div className="text-[#666666] leading-relaxed">
            Uma Cena de Tensão em Reinos Oníricos não exige a eliminação física de todos os adversários para terminar. Revise o estado atual dos objetivos, contadores e ameaças para selar o desfecho:
          </div>

          {/* Objetivos da Cena */}
          <div className="bg-[#0B0B0B] border border-[#292929] p-4 rounded-sm space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-[#A88952] font-semibold">
              Objetivos da Cena
            </div>
            {objetivos.length === 0 ? (
              <div className="text-[#666666]">Nenhum objetivo formal registrado.</div>
            ) : (
              objetivos.map(obj => (
                <div key={obj.id} className="flex items-center justify-between py-1 border-b border-[#1f1f1f] last:border-none">
                  <span className="text-[#F5F3EE]">{obj.descricao}</span>
                  <span className={`px-2 py-0.5 text-[10px] uppercase rounded-sm ${
                    obj.estado === 'concluido'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                      : obj.estado === 'falhou'
                      ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                      : 'bg-[#292929] text-[#D9D7D2]'
                  }`}>
                    {obj.estado === 'concluido' ? 'Concluído' : obj.estado === 'falhou' ? 'Falhou' : 'Em Andamento'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Contadores da Cena */}
          <div className="bg-[#0B0B0B] border border-[#292929] p-4 rounded-sm space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-[#A88952] font-semibold">
              Contadores & Rituais
            </div>
            {contadores.length === 0 ? (
              <div className="text-[#666666]">Nenhum contador ativo na cena.</div>
            ) : (
              contadores.map(c => (
                <div key={c.id} className="flex items-center justify-between py-1 border-b border-[#1f1f1f] last:border-none">
                  <span className="text-[#F5F3EE]">{c.nome}</span>
                  <span className="text-[#D9D7D2]">
                    {c.valorAtual}/{c.valorMaximo} {c.concluido ? '(Concluído)' : ''}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Antagonistas Restantes */}
          <div className="bg-[#0B0B0B] border border-[#292929] p-4 rounded-sm space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-[#A88952] font-semibold">
              Ameaças Envolvidas
            </div>
            {antagonistas.length === 0 ? (
              <div className="text-[#666666]">Nenhuma ameaça na cena.</div>
            ) : (
              antagonistas.map(a => (
                <div key={a.id} className="flex items-center justify-between py-1 border-b border-[#1f1f1f] last:border-none">
                  <span className="text-[#F5F3EE]">{a.nome}</span>
                  <span className="text-[#D9D7D2]">
                    {a.vidaAtual <= 0 ? 'Neutralizado' : `${a.vidaAtual}/${a.vidaMaxima} Vida`}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Consequências Narrativas */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-1.5">
              Consequências Narrativas & Registro Final
            </label>
            <textarea
              rows={3}
              value={consequencias}
              onChange={(e) => setConsequencias(e.target.value)}
              placeholder="Ex: Os Desvelados conseguiram escapar pelo duto de ventilação, mas deixaram para trás o caderno de anotações da vítima. A Ruptura local aumentou..."
              className="w-full bg-[#0B0B0B] border border-[#292929] p-3 text-xs text-[#F5F3EE] rounded-sm focus:outline-none focus:border-[#A88952]"
            />
          </div>

        </div>

        {/* Rodapé / Botões */}
        <div className="px-6 py-4 border-t border-[#292929] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#D9D7D2] text-xs font-mono uppercase tracking-wider rounded-sm transition-colors"
          >
            Voltar e Continuar Cena
          </button>

          <button
            type="button"
            onClick={() => onConfirmarEncerramento(consequencias)}
            className="px-6 py-2 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-mono font-medium uppercase tracking-wider rounded-sm transition-colors"
          >
            Encerrar Cena Oficialmente →
          </button>
        </div>

      </div>
    </div>
  );
};
