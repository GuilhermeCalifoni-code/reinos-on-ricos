import React, { useState } from 'react';
import { AlertTriangle, History, ArrowRight, X, Check, RefreshCw } from 'lucide-react';
import { Personagem, RupturaLog } from '../types/character';

interface RupturaModalProps {
  personagem: Personagem;
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (personagemAtualizado: Personagem) => void;
  ajusteSugerido?: {
    delta: number;
    motivo: string;
    origem: 'automatica' | 'manual';
  } | null;
}

export const RupturaModal: React.FC<RupturaModalProps> = ({
  personagem,
  isOpen,
  onClose,
  onSalvar,
  ajusteSugerido
}) => {
  const [delta, setDelta] = useState<number>(ajusteSugerido?.delta ?? 1);
  const [motivo, setMotivo] = useState<string>(ajusteSugerido?.motivo ?? '');
  const [abaHistorico, setAbaHistorico] = useState<boolean>(false);

  if (!isOpen) return null;

  const valorAtual = personagem.ruptura;
  let novoCalculado = Math.min(6, Math.max(0, valorAtual + delta));
  const atingiuLimite6 = novoCalculado === 6;

  const handleConfirmar = () => {
    const novoValorFinal = novoCalculado;
    const historicoAdicional: RupturaLog[] = [];

    const logEntrada: RupturaLog = {
      id: 'rup-' + Date.now(),
      dataHora: new Date().toLocaleTimeString('pt-BR') + ' ' + new Date().toLocaleDateString('pt-BR'),
      valorAnterior: valorAtual,
      novoValor: novoCalculado,
      motivo: motivo.trim() || (delta >= 0 ? `Aumento de +${delta}` : `Redução de ${delta}`),
      origem: ajusteSugerido?.origem || 'manual'
    };
    historicoAdicional.push(logEntrada);



    const atualizado: Personagem = {
      ...personagem,
      ruptura: novoValorFinal,
      historicoRuptura: [...historicoAdicional, ...(personagem.historicoRuptura || [])]
    };

    onSalvar(atualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#11141c] border border-slate-700/80 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161b26]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] uppercase tracking-wider">
                Trilha de Ruptura (0 a 6)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {personagem.nome} · Registro Transparente de Tensão Onírica
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 text-xs font-mono">
          <button
            onClick={() => setAbaHistorico(false)}
            className={`py-2 px-3 border-b-2 font-medium transition ${
              !abaHistorico 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Alteração de Ruptura
          </button>
          <button
            onClick={() => setAbaHistorico(true)}
            className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
              abaHistorico 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Histórico ({personagem.historicoRuptura?.length || 0})
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!abaHistorico ? (
            <>
              {/* Visualizador da Trilha de 0 a 6 */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-2 uppercase">
                  Progressão da Trilha (0 a 6):
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((num) => {
                    const isAtual = num === valorAtual;
                    const isNovo = num === novoCalculado;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDelta(num - valorAtual)}
                        className={`h-12 rounded flex flex-col items-center justify-center border font-mono text-sm transition-all ${
                          isNovo
                            ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold ring-2 ring-rose-500/40'
                            : isAtual
                            ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                            : num <= novoCalculado
                            ? 'bg-slate-900 border-rose-900/50 text-rose-400/80'
                            : 'bg-slate-950/60 border-slate-800 text-slate-600 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">{num}</span>
                        <span className="text-[9px] uppercase tracking-tighter opacity-70">
                          {num === 0 ? '0' : num === 6 ? 'Efeito' : `${num}/6`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comparativo de Alteração */}
              <div className="bg-slate-950/80 border border-slate-800 rounded p-3 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Valor Anterior: <strong className="text-slate-100">{valorAtual}/6</strong></span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <span>Novo Valor: <strong className="text-rose-400">{novoCalculado}/6</strong></span>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                  A Ruptura mede tensão acumulada. O livro não atribui estados ou sintomas automáticos aos valores intermediários.
                </p>
              </div>

              {atingiuLimite6 && (
                <div className="p-3 rounded bg-rose-950/90 border border-rose-600 text-rose-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4" /> Alerta de Ruptura Nível 6!
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Resolva primeiro a manifestação. Em seguida, o Mestre estabelece um <strong>Efeito de Ruptura</strong> usando Origem, Domínio e Pressão. Depois que o efeito estiver estabelecido, a trilha deve retornar a 0.
                  </p>
                </div>
              )}

              {/* Botões Rápidos de Ajuste */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDelta(1);
                    setMotivo('Sonhar Venceu no Teste Onírico (+1 Ruptura)');
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono"
                >
                  +1 Sonhar Vence
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDelta(2);
                    setMotivo('Divergência no Teste Onírico (+2 Ruptura)');
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono"
                >
                  +2 Divergência
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDelta(-1);
                    setMotivo('Convergência no Teste Onírico (-1 Ruptura)');
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono"
                >
                  -1 Convergência
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDelta(1);
                    setMotivo('Delírio testemunhado por Velados (+1 Ruptura)');
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-mono"
                >
                  +1 Delírio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDelta(-valorAtual);
                    setMotivo('Descanso: Restaurar Ruptura para 0');
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-mono"
                >
                  Zerar (Descanso)
                </button>
              </div>

              {valorAtual === 6 && (
                <button
                  type="button"
                  onClick={() => {
                    setDelta(-6);
                    setMotivo('Efeito de Ruptura estabelecido pelo Mestre; trilha retorna a 0.');
                  }}
                  className="w-full px-3 py-2 text-xs rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600 font-mono"
                >
                  Efeito de Ruptura estabelecido → zerar trilha
                </button>
              )}

              {/* Campo de Motivo */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Motivo da Alteração (Obrigatório para Auditoria):
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Consequência de Teste Onírico, Delírio, Descanso..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </>
          ) : (
            /* Aba Histórico de Ruptura */
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(!personagem.historicoRuptura || personagem.historicoRuptura.length === 0) ? (
                <p className="text-xs text-slate-500 font-mono text-center py-6">
                  Nenhuma alteração de Ruptura registrada até o momento.
                </p>
              ) : (
                personagem.historicoRuptura.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{log.dataHora}</span>
                      <span className={`px-1.5 py-0.2 rounded uppercase font-semibold ${
                        log.origem === 'automatica' ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.origem}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="text-slate-400">{log.valorAnterior}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span className="font-bold text-rose-400">{log.novoValor}</span>
                      <span className="text-slate-300">({log.motivo})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-800 bg-[#161b26]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded font-medium transition"
          >
            Cancelar
          </button>
          {!abaHistorico && (
            <button
              type="button"
              onClick={handleConfirmar}
              className="px-4 py-1.5 text-xs text-slate-950 font-bold bg-cyan-400 hover:bg-cyan-300 rounded shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              Confirmar Alteração
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
