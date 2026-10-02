import React, { useState } from 'react';
import { 
  Sparkles, 
  Brain, 
  Compass, 
  Clock, 
  Box, 
  HeartPulse, 
  AlertTriangle, 
  Eye, 
  Send,
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Personagem, DominioNome } from '../types/character';
import { DESCRICAO_DOMINIOS, LINGUAGEM_DOMINIOS } from '../rules/rulesData';

interface DreamGuideProps {
  personagemAtivo: Personagem | null;
  onIrParaRoladorOnirico: (dominio: DominioNome, nivel: number) => void;
}

export const DreamGuide: React.FC<DreamGuideProps> = ({
  personagemAtivo,
  onIrParaRoladorOnirico
}) => {
  const [dominioSelecionado, setDominioSelecionado] = useState<DominioNome>('consciencia');
  const [nivelSelecionado, setNivelSelecionado] = useState<number>(1);
  const [intencaoNarrativa, setIntencaoNarrativa] = useState<string>('');
  const [haVeladosTestemunhando, setHaVeladosTestemunhando] = useState<boolean>(false);

  const domInfo = DESCRICAO_DOMINIOS[dominioSelecionado];
  const nivelPersonagem = personagemAtivo?.dominios[dominioSelecionado] || 0;
  const podeManifestar = nivelPersonagem >= nivelSelecionado;

  const iconesDom: Record<DominioNome, any> = {
    consciencia: Brain,
    espaco: Compass,
    fluxo: Clock,
    substancia: Box,
    vida: HeartPulse
  };

  const IconeAtual = iconesDom[dominioSelecionado];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-mono text-xs">
      
      {/* Banner Superior */}
      <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold font-['Chakra_Petch'] text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Guia do Sonhar & Linguagem dos Domínios
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              O Sonhar não é magia: é a imposição de um fragmento de outra realidade sobre a Vigília.
            </p>
          </div>
          {personagemAtivo && (
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Desvelado Selecionado:</span>
              <span className="font-bold text-slate-100 text-sm">{personagemAtivo.nome}</span>
            </div>
          )}
        </div>

        {/* Seleção dos 5 Domínios */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
          {[
            { id: 'consciencia', nome: 'Consciência', icon: Brain },
            { id: 'espaco', nome: 'Espaço', icon: Compass },
            { id: 'fluxo', nome: 'Fluxo', icon: Clock },
            { id: 'substancia', nome: 'Substância', icon: Box },
            { id: 'vida', nome: 'Vida', icon: HeartPulse }
          ].map(d => {
            const Icone = d.icon;
            const chave = d.id as DominioNome;
            const nivelNaPeca = personagemAtivo?.dominios[chave] || 0;
            const selecionado = dominioSelecionado === chave;

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDominioSelecionado(chave);
                  if (nivelNaPeca > 0 && nivelNaPeca < nivelSelecionado) {
                    setNivelSelecionado(nivelNaPeca);
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selecionado
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icone className={`w-4 h-4 ${selecionado ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    nivelNaPeca > 0 ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-950 text-slate-600'
                  }`}>
                    Nível {nivelNaPeca}
                  </span>
                </div>
                <div className="font-bold text-xs uppercase text-slate-200">{d.nome}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade de Exploração e Construtor de Manifestação */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna Esquerda: Detalhes do Domínio e Níveis 1 a 5 (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <IconeAtual className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  Domínio: {domInfo.nome}
                </h3>
              </div>
              <p className="text-slate-400 text-xs mt-1 italic">"{domInfo.tema}"</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Esfera: {domInfo.esfera}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Seu Nível Atual:</span>
              <span className="font-bold text-cyan-400 text-sm">Nível {nivelPersonagem}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Linguagem dos Domínios (Níveis 1 a 5):
            </span>

            <div className="space-y-2">
              {LINGUAGEM_DOMINIOS.map(nv => {
                const alcancado = nivelPersonagem >= nv.nivel;
                const selecionado = nivelSelecionado === nv.nivel;

                return (
                  <div
                    key={nv.nivel}
                    onClick={() => setNivelSelecionado(nv.nivel)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selecionado
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold ${
                          selecionado
                            ? 'bg-cyan-500 text-slate-950'
                            : alcancado
                            ? 'bg-slate-800 text-cyan-300'
                            : 'bg-slate-900 text-slate-600'
                        }`}>
                          {nv.nivel}
                        </span>
                        <span className="font-bold text-slate-200 uppercase">
                          {`Nível ${nv.nivel} · ${nv.verbo}`}
                        </span>
                        {nv.nivel === 1 && (
                          <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded">
                            Percepção Grátis
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold ${alcancado ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {alcancado ? '✔ Acessível' : 'Requer Treino'}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed ml-7">
                      {nv.descricao}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-cyan-300 font-semibold">Manifestações Típicas na Metrópole:</span>
            <p className="text-slate-300 mt-1">{domInfo.manifestacoesTipicas}</p>
          </div>
        </div>

        {/* Coluna Direita: Construtor de Manifestação e Verificação de Regras (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Construir Manifestação Onírica
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Declare a intenção ficcional antes de tocar nos dados
              </p>
            </div>

            {/* Resumo da Escolha */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span>Domínio Escolhido:</span>
                <strong className="text-cyan-300 uppercase">{domInfo.nome}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Nível Solicitado:</span>
                <strong className="text-cyan-400">Nível {nivelSelecionado}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300 border-t border-slate-800/80 pt-1.5">
                <span>Disponibilidade na Ficha:</span>
                <span className={podeManifestar ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {podeManifestar ? '✔ Aprovado pelas Regras' : '✖ Limite Excedido'}
                </span>
              </div>
            </div>

            {/* Aviso caso o personagem não tenha nível suficiente */}
            {!podeManifestar && (
              <div className="p-3 rounded bg-rose-950/80 border border-rose-600 text-rose-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Nível Insuficiente!
                </div>
                <p className="text-[11px] leading-relaxed">
                  {personagemAtivo?.nome || 'O personagem'} possui Nível {nivelPersonagem} em {domInfo.nome}. Para manifestar efeitos de Nível {nivelSelecionado}, ele deve progredir seu Domínio ou contar com a ajuda de outro Desvelado.
                </p>
              </div>
            )}

            {/* Descrição da Intenção Narrativa */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                Declaração da Intenção (Ficção em 1º Lugar):
              </label>
              <textarea
                value={intencaoNarrativa}
                onChange={(e) => setIntencaoNarrativa(e.target.value)}
                rows={3}
                placeholder="Ex: Quero desacelerar o projétil disparado contra a janela, fazendo o ar condensar em torno dele..."
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Testemunhas Veladas e Risco de Delírio (Pág. 11, 29) */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={haVeladosTestemunhando}
                  onChange={(e) => setHaVeladosTestemunhando(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
                />
                <div>
                  <span className="font-bold text-slate-200 block">
                    Há Velados testemunhando o efeito? (Risco de Delírio)
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Quando pessoas comuns (Velados) presenciam o impossível, suas mentes entram em colapso e o choque gera <strong>Delírio (+1 Ruptura imediato)</strong>.
                  </p>
                </div>
              </label>

              {haVeladosTestemunhando && (
                <div className="p-2 rounded bg-amber-950/70 border border-amber-600/60 text-amber-200 text-[11px]">
                  ⚠ A manifestação causará Delírio nos observadores. Esteja preparado para somar +1 de Ruptura além dos resultados do Teste Onírico!
                </div>
              )}
            </div>

          </div>

          {/* Botão de Envio para o Rolador */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onIrParaRoladorOnirico(dominioSelecionado, nivelSelecionado)}
              disabled={!podeManifestar}
              className={`w-full py-3 rounded font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition ${
                podeManifestar
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Send className="w-4 h-4" />
              Testar no Rolador Onírico
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
