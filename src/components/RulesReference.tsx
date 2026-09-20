import React, { useState } from 'react';
import { BookOpen, Sparkles, AlertTriangle, Shield, Heart, Moon, Anchor, Compass } from 'lucide-react';
import { TABELA_PROGRESSAO, DESCRICAO_DOMINIOS, ESTADOS_RUPTURA, DISTANCIAS_REINOS_ONIRICOS } from '../rules/rulesData';

export const RulesReference: React.FC = () => {
  const [secaoAtiva, setSecaoAtiva] = useState<'fundamentos' | 'conflito' | 'ruptura' | 'dominios' | 'descanso'>('fundamentos');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-mono text-xs">
      
      {/* Header */}
      <div className="bg-[#12151e] border border-slate-800 rounded-lg p-5 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Fonte das Verdades · Livro Básico Oficial
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Consulta rápida e fiel das regras de Reinos Oníricos RPG
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'fundamentos', label: '1. Fundamentos & Testes', icon: BookOpen },
          { id: 'conflito', label: '2. Vigília, Dano & Conflito', icon: Shield },
          { id: 'ruptura', label: '3. Trilha de Ruptura (0-6)', icon: AlertTriangle },
          { id: 'dominios', label: '4. Domínios & Progressão', icon: Sparkles },
          { id: 'descanso', label: '5. Descanso & Ancoragem', icon: Moon }
        ].map(tab => {
          const Icone = tab.icon;
          const ativo = secaoAtiva === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSecaoAtiva(tab.id as any)}
              className={`px-3 py-2 rounded border font-bold uppercase tracking-wider flex items-center gap-2 transition ${
                ativo
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icone className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div className="bg-[#12151e] border border-slate-800 rounded-lg p-6 shadow-lg leading-relaxed text-slate-300 space-y-4">
        
        {secaoAtiva === 'fundamentos' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold font-['Chakra_Petch'] text-cyan-300 uppercase">
              Princípios e Resolução de Testes
            </h3>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-100 uppercase text-xs">Ficção em Primeiro Lugar</h4>
              <p className="text-slate-400 text-xs">
                O jogo é conduzido pela narrativa. Nenhum teste de dados deve ser rolado a menos que haja incerteza significativa e consequências palpáveis na história. A ficção estabelece a posição, o que é possível e o que está em jogo.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-400 uppercase text-xs">Teste Mundano: 1d20 + Atributo ≥ DT</h4>
              <p className="text-slate-400 text-xs">
                Utilizado para resolver ações convencionais na Vigília (pular um telhado, negociar, arrombar uma porta, disparar uma arma).
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                <li><strong>Vantagem:</strong> Rola 2d20 e escolhe o maior.</li>
                <li><strong>Desvantagem:</strong> Rola 2d20 e escolhe o menor.</li>
                <li><strong>Ponto de Foco:</strong> O Jogador pode gastar 1 PF antes da rolagem para receber +2 no Teste Mundano. Apenas 1 PF por teste. Foco NÃO pode ser usado no Sonhar.</li>
                <li><strong>Crítico Natural:</strong> Um 20 natural no d20 garante um sucesso excepcional com benefícios narrativos imediatos.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-400 uppercase text-xs">Teste Onírico: 1d20 Realidade + 1d20 Sonhar vs DT 13</h4>
              <p className="text-slate-400 text-xs">
                Dois dados independentes com funções diferentes. O mesmo modificador de Atributo é somado a ambos os dados. A DT padrão é 13.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-200">
                  <strong>Convergência (Ambos passam):</strong> Manifestação perfeita, crítica. -1 Ruptura.
                </div>
                <div className="p-2 rounded bg-amber-950/40 border border-amber-800 text-amber-200">
                  <strong>Realidade Vence (Realidade passa, Sonhar falha):</strong> Manifestação contida pela física. 0 Ruptura.
                </div>
                <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800 text-cyan-200">
                  <strong>Sonhar Vence (Realidade falha, Sonhar passa):</strong> O Sonhar impõe sua vontade com violência. +1 Ruptura.
                </div>
                <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-200">
                  <strong>Divergência (Ambos falham):</strong> Colapso ontológico. O efeito escapa ao controle. +2 Ruptura.
                </div>
              </div>
            </div>
          </div>
        )}

        {secaoAtiva === 'conflito' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold font-['Chakra_Petch'] text-cyan-300 uppercase">
              Vigília, Dano e Cenas de Tensão
            </h3>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-100 uppercase text-xs">A Rodada de Tensão</h4>
              <p className="text-slate-400 text-xs">
                Durante uma Cena de Tensão, o tempo é medido em Rodadas. Em seu turno, cada personagem possui direito a:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                <li><strong>1 Movimento:</strong> Deslocar-se 1 grau de distância (Muito Próximo ↔ Perto ↔ Longe ↔ Muito Longe).</li>
                <li><strong>1 Ação:</strong> Atacar, defender, usar um item, ou manifestar o Sonhar (Níveis 2 a 5).</li>
                <li><strong>Percepção Onírica (Nível 1 de Domínio):</strong> NÃO consome a Ação da rodada.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-rose-400 uppercase text-xs">Resolução de Dano vs Resistência</h4>
              <p className="text-slate-400 text-xs">
                A Resistência (R) de um personagem é calculada como <strong>6 + Corpo + Bônus de Vestimenta</strong>.
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                <li><strong>Dano ≤ Resistência:</strong> O personagem perde <strong>1 Ponto de Vida (V)</strong>.</li>
                <li><strong>Dano &gt; Resistência:</strong> O personagem perde <strong>2 Pontos de Vida (V)</strong>.</li>
                <li><strong>Regra Opcional Dano Maciço:</strong> Dano &gt; 2× Resistência causa a perda de <strong>3 Pontos de Vida (V)</strong>.</li>
                <li><strong>Proteção Onírica (PO):</strong> Após comparar o dano à Resistência, o Jogador pode gastar 1 PO para reduzir em 1 V a perda causada pelo dano. Apenas 1 PO pode ser gasto por ocorrência de dano.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-rose-500 uppercase text-xs">Movimento de Morte (0 Pontos de Vida)</h4>
              <p className="text-slate-400 text-xs">
                Ao chegar a 0 V, o jogador imediatamente realiza o Movimento de Morte, rolando 2d20 puros (Realidade e Sonhar) sem Atributo contra DT 13:
              </p>
              <p className="text-slate-400 text-xs">
                Convergência: retorna com 2 V. Realidade vence: retorna com 1 V. Sonhar vence: retorna com 1 V e +2 Ruptura. Divergência: morte definitiva (reversível apenas com Vida Nível 5).
              </p>
            </div>
          </div>
        )}

        {secaoAtiva === 'ruptura' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold font-['Chakra_Petch'] text-rose-400 uppercase">
              A Trilha de Ruptura (0 a 6)
            </h3>

            <p className="text-slate-400 text-xs">
              A Ruptura mede a perda da coerência da Realidade em torno do Desvelado. Toda alteração deve ser registrada com clareza.
            </p>

            <div className="space-y-2">
              {Object.values(ESTADOS_RUPTURA).map(e => (
                <div key={e.nivel} className="p-3 rounded bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100">Nível {e.nivel} — {e.nome}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Livro Básico pág. 29</span>
                  </div>
                  <p className="text-slate-300 text-xs">{e.descricao}</p>
                  <p className="text-slate-400 text-[11px] mt-1 italic">Sintomas: {e.sintomas}</p>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded bg-rose-950/80 border border-rose-600 text-rose-200 text-xs space-y-1">
              <div className="font-bold uppercase">Regra do Nível 6:</div>
              <p>
                Quando a trilha alcança 6, o Mestre aplica o <strong>Efeito da Ruptura</strong> (estabelecendo Origem, Domínio e Pressão), e em seguida a trilha do personagem retorna para 0.
              </p>
            </div>
          </div>
        )}

        {secaoAtiva === 'dominios' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold font-['Chakra_Petch'] text-cyan-300 uppercase">
              Nova Progressão de Domínios por Nível
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Nível</th>
                    <th className="py-2 px-3">Pontos de Sonhar</th>
                    <th className="py-2 px-3">Máx em 1 Domínio</th>
                    <th className="py-2 px-3">Defesa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {Object.values(TABELA_PROGRESSAO).map(p => (
                    <tr key={p.nivel}>
                      <td className="py-2 px-3 font-bold text-cyan-400">Nível {p.nivel}</td>
                      <td className="py-2 px-3">{p.pontosDeSonhar} Pontos</td>
                      <td className="py-2 px-3">Nível {p.dominioMaximo}</td>
                      <td className="py-2 px-3">8 + Atributo {p.bonusDefesa > 0 ? `+ ${p.bonusDefesa}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {Object.values(DESCRICAO_DOMINIOS).map(d => (
                <div key={d.nome} className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-300 block">{d.nome}</span>
                  <p className="text-slate-400 text-xs italic">"{d.tema}"</p>
                  <p className="text-slate-300 text-[11px]">{d.manifestacoesTipicas}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {secaoAtiva === 'descanso' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold font-['Chakra_Petch'] text-indigo-300 uppercase">
              Descanso & Ancoragem (Livro Básico Pág. 36, 116)
            </h3>

            <p className="text-slate-400 text-xs">
              Durante um Descanso (8h de sono), cada Jogador pode realizar <strong>2 Movimentos de Descanso</strong>. Se passar tempo com seu elo de Ancoragem, ganha <strong>1 Movimento Adicional (totalizando 3)</strong>.
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <strong className="text-rose-400">1. Cicatrização:</strong> Recupere todos os Pontos de Vida (V).
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <strong className="text-cyan-400">2. Restaurar a Proteção:</strong> Recupere os Pontos de Proteção Onírica (PO).
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <strong className="text-amber-400">3. Recuperar o Foco:</strong> Recupere todos os Pontos de Foco (PF) gastos.
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <strong className="text-purple-400">4. Restaurar Ruptura:</strong> Seu marcador de Ruptura volta a 0.
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400">5. Remover Condição:</strong> Remove uma Condição apropriada (Oculto, Impedido, Vulnerável).
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
