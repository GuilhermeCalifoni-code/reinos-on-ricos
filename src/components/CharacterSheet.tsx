import React, { useState } from 'react';
import { 
  Heart, 
  Shield, 
  Zap, 
  AlertTriangle, 
  Moon, 
  Dice5, 
  Sparkles, 
  Edit3, 
  Save, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Anchor, 
  Eye, 
  Plus, 
  Minus,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Personagem, AtributoNome, DominioNome } from '../types/character';
import { TABELA_PROGRESSAO, DESCRICAO_DOMINIOS, ESTADOS_RUPTURA } from '../rules/rulesData';
import { calcularBonusResistenciaEquipamentos, calcularDefesa, calcularResistenciaTotal, validarDistribuicaoDominios } from '../rules/rulesEngine';
import { RupturaModal } from './RupturaModal';
import { DamageModal } from './DamageModal';
import { RestModal } from './RestModal';

interface CharacterSheetProps {
  personagem: Personagem;
  onSalvar: (personagemAtualizado: Personagem) => void;
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
  onExportar: (personagem: Personagem) => void;
  onIrParaRolador: (personagem: Personagem, atributo?: AtributoNome) => void;
  onIrParaGuiaSonhar: (personagem: Personagem) => void;
  onDispararMovimentoMorte: () => void;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  personagem,
  onSalvar,
  onDuplicar,
  onExcluir,
  onExportar,
  onIrParaRolador,
  onIrParaGuiaSonhar,
  onDispararMovimentoMorte
}) => {
  const [paginaAtiva, setPaginaAtiva] = useState<'vigilia_sonhar' | 'memoria_lacos'>('vigilia_sonhar');
  const [modalRupturaAberto, setModalRupturaAberto] = useState<boolean>(false);
  const [modalDanoAberto, setModalDanoAberto] = useState<boolean>(false);
  const [modalDescansoAberto, setModalDescansoAberto] = useState<boolean>(false);

  const condicoes = personagem.condicoes || {
    oculto: false,
    impedido: false,
    vulneravel: false
  };

  const handleToggleCondicao = (chave: keyof typeof condicoes) => {
    onSalvar({
      ...personagem,
      condicoes: { ...condicoes, [chave]: !condicoes[chave] },
      atualizadoEm: new Date().toISOString()
    });
  };

  const progNivel = TABELA_PROGRESSAO[personagem.nivel] || TABELA_PROGRESSAO[1];
  const validacaoDom = validarDistribuicaoDominios(personagem.dominios, personagem.nivel);

  // Modificação rápida de Atributos
  const handleUpdateAtributo = (atrib: AtributoNome, novoValor: number) => {
    const atributos = { ...personagem.atributos, [atrib]: novoValor };
    onSalvar({
      ...personagem,
      atributos,
      resistencia: calcularResistenciaTotal(atributos.corpo, personagem.equipamentos),
      defesa: calcularDefesa(personagem.atributoPrincipal, atributos, personagem.nivel).defesa,
      atualizadoEm: new Date().toISOString()
    });
  };

  const handleSetAtributoPrincipal = (atrib: AtributoNome) => {
    // O Atributo Principal continua registrado na ficha, mas Defesa é sempre 8 + Corpo.
    onSalvar({
      ...personagem,
      atributoPrincipal: atrib,
      atualizadoEm: new Date().toISOString()
    });
  };

  // Modificação de Domínios com feedback das regras do prompt
  const handleUpdateDominio = (dom: DominioNome, novoNivel: number) => {
    const novosDominios = {
      ...personagem.dominios,
      [dom]: novoNivel
    };
    onSalvar({
      ...personagem,
      dominios: novosDominios
    });
  };

  // Alteração de Vida rápida
  const handleAjustarVida = (delta: number) => {
    const nv = Math.max(0, Math.min(personagem.vidaMaxima, personagem.vidaAtual + delta));
    onSalvar({
      ...personagem,
      vidaAtual: nv
    });
    if (nv === 0) {
      onDispararMovimentoMorte();
    }
  };

  // Alteração de Foco rápida
  const handleAjustarFoco = (delta: number) => {
    const nf = Math.max(0, Math.min(personagem.focoMaximo, personagem.focoAtual + delta));
    onSalvar({
      ...personagem,
      focoAtual: nf
    });
  };

  // Alteração de PO rápida
  const handleAjustarPO = (delta: number) => {
    const npo = Math.max(0, Math.min(personagem.protecaoOniricaMaxima, personagem.protecaoOniricaAtual + delta));
    onSalvar({
      ...personagem,
      protecaoOniricaAtual: npo
    });
  };

  const estadoRupturaInfo = ESTADOS_RUPTURA[personagem.ruptura];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Barra Superior da Ficha: Identidade & Ações */}
      <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={personagem.nome}
                onChange={(e) => onSalvar({ ...personagem, nome: e.target.value })}
                className="bg-transparent border-b border-slate-700 hover:border-cyan-500 focus:border-cyan-400 text-xl sm:text-2xl font-bold font-['Chakra_Petch'] text-slate-100 tracking-wide focus:outline-none px-1"
                placeholder="Nome do Desvelado"
              />
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-semibold">
                Nível {personagem.nivel}
              </span>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
                Conceito: {personagem.conceito}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <label className="flex items-center gap-1.5">
                <span>Nível:</span>
                <select
                  value={personagem.nivel}
                  onChange={(e) => {
                    const novoNivel = Number(e.target.value);
                    const novaProg = TABELA_PROGRESSAO[novoNivel] || TABELA_PROGRESSAO[1];
                    onSalvar({
                      ...personagem,
                      nivel: novoNivel,
                      vidaMaxima: novaProg.vidaBase,
                      vidaAtual: Math.min(personagem.vidaAtual, novaProg.vidaBase),
                      focoMaximo: novaProg.focoBase,
                      focoAtual: Math.min(personagem.focoAtual, novaProg.focoBase),
                      protecaoOniricaMaxima: novaProg.protecaoOniricaBase,
                      protecaoOniricaAtual: Math.min(personagem.protecaoOniricaAtual, novaProg.protecaoOniricaBase),
                      defesa: calcularDefesa(personagem.atributoPrincipal, personagem.atributos, novoNivel).defesa,
                      atualizadoEm: new Date().toISOString()
                    });
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>Nível {n}</option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                <span>Conceito:</span>
                <select
                  value={personagem.conceito}
                  onChange={(e) => onSalvar({ ...personagem, conceito: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {['Lúcido', 'Tecelão', 'Desperto', 'Ecoante'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="text-slate-400">
                Atributo Principal: <strong className="text-cyan-400 uppercase">{personagem.atributoPrincipal}</strong>
              </span>
            </div>
          </div>

          {/* Botões de Ação de Mesa */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalDanoAberto(true)}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-300 flex items-center gap-1.5 shadow-sm transition"
              title="Calcular e aplicar dano comparado à Resistência e PO"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
              Sofrer Dano
            </button>

            <button
              onClick={() => setModalDescansoAberto(true)}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/60 text-indigo-300 flex items-center gap-1.5 shadow-sm transition"
              title="Realizar 8h de Descanso e Movimentos de Ancoragem"
            >
              <Moon className="w-3.5 h-3.5" />
              Descanso
            </button>

            <button
              onClick={() => onIrParaRolador(personagem)}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 flex items-center gap-1.5 shadow-sm transition"
            >
              <Dice5 className="w-3.5 h-3.5" />
              Rolar Teste
            </button>

            <button
              onClick={() => onIrParaGuiaSonhar(personagem)}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-300 flex items-center gap-1.5 shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Guia Sonhar
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={() => onExportar(personagem)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
              title="Exportar Ficha em JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDuplicar(personagem.id)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
              title="Duplicar Personagem"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirm(`Deseja realmente excluir o personagem "${personagem.nome}"?`)) {
                  onExcluir(personagem.id);
                }
              }}
              className="p-1.5 rounded bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-400 transition"
              title="Excluir Personagem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Abas da Ficha: Página 1 (Vigília e Sonhar) vs Página 2 (Memória, Laços e Pertences) */}
        <div className="flex border-b border-slate-800 mt-5 text-xs font-mono">
          <button
            onClick={() => setPaginaAtiva('vigilia_sonhar')}
            className={`py-2 px-4 border-b-2 font-bold uppercase tracking-wider transition ${
              paginaAtiva === 'vigilia_sonhar'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ficha 1/2 · Vigília, Conflito e Sonhar
          </button>
          <button
            onClick={() => setPaginaAtiva('memoria_lacos')}
            className={`py-2 px-4 border-b-2 font-bold uppercase tracking-wider transition ${
              paginaAtiva === 'memoria_lacos'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ficha 2/2 · Memória, Laços e Pertences
          </button>
        </div>
      </div>

      {paginaAtiva === 'vigilia_sonhar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Atributos & Vigília (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Bloco de Atributos */}
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Atributos
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Marque o Atributo Principal que ancora sua Defesa
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'corpo', nome: 'Corpo', desc: 'Força física, coordenação e resistência biológica.' },
                  { id: 'mente', nome: 'Mente', desc: 'Raciocínio, percepção, lógica e padrões.' },
                  { id: 'vontade', nome: 'Vontade', desc: 'Determinação, autocontrole e imposição.' },
                  { id: 'vinculo', nome: 'Vínculo', desc: 'Conexões emocionais, sociais e simbólicas.' }
                ].map((atrib) => {
                  const chave = atrib.id as AtributoNome;
                  const valor = personagem.atributos[chave] ?? 0;
                  const isPrincipal = personagem.atributoPrincipal === chave;

                  return (
                    <div
                      key={chave}
                      className={`p-3 rounded border font-mono transition-all relative ${
                        isPrincipal
                          ? 'bg-cyan-950/40 border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold text-slate-200">{atrib.nome}</span>
                        <button
                          type="button"
                          onClick={() => handleSetAtributoPrincipal(chave)}
                          title={isPrincipal ? 'Atributo Principal Ativo' : 'Definir como Atributo Principal'}
                          className={`text-[10px] px-1.5 py-0.5 rounded border uppercase transition ${
                            isPrincipal 
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' 
                              : 'text-slate-500 border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {isPrincipal ? 'Principal' : 'Tornar'}
                        </button>
                      </div>

                      {/* Modificador com stepper */}
                      <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded p-1.5 my-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateAtributo(chave, valor - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`text-base font-bold ${valor > 0 ? 'text-cyan-400' : valor < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {valor >= 0 ? `+${valor}` : valor}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateAtributo(chave, valor + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onIrParaRolador(personagem, chave)}
                        className="w-full mt-2 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 flex items-center justify-center gap-1 transition"
                      >
                        <Dice5 className="w-3 h-3" />
                        Testar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bloco de Vigília: Resistência, Defesa, Vida, Foco e PO */}
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Vigília & Combate
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Resistência = 6 + Corpo · Defesa = 8 + Principal (+ Nível)
                </span>
              </div>

              {/* Grid Vigília */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Resistência */}
                <div className="bg-slate-900/90 border border-slate-800 rounded p-3 font-mono">
                  <div className="text-[11px] text-slate-400 uppercase">Resistência (R)</div>
                  <div className="text-2xl font-bold text-amber-400 my-0.5">{personagem.resistencia}</div>
                  <div className="text-[10px] text-slate-400">6 + {personagem.atributos.corpo} (Corpo)</div>
                </div>

                {/* Defesa */}
                <div className="bg-slate-900/90 border border-slate-800 rounded p-3 font-mono">
                  <div className="text-[11px] text-slate-400 uppercase">Defesa</div>
                  <div className="text-2xl font-bold text-cyan-400 my-0.5">{personagem.defesa}</div>
                  <div className="text-[10px] text-slate-400">
                    8 + {personagem.atributos[personagem.atributoPrincipal]} {progNivel.bonusDefesa > 0 ? `+ ${progNivel.bonusDefesa} (Nív)` : ''}
                  </div>
                </div>

                {/* Proteção Onírica (PO) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded p-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase">
                    <span>Prot. Onírica</span>
                    <span className="text-cyan-400 font-bold">{personagem.protecaoOniricaAtual}/{personagem.protecaoOniricaMaxima}</span>
                  </div>
                  <div className="flex items-center gap-1.5 my-2">
                    {Array.from({ length: personagem.protecaoOniricaMaxima }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAjustarPO(i < personagem.protecaoOniricaAtual ? -1 : 1)}
                        className={`w-6 h-6 rounded border transition-all ${
                          i < personagem.protecaoOniricaAtual
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                            : 'bg-slate-950 border-slate-700 text-slate-600'
                        }`}
                        title="Gasta 1 PO para abater 1 V após comparar dano à Resistência"
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400">Abate 1 V por dano</div>
                </div>

                {/* Foco (PF) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded p-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase">
                    <span>Foco (PF)</span>
                    <span className="text-amber-400 font-bold">{personagem.focoAtual}/{personagem.focoMaximo}</span>
                  </div>
                  <div className="flex items-center gap-1 my-2">
                    {Array.from({ length: personagem.focoMaximo }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAjustarFoco(i < personagem.focoAtual ? -1 : 1)}
                        className={`w-5 h-6 rounded border transition-all ${
                          i < personagem.focoAtual
                            ? 'bg-amber-500 border-amber-400'
                            : 'bg-slate-950 border-slate-700'
                        }`}
                        title="Gasta 1 PF para receber +2 em um Teste"
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400">1 PF = +2 em um Teste</div>
                </div>

              </div>

              {/* Trilhas de Vida (V) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-3 sm:p-4 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    <span className="text-xs uppercase font-bold text-slate-200">Pontos de Vida (V)</span>
                  </div>
                  <span className="text-xs text-rose-400 font-bold">
                    {personagem.vidaAtual} / {personagem.vidaMaxima} V
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {Array.from({ length: personagem.vidaMaxima }).map((_, i) => {
                    const ativo = i < personagem.vidaAtual;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAjustarVida(ativo ? -1 : 1)}
                        className={`flex-1 h-9 rounded border font-bold flex items-center justify-center text-sm transition-all ${
                          ativo
                            ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                            : 'bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Dano ≤ R: perde 1 V · Dano &gt; R: perde 2 V</span>
                  {personagem.vidaAtual === 0 && (
                    <button
                      onClick={onDispararMovimentoMorte}
                      className="text-rose-400 font-bold underline hover:text-rose-300"
                    >
                      Realizar Movimento de Morte
                    </button>
                  )}
                </div>
              </div>

              {/* Condições de Combate */}
              <div className="border border-slate-800 rounded p-3 bg-slate-950/60 font-mono text-xs">
                <div className="text-[11px] text-slate-400 uppercase mb-2">Condições Ativas:</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'oculto', label: 'Oculto', desc: 'Localizar/perceber sofre Desvantagem quando for difícil; se for impossível, a ação não pode ser realizada.' },
                    { id: 'impedido', label: 'Impedido', desc: 'Se a causa dificulta muito uma ação, ela sofre Desvantagem; se a torna impossível, a ação não ocorre.' },
                    { id: 'vulneravel', label: 'Vulnerável', desc: 'Ações próprias podem sofrer Desvantagem e ações contra você podem receber Vantagem quando exploram a fraqueza.' }
                  ].map(c => {
                    const chave = c.id as keyof typeof condicoes;
                    const ativo = condicoes[chave];
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleCondicao(chave)}
                        className={`p-2 rounded border text-left transition-all ${
                          ativo
                            ? 'bg-rose-950/70 border-rose-600 text-rose-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{c.label}</span>
                          {ativo && <span className="text-[10px] text-rose-400">ATIVO</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-tight">{c.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Armas, Instrumentos e Proteção */}
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Armas, Instrumentos e Proteção
                </h3>
              </div>

              {/* Intensidade de Dano — Área e Distância dependem da fonte, não do dado */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1 px-2">Intensidade</th>
                      <th className="py-1 px-2">Dado</th>
                      <th className="py-1 px-2">Referência / exemplos</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-slate-800/60">
                    <tr><td className="py-1.5 px-2">Leve</td><td className="py-1.5 px-2 font-bold text-cyan-400">d4</td><td className="py-1.5 px-2">Dor, escoriação, socos, chutes e impactos leves.</td></tr>
                    <tr><td className="py-1.5 px-2">Moderado</td><td className="py-1.5 px-2 font-bold text-cyan-400">d6</td><td className="py-1.5 px-2">Ferimento localizado; facas, bastões, fraturas e queimaduras.</td></tr>
                    <tr><td className="py-1.5 px-2">Grave</td><td className="py-1.5 px-2 font-bold text-amber-400">d8</td><td className="py-1.5 px-2">Pistolas, revólveres, lâminas grandes e múltiplos estilhaços.</td></tr>
                    <tr><td className="py-1.5 px-2">Severo</td><td className="py-1.5 px-2 font-bold text-rose-400">d10</td><td className="py-1.5 px-2">Espingardas, fuzis, armas automáticas, esmagamento e grande impacto.</td></tr>
                    <tr><td className="py-1.5 px-2">Devastador</td><td className="py-1.5 px-2 font-bold text-rose-500">d12</td><td className="py-1.5 px-2">Grande explosão, soterramento pesado e esmagamento intenso.</td></tr>
                    <tr><td className="py-1.5 px-2">Onírico</td><td className="py-1.5 px-2 font-bold text-purple-400">d20</td><td className="py-1.5 px-2">Fenômenos Oníricos excepcionalmente poderosos e efeitos compatíveis com Sonhar 5.</td></tr>
                  </tbody>
                </table>
                <p className="mt-2 text-[10px] text-slate-500 font-mono leading-relaxed">
                  Área e Distância Máxima são determinadas pela natureza da fonte de dano e pela narrativa. Consulte “Mais → Dano & Morte” para a tabela completa.
                </p>
              </div>
            </div>

          </div>

          {/* Coluna Direita: Sonhar, Ruptura e Domínios (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Bloco de Ruptura (Trilha 0 a 6 com destaque imponente) */}
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${personagem.ruptura >= 4 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                  <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                    Trilha de Ruptura
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalRupturaAberto(true)}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
                >
                  Registrar / Histórico
                </button>
              </div>

              {/* Trilha de 0 a 6 */}
              <div className="grid grid-cols-7 gap-1.5 my-2">
                {[0, 1, 2, 3, 4, 5, 6].map((num) => {
                  const preenchido = num <= personagem.ruptura;
                  const isAtual = num === personagem.ruptura;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setModalRupturaAberto(true)}
                      className={`h-11 rounded border flex flex-col items-center justify-center font-mono transition-all ${
                        isAtual
                          ? 'bg-rose-950/90 border-rose-500 text-rose-200 font-bold ring-2 ring-rose-500/50 scale-105'
                          : preenchido
                          ? 'bg-slate-900 border-rose-900/60 text-rose-400'
                          : 'bg-slate-950/70 border-slate-800 text-slate-600'
                      }`}
                    >
                      <span className="text-sm">{num}</span>
                      <span className="text-[8px] uppercase">
                        {num === 0 ? 'Firme' : num === 6 ? 'Efeito' : `E${num}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Estado Narrativo Atual da Ruptura */}
              <div className="mt-3 p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="font-bold text-rose-400">{estadoRupturaInfo?.nome} (Nível {personagem.ruptura})</span>
                  <span className="text-[10px] text-slate-500">Livro Básico · Efeitos da Ruptura</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {estadoRupturaInfo?.descricao}
                </p>
                {estadoRupturaInfo?.sintomas && (
                  <p className="text-[10px] text-amber-400/90 mt-1 italic">
                    {estadoRupturaInfo.sintomas}
                  </p>
                )}
              </div>

              {/* Consequências Rápidas */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400 justify-between">
                <span>Convergência: -1</span>
                <span>Realidade: 0</span>
                <span>Sonhar Vence: +1</span>
                <span>Divergência: +2</span>
              </div>
            </div>

            {/* Bloco de Domínios do Sonhar com Nova Progressão do Prompt */}
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                    Domínios do Sonhar
                  </h3>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className={validacaoDom.valida ? 'text-cyan-400' : 'text-rose-400'}>
                    {validacaoDom.pontosUsados} / {validacaoDom.pontosTotais} Pontos
                  </span>
                </div>
              </div>

              {/* Mensagem de Validação da Nova Progressão */}
              {!validacaoDom.valida && (
                <div className="p-2.5 rounded bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Distribuição Inválida de Domínios:
                  </div>
                  {validacaoDom.erros.map((err, idx) => (
                    <p key={idx} className="text-[11px] leading-tight">• {err}</p>
                  ))}
                </div>
              )}

              {/* Lista dos 5 Domínios */}
              <div className="space-y-3 font-mono">
                {[
                  { id: 'consciencia', nome: 'Consciência' },
                  { id: 'espaco', nome: 'Espaço' },
                  { id: 'fluxo', nome: 'Fluxo' },
                  { id: 'substancia', nome: 'Substância' },
                  { id: 'vida', nome: 'Vida' }
                ].map((d) => {
                  const chave = d.id as DominioNome;
                  const nivelAtual = personagem.dominios[chave] || 0;
                  const info = DESCRICAO_DOMINIOS[chave];

                  return (
                    <div key={chave} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{d.nome}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const ativo = lvl <= nivelAtual;
                            const acimaDoLimite = lvl > progNivel.dominioMaximo;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                disabled={acimaDoLimite}
                                onClick={() => {
                                  // Se clicar no atual, desce 1, senão vai para lvl
                                  handleUpdateDominio(chave, lvl === nivelAtual ? lvl - 1 : lvl);
                                }}
                                className={`w-5 h-5 rounded text-[10px] font-bold border transition-all ${
                                  acimaDoLimite
                                    ? 'bg-slate-950/40 border-slate-800 text-slate-700 cursor-not-allowed'
                                    : ativo
                                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'
                                }`}
                                title={`Nível ${lvl} (Máx Nível ${progNivel.dominioMaximo})`}
                              >
                                {lvl}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                        {info.tema}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Percepção Onírica (Livro Básico Pág. 59) */}
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Percepção Onírica (Nível 1 de Domínio)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Perceber ou interpretar algo que já está presente <strong>não exige Teste Onírico</strong>. Revelar ativamente algo oculto, interferir ou produzir uma alteração na Realidade exige uma manifestação normal do Sonhar.
                </p>
                <textarea
                  value={personagem.percepcaoOniricaNotas || ''}
                  onChange={(e) => onSalvar({ ...personagem, percepcaoOniricaNotas: e.target.value })}
                  placeholder="Anotações de percepções oníricas e sensações do Sonhar..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Página 2: Memória, Laços e Pertences */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Ancoragem & Vínculos */}
          <div className="space-y-6">
            
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Anchor className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  Ancoragem (Elo com a Realidade)
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Pessoa, animal, objeto ou memória que conecta você à sua identidade. Permite 1 Movimento de Descanso adicional.
              </p>
              <textarea
                value={personagem.ancoragem}
                onChange={(e) => onSalvar({ ...personagem, ancoragem: e.target.value })}
                rows={3}
                placeholder="Descreva sua Ancoragem existencial..."
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Vínculos */}
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  Vínculos (Relações)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const novoV = {
                      id: 'vinculo-' + Date.now(),
                      nome: 'Novo Vínculo',
                      descricao: 'Natureza do elo...'
                    };
                    onSalvar({
                      ...personagem,
                      vinculos: [...(personagem.vinculos || []), novoV]
                    });
                  }}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              <div className="space-y-2">
                {(!personagem.vinculos || personagem.vinculos.length === 0) ? (
                  <p className="text-xs text-slate-500 font-mono py-2">
                    Nenhum vínculo registrado ainda.
                  </p>
                ) : (
                  personagem.vinculos.map((v, idx) => (
                    <div key={v.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start gap-2">
                      <div className="flex-1 space-y-1 font-mono text-xs">
                        <input
                          type="text"
                          value={v.nome}
                          onChange={(e) => {
                            const nv = [...personagem.vinculos];
                            nv[idx].nome = e.target.value;
                            onSalvar({ ...personagem, vinculos: nv });
                          }}
                          className="w-full bg-transparent font-bold text-slate-200 border-b border-transparent hover:border-slate-700 focus:outline-none focus:border-cyan-500"
                          placeholder="Nome do Personagem ou Aliado"
                        />
                        <input
                          type="text"
                          value={v.descricao}
                          onChange={(e) => {
                            const nv = [...personagem.vinculos];
                            nv[idx].descricao = e.target.value;
                            onSalvar({ ...personagem, vinculos: nv });
                          }}
                          className="w-full bg-transparent text-slate-400 text-[11px] border-b border-transparent hover:border-slate-700 focus:outline-none focus:border-cyan-500"
                          placeholder="Natureza do Vínculo"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nv = personagem.vinculos.filter(item => item.id !== v.id);
                          onSalvar({ ...personagem, vinculos: nv });
                        }}
                        className="text-slate-600 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recursos (Trilha 1 a 5) */}
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  Recursos
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  {personagem.recursos?.[0]?.nome || 'Recursos Nível 1'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Referência abstrata da capacidade de sobrevivência urbana:
                <br />1 Escasso · 2 Limitado · 3 Estável · 4 Confortável · 5 Abundante
              </p>
              <div className="flex gap-2 font-mono text-xs">
                {[1, 2, 3, 4, 5].map(nivelRec => {
                  const nomes = ['Escasso', 'Limitado', 'Estável', 'Confortável', 'Abundante'];
                  const selecionado = (personagem.recursos?.[0]?.quantidade || 1) === nivelRec;
                  return (
                    <button
                      key={nivelRec}
                      type="button"
                      onClick={() => {
                        onSalvar({
                          ...personagem,
                          recursos: [
                            {
                              id: 'rec-main',
                              nome: `Nível ${nivelRec} (${nomes[nivelRec - 1]})`,
                              quantidade: nivelRec,
                              descricao: nomes[nivelRec - 1]
                            }
                          ]
                        });
                      }}
                      className={`flex-1 py-2 rounded border transition-all ${
                        selecionado
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {nivelRec}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* O Desvelado: Aparência, Comportamento e História */}
          <div className="space-y-6">
            
            <div className="bg-[var(--ro-surface)] border border-slate-800 rounded-lg p-5 shadow-lg space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  O Desvelado (Descrição e Toques Finais)
                </h3>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Aparência:</label>
                <textarea
                  value={personagem.anotacoesGerais || ''}
                  onChange={(e) => onSalvar({ ...personagem, anotacoesGerais: e.target.value })}
                  rows={2}
                  placeholder="Aspecto visual, roupas urbanas, cicatrizes, olhar..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Itens Gerais */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400">Itens Gerais & Pertences:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const novoItem = {
                        id: 'item-' + Date.now(),
                        nome: 'Novo Item',
                        descricao: 'Pertence de sobrevivência urbana',
                        bonusResistencia: 0 as const
                      };
                      onSalvar({
                        ...personagem,
                        equipamentos: [...(personagem.equipamentos || []), novoItem]
                      });
                    }}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Item
                  </button>
                </div>

                <div className="space-y-1.5">
                  {personagem.equipamentos?.map((it, idx) => (
                    <div key={it.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start justify-between gap-2 text-xs font-mono">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={it.nome}
                          onChange={(e) => {
                            const ne = [...personagem.equipamentos];
                            ne[idx] = { ...ne[idx], nome: e.target.value };
                            onSalvar({ ...personagem, equipamentos: ne });
                          }}
                          className="bg-transparent font-semibold text-slate-200 focus:outline-none w-full"
                        />
                        <input
                          type="text"
                          value={it.descricao || ''}
                          onChange={(e) => {
                            const ne = [...personagem.equipamentos];
                            ne[idx] = { ...ne[idx], descricao: e.target.value };
                            onSalvar({ ...personagem, equipamentos: ne });
                          }}
                          className="bg-transparent text-[10px] text-slate-400 focus:outline-none w-full"
                          placeholder="Observação / uso"
                        />
                        <label className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
                          Proteção
                          <select
                            value={it.bonusResistencia || 0}
                            onChange={(e) => {
                              const bonus = Number(e.target.value) as 0 | 1 | 2;
                              const ne = personagem.equipamentos.map((item, itemIdx) => itemIdx === idx ? { ...item, bonusResistencia: bonus } : item);
                              onSalvar({
                                ...personagem,
                                equipamentos: ne,
                                resistencia: calcularResistenciaTotal(personagem.atributos.corpo, ne)
                              });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300"
                          >
                            <option value={0}>Sem bônus</option>
                            <option value={1}>+1 R · tático/especializado</option>
                            <option value={2}>+2 R · antiterrorismo/militar</option>
                          </select>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const ne = personagem.equipamentos.filter(x => x.id !== it.id);
                          onSalvar({
                            ...personagem,
                            equipamentos: ne,
                            resistencia: calcularResistenciaTotal(personagem.atributos.corpo, ne)
                          });
                        }}
                        className="text-slate-600 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                  Equipamentos de proteção não acumulam. O sistema aplica apenas o maior bônus: +1 R para equipamento tático/especializado ou +2 R para equipamento antiterrorismo/militar. Bônus atual: +{calcularBonusResistenciaEquipamentos(personagem.equipamentos)} R.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Modais Integrados */}
      <RupturaModal
        personagem={personagem}
        isOpen={modalRupturaAberto}
        onClose={() => setModalRupturaAberto(false)}
        onSalvar={onSalvar}
      />

      <DamageModal
        personagem={personagem}
        isOpen={modalDanoAberto}
        onClose={() => setModalDanoAberto(false)}
        onSalvar={onSalvar}
        onDispararMovimentoMorte={onDispararMovimentoMorte}
      />

      <RestModal
        personagem={personagem}
        isOpen={modalDescansoAberto}
        onClose={() => setModalDescansoAberto(false)}
        onSalvar={onSalvar}
      />

    </div>
  );
};
