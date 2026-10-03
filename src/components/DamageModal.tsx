import React, { useState } from 'react';
import { Shield, Heart, Skull, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import { Personagem } from '../types/character';

interface DamageModalProps {
  personagem: Personagem;
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (personagemAtualizado: Personagem) => void;
  onDispararMovimentoMorte?: () => void;
}

export const DamageModal: React.FC<DamageModalProps> = ({
  personagem,
  isOpen,
  onClose,
  onSalvar,
  onDispararMovimentoMorte
}) => {
  const [danoBruto, setDanoBruto] = useState<number>(6);
  const [usarPO, setUsarPO] = useState<boolean>(personagem.protecaoOniricaAtual > 0);
  const [usarDanoMacico, setUsarDanoMacico] = useState<boolean>(true);

  if (!isOpen) return null;

  const resistencia = personagem.resistencia;
  const poDisponivel = personagem.protecaoOniricaAtual;
  const rolarDado = (faces: number) => setDanoBruto(Math.floor(Math.random() * faces) + 1);

  // Mecânica da VF5:
  // Dano <= R -> perde 1 V
  // Dano > R -> perde 2 V
  // Dano Maciço (Opcional): Dano > 2*R -> perde 3 V
  let perdaVidaCalculada = 0;
  if (usarDanoMacico && danoBruto > resistencia * 2) {
    perdaVidaCalculada = 3;
  } else if (danoBruto > resistencia) {
    perdaVidaCalculada = 2;
  } else {
    perdaVidaCalculada = 1;
  }

  // Abatimento com Proteção Onírica (1 PO reduz em 1 V, máx 1 PO por ocorrência de dano)
  const poGasta = (usarPO && poDisponivel > 0 && perdaVidaCalculada > 0) ? 1 : 0;
  const perdaVidaFinal = Math.max(0, perdaVidaCalculada - poGasta);
  const novaVida = Math.max(0, personagem.vidaAtual - perdaVidaFinal);
  const novaPO = Math.max(0, poDisponivel - poGasta);
  const chegouAZero = novaVida === 0;

  const handleAplicar = () => {
    const atualizado: Personagem = {
      ...personagem,
      vidaAtual: novaVida,
      protecaoOniricaAtual: novaPO,
      atualizadoEm: new Date().toISOString()
    };
    onSalvar(atualizado);
    onClose();

    if (chegouAZero && onDispararMovimentoMorte) {
      onDispararMovimentoMorte();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#11141c] border border-slate-700/80 rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161b26]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] uppercase tracking-wider">
                Registrar Dano
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {personagem.nome} · Conversão Dano vs Resistência
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
          
          {/* Valor de Dano Bruto */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-slate-300">
                Valor Total do Dano Sofrido:
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {danoBruto} pontos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={30}
                value={danoBruto}
                onChange={(e) => setDanoBruto(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <input
                type="number"
                min={1}
                max={99}
                value={danoBruto}
                onChange={(e) => setDanoBruto(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 text-center bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Rolagem rápida por Intensidade de Dano */}
          <div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Leve d4', faces: 4 },
                { label: 'Moderado d6', faces: 6 },
                { label: 'Grave d8', faces: 8 },
                { label: 'Severo d10', faces: 10 },
                { label: 'Devastador d12', faces: 12 },
                { label: 'Onírico d20', faces: 20 }
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => rolarDado(preset.faces)}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                >
                  Rolar {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500 font-mono">
              O dado representa a intensidade do dano. Área e Distância Máxima dependem da fonte e da narrativa.
            </p>
          </div>

          {/* Painel de Cálculo Transparente */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded p-3 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Dano Recebido: <strong>{danoBruto}</strong></span>
              <span>Resistência (R): <strong className="text-cyan-400">{resistencia}</strong></span>
            </div>

            <div className="border-t border-slate-800 pt-2 text-slate-300 space-y-1">
              {danoBruto <= resistencia ? (
                <p className="text-emerald-400">
                  ✔ Dano ({danoBruto}) ≤ R ({resistencia}) → <strong>Perde 1 V</strong>
                </p>
              ) : (usarDanoMacico && danoBruto > resistencia * 2) ? (
                <p className="text-rose-400">
                  ⚠ Dano ({danoBruto}) &gt; Dobro de R ({resistencia * 2}) → <strong>Dano Maciço: Perde 3 V</strong>
                </p>
              ) : (
                <p className="text-amber-400">
                  ⚠ Dano ({danoBruto}) &gt; R ({resistencia}) → <strong>Perde 2 V</strong>
                </p>
              )}
            </div>

            {/* Proteção Onírica */}
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={usarPO && poDisponivel > 0}
                  disabled={poDisponivel === 0}
                  onChange={(e) => setUsarPO(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
                />
                <span>
                  Gastar 1 PO para reduzir 1 V ({poDisponivel} disponíveis)
                </span>
              </label>
              {poGasta > 0 && (
                <span className="text-cyan-400 font-bold">-1 V absorvido</span>
              )}
            </div>

            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarDanoMacico}
                  onChange={(e) => setUsarDanoMacico(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-slate-400"
                />
                <span>Regra Opcional Dano Maciço (&gt; 2×R = 3V)</span>
              </label>
            </div>
          </div>

          {/* Consequência Final */}
          <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Vida:</span>
              <span className="font-bold text-slate-100">
                {personagem.vidaAtual} → <span className={chegouAZero ? 'text-rose-400' : 'text-slate-200'}>{novaVida} V</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Proteção Onírica:</span>
              <span className="font-bold text-cyan-300">
                {poDisponivel} → {novaPO} PO
              </span>
            </div>

            {chegouAZero && (
              <div className="p-2 mt-2 rounded bg-rose-950/90 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                <Skull className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  <strong>Atenção:</strong> O personagem atingiu 0 PV. Realize o <strong>Movimento de Morte</strong> (2d20 vs DT 13).
                </span>
              </div>
            )}
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
            onClick={handleAplicar}
            className="px-4 py-1.5 text-xs text-slate-950 font-bold bg-rose-500 hover:bg-rose-400 rounded shadow-[0_0_12px_rgba(244,63,94,0.3)] flex items-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            Aplicar Dano
          </button>
        </div>

      </div>
    </div>
  );
};
