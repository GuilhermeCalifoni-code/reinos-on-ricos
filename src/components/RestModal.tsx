import React, { useState } from 'react';
import { Moon, Check, X, Shield, Heart, Zap, RefreshCw, Sparkles, Anchor } from 'lucide-react';
import { Personagem } from '../types/character';

interface RestModalProps {
  personagem: Personagem;
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (personagemAtualizado: Personagem) => void;
}

export const RestModal: React.FC<RestModalProps> = ({
  personagem,
  isOpen,
  onClose,
  onSalvar
}) => {
  const [usarAncoragem, setUsarAncoragem] = useState<boolean>(true);
  const [escolhas, setEscolhas] = useState<{
    cicatrizacao: boolean;
    restaurarPO: boolean;
    restaurarFoco: boolean;
    restaurarRuptura: boolean;
    removerCondicoes: boolean;
    projetoPessoal: boolean;
  }>({
    cicatrizacao: true,
    restaurarPO: true,
    restaurarFoco: true,
    restaurarRuptura: false,
    removerCondicoes: false,
    projetoPessoal: false
  });

  if (!isOpen) return null;

  const movimentosPermitidos = 2 + (usarAncoragem ? 1 : 0);
  const totalSelecionados = Object.values(escolhas).filter(Boolean).length;
  const excedeuLimite = totalSelecionados > movimentosPermitidos;

  const toggleEscolha = (chave: keyof typeof escolhas) => {
    setEscolhas(prev => ({
      ...prev,
      [chave]: !prev[chave]
    }));
  };

  const handleConfirmarDescanso = () => {
    let novaVida = personagem.vidaAtual;
    let novaPO = personagem.protecaoOniricaAtual;
    let novoFoco = personagem.focoAtual;
    let novaRuptura = personagem.ruptura;
    let novoHistorico = [...(personagem.historicoRuptura || [])];

    if (escolhas.cicatrizacao) {
      novaVida = personagem.vidaMaxima;
    }
    if (escolhas.restaurarPO) {
      novaPO = personagem.protecaoOniricaMaxima;
    }
    if (escolhas.restaurarFoco) {
      novoFoco = personagem.focoMaximo;
    }
    if (escolhas.restaurarRuptura && personagem.ruptura > 0) {
      novoHistorico.unshift({
        id: 'rup-descanso-' + Date.now(),
        dataHora: new Date().toLocaleTimeString('pt-BR'),
        valorAnterior: personagem.ruptura,
        novoValor: 0,
        motivo: 'Movimento de Descanso: Restaurar Ruptura para 0.',
        origem: 'manual'
      });
      novaRuptura = 0;
    }

    const atualizado: Personagem = {
      ...personagem,
      vidaAtual: novaVida,
      protecaoOniricaAtual: novaPO,
      focoAtual: novoFoco,
      ruptura: novaRuptura,
      historicoRuptura: novoHistorico,
      atualizadoEm: new Date().toISOString()
    };

    onSalvar(atualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#11141c] border border-slate-700/80 rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161b26]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] uppercase tracking-wider">
                Descanso (8 Horas de Sono)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {personagem.nome} · Movimentos de Recuperação
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

        <div className="p-5 space-y-4">
          
          {/* Ancoragem Checkbox */}
          <div className="bg-slate-950/80 border border-slate-800 rounded p-3 text-xs font-mono">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={usarAncoragem}
                onChange={(e) => setUsarAncoragem(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
              />
              <div>
                <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                  Passar tempo com Ancoragem (+1 Movimento Adicional)
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5 italic">
                  {personagem.ancoragem ? `"${personagem.ancoragem}"` : 'Nenhuma Ancoragem descrita na ficha ainda.'}
                </p>
              </div>
            </label>
          </div>

          {/* Contador de Movimentos */}
          <div className="flex justify-between items-center text-xs font-mono px-1">
            <span className="text-slate-400">
              Movimentos Escolhidos:
            </span>
            <span className={`font-bold ${excedeuLimite ? 'text-rose-400' : 'text-cyan-300'}`}>
              {totalSelecionados} / {movimentosPermitidos} disponíveis
            </span>
          </div>

          {/* Lista de Movimentos */}
          <div className="space-y-2">
            {[
              {
                id: 'cicatrizacao',
                titulo: 'Cicatrização',
                desc: 'Recupere todos os Pontos de Vida (V) perdidos.',
                icon: Heart,
                ativo: escolhas.cicatrizacao,
                cor: 'text-rose-400'
              },
              {
                id: 'restaurarPO',
                titulo: 'Restaurar a Proteção',
                desc: 'Recupere todos os Pontos de Proteção Onírica (PO).',
                icon: Shield,
                ativo: escolhas.restaurarPO,
                cor: 'text-cyan-400'
              },
              {
                id: 'restaurarFoco',
                titulo: 'Recuperar o Foco',
                desc: 'Recupere todos os Pontos de Foco (PF) gastos.',
                icon: Zap,
                ativo: escolhas.restaurarFoco,
                cor: 'text-amber-400'
              },
              {
                id: 'restaurarRuptura',
                titulo: 'Restaurar Ruptura',
                desc: 'Zera o marcador de Ruptura (retorna para 0).',
                icon: RefreshCw,
                ativo: escolhas.restaurarRuptura,
                cor: 'text-purple-400'
              },
              {
                id: 'removerCondicoes',
                titulo: 'Remover Condição',
                desc: 'Remove uma Condição apropriada (Oculto, Impedido ou Vulnerável).',
                icon: Sparkles,
                ativo: escolhas.removerCondicoes,
                cor: 'text-emerald-400'
              }
            ].map(m => {
              const Icone = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleEscolha(m.id as any)}
                  className={`w-full text-left p-3 rounded border text-xs font-mono transition-all flex items-start gap-3 ${
                    m.ativo
                      ? 'bg-slate-900 border-cyan-500/60 text-slate-100 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded bg-slate-950 border border-slate-800 ${m.cor} shrink-0`}>
                    <Icone className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{m.titulo}</span>
                      {m.ativo && <span className="text-cyan-400 font-bold">✔ Selecionado</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

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
          <button
            type="button"
            onClick={handleConfirmarDescanso}
            disabled={excedeuLimite}
            className={`px-4 py-1.5 text-xs text-slate-950 font-bold rounded shadow flex items-center gap-1.5 transition ${
              excedeuLimite
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
            }`}
          >
            <Check className="w-4 h-4" />
            Concluir Descanso
          </button>
        </div>

      </div>
    </div>
  );
};
