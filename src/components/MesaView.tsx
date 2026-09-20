import React, { useState } from 'react';
import { Campanha } from '../types/campaign';
import { Personagem, AtributoNome } from '../types/character';
import { MasterCommandCenter } from './MasterCommandCenter';
import { DiceRoller } from './DiceRoller';
import { DreamGuide } from './DreamGuide';
import { RulesReference } from './RulesReference';

interface MesaViewProps {
  campanha: Campanha;
  personagens: Personagem[];
  onVoltarParaCampanha: () => void;
  onAtualizarPersonagem: (p: Personagem) => void;
  onAbrirModalRupturaPara: (p: Personagem, delta: number, motivo: string) => void;
  onAbrirFichaPersonagem: (p: Personagem) => void;
}

export const MesaView: React.FC<MesaViewProps> = ({
  campanha,
  personagens,
  onVoltarParaCampanha,
  onAtualizarPersonagem,
  onAbrirModalRupturaPara,
  onAbrirFichaPersonagem
}) => {
  const [subAbaMesa, setSubAbaMesa] = useState<'cena' | 'dados' | 'sonhar' | 'regras'>('cena');
  const [personagemRolador, setPersonagemRolador] = useState<Personagem | undefined>(personagens[0]);
  const [atributoRolador, setAtributoRolador] = useState<AtributoNome | undefined>(undefined);

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#0B0B0B]">
      {/* Barra de Ação da Mesa (Funcional, Rápida, Minimalista) */}
      <div className="bg-[#171717] border-b border-[#292929] px-6 py-3 sticky top-14 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onVoltarParaCampanha}
            className="text-xs font-mono text-[#666666] hover:text-[#A88952] transition-colors flex items-center gap-1"
          >
            <span>←</span>
            <span>Campanha: {campanha.nome}</span>
          </button>
          <span className="text-[#292929]">|</span>
          <span className="text-xs font-mono uppercase tracking-widest text-[#F5F3EE]">
            Modo Mesa · Sessão #{String(campanha.sessaoAtual).padStart(2, '0')}
          </span>
        </div>

        {/* Abas Rápidas da Mesa */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubAbaMesa('cena')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              subAbaMesa === 'cena'
                ? 'bg-[#292929] text-[#F5F3EE] border border-[#333333]'
                : 'text-[#666666] hover:text-[#D9D7D2]'
            }`}
          >
            Cena de Tensão
          </button>

          <button
            onClick={() => setSubAbaMesa('dados')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              subAbaMesa === 'dados'
                ? 'bg-[#292929] text-[#F5F3EE] border border-[#333333]'
                : 'text-[#666666] hover:text-[#D9D7D2]'
            }`}
          >
            Rolador Onírico
          </button>

          <button
            onClick={() => setSubAbaMesa('sonhar')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              subAbaMesa === 'sonhar'
                ? 'bg-[#292929] text-[#F5F3EE] border border-[#333333]'
                : 'text-[#666666] hover:text-[#D9D7D2]'
            }`}
          >
            Guia do Sonhar
          </button>

          <button
            onClick={() => setSubAbaMesa('regras')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              subAbaMesa === 'regras'
                ? 'bg-[#292929] text-[#F5F3EE] border border-[#333333]'
                : 'text-[#666666] hover:text-[#D9D7D2]'
            }`}
          >
            Regras
          </button>
        </div>
      </div>

      {/* Conteúdo do Modo Mesa */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {subAbaMesa === 'cena' && (
          <MasterCommandCenter
            campanha={campanha}
            personagens={personagens}
            onAtualizarPersonagem={onAtualizarPersonagem}
            onAbrirModalRupturaPara={onAbrirModalRupturaPara}
            onAbrirFichaPersonagem={onAbrirFichaPersonagem}
          />
        )}

        {subAbaMesa === 'dados' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-[#666666]">
                Personagem selecionado para rolagens:
              </span>
              <select
                value={personagemRolador?.id || ''}
                onChange={(e) => {
                  const achado = personagens.find(p => p.id === e.target.value);
                  setPersonagemRolador(achado);
                }}
                className="bg-[#171717] border border-[#292929] text-xs text-[#F5F3EE] px-3 py-1.5 rounded-sm focus:outline-none"
              >
                {personagens.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Nível {p.nivel} {p.conceito})
                  </option>
                ))}
              </select>
            </div>
            <DiceRoller
              personagemAtivo={personagemRolador || null}
              atributoInicial={atributoRolador}
              onSalvarPersonagem={onAtualizarPersonagem}
              onAbrirModalRuptura={(delta, motivo) => {
                if (personagemRolador) {
                  onAbrirModalRupturaPara(personagemRolador, delta, motivo);
                }
              }}
            />
          </div>
        )}

        {subAbaMesa === 'sonhar' && (
          <DreamGuide
            personagemAtivo={personagemRolador || null}
            onIrParaRoladorOnirico={() => setSubAbaMesa('dados')}
          />
        )}

        {subAbaMesa === 'regras' && (
          <RulesReference />
        )}
      </div>
    </div>
  );
};
