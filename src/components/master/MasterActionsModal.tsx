import React, { useState } from 'react';
import { AntagonistaCena, ContadorCena } from '../../types/tension';
import { Personagem, DistanciaFaixa } from '../../types/character';
import { DISTANCIAS_REINOS_ONIRICOS } from '../../rules/rulesData';

export type MasterActionTab = 'antagonista' | 'ambiente' | 'ficcao' | 'contador';

interface MasterActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  abaInicial?: MasterActionTab;
  antagonistas: AntagonistaCena[];
  personagens: Personagem[];
  contadores: ContadorCena[];
  onAtualizarAntagonista: (ant: AntagonistaCena) => void;
  onAtualizarPersonagem: (p: Personagem) => void;
  onAvancarContador: (id: string, delta: number) => void;
  onRegistrarNoLog: (tipo: 'mestre' | 'ambiente' | 'ataque' | 'contador', descricao: string, detalhes?: string) => void;
  onConsumirAcaoMestre: () => void;
}

const PRESETS_AMBIENTE = [
  'Luzes públicas piscam e se apagam; o breu urbano obscurece a visão.',
  'Trem do metrô ou comboio pesado passa gerando ruído ensurdecedor e tremor.',
  'O asfalto racha ou cede sob os pés, desequilibrando quem estiver em movimento.',
  'Manifestação onírica altera a percepção: sombras parecem desacopladas dos corpos.',
  'Porta corta-fogo trava ou passagem é bloqueada por colapso estrutural.',
  'Frequências de rádio e celulares são tomadas por estática e sussurros sussurrados.',
  'Sirenes distantes e reflexos vermelhos cruzam a rua, atraindo curiosos ou viaturas.',
  'A temperatura cai bruscamente e o ar fica saturado com cheiro de ozônio e terra molhada.'
];

export const MasterActionsModal: React.FC<MasterActionsModalProps> = ({
  isOpen,
  onClose,
  abaInicial = 'antagonista',
  antagonistas,
  personagens,
  contadores,
  onAtualizarAntagonista,
  onAtualizarPersonagem,
  onAvancarContador,
  onRegistrarNoLog,
  onConsumirAcaoMestre
}) => {
  const [abaAtiva, setAbaAtiva] = useState<MasterActionTab>(abaInicial);

  // Estado Antagonista
  const [antagonistaId, setAntagonistaId] = useState<string>(antagonistas[0]?.id || '');
  const [alvoPersonagemId, setAlvoPersonagemId] = useState<string>(personagens[0]?.id || '');
  const [acaoSelecionadaId, setAcaoSelecionadaId] = useState<string>('');
  const [resultadoAtaque, setResultadoAtaque] = useState<{
    antagonista: string;
    dadoAtaque: number;
    alvo: string;
    defesaAlvo: number;
    acertou: boolean;
    danoTotal: number;
    danoFormula: string;
  } | null>(null);

  // Estado Ambiente
  const [ambienteDescricao, setAmbienteDescricao] = useState('');
  const [ambienteImpacto, setAmbienteImpacto] = useState('');

  // Estado Mover Ficção
  const [ficcaoTipo, setFiccaoTipo] = useState<
    'obstaculo' | 'distancia' | 'consequencia' | 'revelar_pista' | 'narrativa'
  >('obstaculo');
  const [ficcaoDescricao, setFiccaoDescricao] = useState('');
  const [alvoDistanciaId, setAlvoDistanciaId] = useState<string>(antagonistas[0]?.id || '');
  const [novaDistancia, setNovaDistancia] = useState<DistanciaFaixa>('proxima');

  if (!isOpen) return null;

  const antAtivo = antagonistas.find(a => a.id === antagonistaId) || antagonistas[0];
  const alvoAtivo = personagens.find(p => p.id === alvoPersonagemId) || personagens[0];

  // Resolver Ataque de Antagonista: 1d20 contra Defesa do alvo (SEM bônus arbitrário!)
  const executarAtaqueAntagonista = (danoFormula: string = antAtivo?.danoPadrao || 'd8') => {
    if (!antAtivo || !alvoAtivo) return;

    const dado = Math.floor(Math.random() * 20) + 1;
    const totalAtaque = dado; // Conforme as regras oficiais, 1d20 vs Defesa
    const acertou = totalAtaque >= alvoAtivo.defesa;

    let danoTotal = 0;
    if (acertou) {
      if (danoFormula.includes('d4')) danoTotal = Math.floor(Math.random() * 4) + 1;
      else if (danoFormula.includes('d6')) danoTotal = Math.floor(Math.random() * 6) + 1;
      else if (danoFormula.includes('d8')) danoTotal = Math.floor(Math.random() * 8) + 1;
      else if (danoFormula.includes('d10')) danoTotal = Math.floor(Math.random() * 10) + 1;
      else if (danoFormula.includes('d12')) danoTotal = Math.floor(Math.random() * 12) + 1;
      else danoTotal = Math.floor(Math.random() * 6) + 1;
    }

    setResultadoAtaque({
      antagonista: antAtivo.nome,
      dadoAtaque: totalAtaque,
      alvo: alvoAtivo.nome,
      defesaAlvo: alvoAtivo.defesa,
      acertou,
      danoTotal,
      danoFormula
    });

    onRegistrarNoLog(
      'ataque',
      `${antAtivo.nome} atacou ${alvoAtivo.nome}`,
      `1d20 = ${totalAtaque} vs Defesa ${alvoAtivo.defesa}. ${acertou ? `Acertou! Dano ${danoFormula} = ${danoTotal}` : 'Errou.'}`
    );
  };

  const aplicarDanoAoAlvo = () => {
    if (!resultadoAtaque || !alvoAtivo || resultadoAtaque.danoTotal <= 0) return;
    const novaVida = Math.max(0, alvoAtivo.vidaAtual - resultadoAtaque.danoTotal);
    onAtualizarPersonagem({ ...alvoAtivo, vidaAtual: novaVida });
    onRegistrarNoLog(
      'ataque',
      `Dano aplicado a ${alvoAtivo.nome}`,
      `Vida reduzida de ${alvoAtivo.vidaAtual} para ${novaVida}/${alvoAtivo.vidaMaxima}.`
    );
    onConsumirAcaoMestre();
    onClose();
  };

  const handleAtivarAmbiente = () => {
    if (!ambienteDescricao.trim()) return;
    onRegistrarNoLog(
      'ambiente',
      `Ambiente ativado: ${ambienteDescricao}`,
      ambienteImpacto ? `Impacto na cena: ${ambienteImpacto}` : undefined
    );
    setAmbienteDescricao('');
    setAmbienteImpacto('');
    onConsumirAcaoMestre();
    onClose();
  };

  const handleMoverFiccao = () => {
    if (ficcaoTipo === 'distancia') {
      const ant = antagonistas.find(a => a.id === alvoDistanciaId);
      if (ant) {
        onAtualizarAntagonista({ ...ant, distancia: novaDistancia });
        onRegistrarNoLog(
          'mestre',
          `Distância alterada: ${ant.nome} agora está ${DISTANCIAS_REINOS_ONIRICOS[novaDistancia].nome}`,
          ficcaoDescricao || 'Movimento posicional na cena.'
        );
      }
    } else {
      onRegistrarNoLog(
        'mestre',
        `Ficção movida: ${ficcaoDescricao || ficcaoTipo}`,
        `Tipo de intervenção: ${ficcaoTipo}`
      );
    }
    setFiccaoDescricao('');
    onConsumirAcaoMestre();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[var(--ro-surface)] border border-[var(--ro-line)] w-full max-w-3xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-[var(--ro-line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[var(--ro-copper)] border border-[#75603D]/60 px-1.5 py-0.5 rounded-sm">
              TURNO DO MESTRE
            </span>
            <h2 className="font-serif text-xl text-[var(--ro-paper)]">
              Ação do Mestre
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-[var(--ro-ash)] hover:text-[var(--ro-paper)] font-mono text-sm px-2 py-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Abas das 4 Ações Principais */}
        <div className="bg-[var(--ro-bg)] border-b border-[var(--ro-line)] px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setAbaAtiva('antagonista')}
            className={`px-3 py-1.5 rounded-sm transition-colors uppercase tracking-wider ${
              abaAtiva === 'antagonista'
                ? 'bg-[var(--ro-surface-raised)] text-[var(--ro-paper)] border border-[var(--ro-line-strong)]'
                : 'text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
            }`}
          >
            1. Ativar Antagonista
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('ambiente')}
            className={`px-3 py-1.5 rounded-sm transition-colors uppercase tracking-wider ${
              abaAtiva === 'ambiente'
                ? 'bg-[var(--ro-surface-raised)] text-[var(--ro-paper)] border border-[var(--ro-line-strong)]'
                : 'text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
            }`}
          >
            2. Ativar Ambiente
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('ficcao')}
            className={`px-3 py-1.5 rounded-sm transition-colors uppercase tracking-wider ${
              abaAtiva === 'ficcao'
                ? 'bg-[var(--ro-surface-raised)] text-[var(--ro-paper)] border border-[var(--ro-line-strong)]'
                : 'text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
            }`}
          >
            3. Mover a Ficção
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('contador')}
            className={`px-3 py-1.5 rounded-sm transition-colors uppercase tracking-wider ${
              abaAtiva === 'contador'
                ? 'bg-[var(--ro-surface-raised)] text-[var(--ro-paper)] border border-[var(--ro-line-strong)]'
                : 'text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
            }`}
          >
            4. Avançar Contador
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* ABA 1: ATIVAR ANTAGONISTA */}
          {abaAtiva === 'antagonista' && (
            <div className="space-y-5">
              {antagonistas.length === 0 ? (
                <div className="text-xs font-mono text-[var(--ro-ash)] py-8 text-center">
                  Nenhum antagonista ativo na cena. Adicione uma ameaça primeiro.
                </div>
              ) : (
                <>
                  {/* Seleção do Antagonista e do Alvo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                        Antagonista Agindo
                      </label>
                      <select
                        value={antagonistaId}
                        onChange={(e) => {
                          setAntagonistaId(e.target.value);
                          setResultadoAtaque(null);
                        }}
                        className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2.5 rounded-sm"
                      >
                        {antagonistas.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nome} ({a.vidaAtual}/{a.vidaMaxima} Vida · DEF {a.defesa} · {DISTANCIAS_REINOS_ONIRICOS[a.distancia].nome})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                        Desvelado Alvo
                      </label>
                      <select
                        value={alvoPersonagemId}
                        onChange={(e) => {
                          setAlvoPersonagemId(e.target.value);
                          setResultadoAtaque(null);
                        }}
                        className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2.5 rounded-sm"
                      >
                        {personagens.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome} (Defesa {p.defesa} · Vida {p.vidaAtual}/{p.vidaMaxima})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resumo Rápido da Ameaça Selecionada */}
                  {antAtivo && (
                    <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-4 rounded-sm space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[var(--ro-paper)] font-semibold">{antAtivo.nome}</span>
                        <div className="flex gap-4 text-[var(--ro-ash)]">
                          <span>Vida: <strong className="text-[var(--ro-paper)]">{antAtivo.vidaAtual}/{antAtivo.vidaMaxima}</strong></span>
                          <span>R: <strong className="text-[var(--ro-paper)]">{antAtivo.resistencia}</strong></span>
                          <span>DEF: <strong className="text-[var(--ro-paper)]">{antAtivo.defesa}</strong></span>
                          <span>Distância: <strong className="text-[var(--ro-copper)]">{DISTANCIAS_REINOS_ONIRICOS[antAtivo.distancia].nome}</strong></span>
                        </div>
                      </div>

                      {/* Lista de Ações Disponíveis */}
                      <div>
                        <div className="text-[11px] font-mono text-[var(--ro-ash)] uppercase mb-1.5">
                          Ações do Antagonista:
                        </div>
                        <div className="space-y-1.5">
                          {antAtivo.acoes?.length > 0 ? (
                            antAtivo.acoes.map(ac => (
                              <div
                                key={ac.id}
                                className="p-2.5 bg-[var(--ro-surface)] border border-[var(--ro-line)] rounded-sm flex items-center justify-between text-xs font-mono"
                              >
                                <div>
                                  <span className="text-[var(--ro-paper)] font-medium">{ac.nome}</span>
                                  <span className="text-[var(--ro-ash)] ml-2">{ac.descricao}</span>
                                  {ac.dano && (
                                    <span className="text-[var(--ro-copper)] ml-2">[{ac.dano}]</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => executarAtaqueAntagonista(ac.dano || antAtivo.danoPadrao)}
                                  className="px-3 py-1 bg-[var(--ro-surface-raised)] hover:bg-[var(--ro-accent-soft)] text-[var(--ro-paper)] text-xs rounded-sm transition-colors"
                                >
                                  Executar Ação
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 bg-[var(--ro-surface)] border border-[var(--ro-line)] rounded-sm flex items-center justify-between text-xs font-mono">
                              <div>
                                <span className="text-[var(--ro-paper)]">Ataque Padrão</span>
                                <span className="text-[var(--ro-copper)] ml-2">[{antAtivo.danoPadrao}]</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => executarAtaqueAntagonista(antAtivo.danoPadrao)}
                                className="px-3 py-1 bg-[var(--ro-surface-raised)] hover:bg-[var(--ro-accent-soft)] text-[var(--ro-paper)] text-xs rounded-sm transition-colors"
                              >
                                Atacar Alvo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações Táticas Rápidas */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--ro-line)]">
                        <button
                          type="button"
                          onClick={() => {
                            onRegistrarNoLog('mestre', `${antAtivo.nome} avançou no terreno`, 'Encurtou distância ou assumiu posição ofensiva.');
                            onConsumirAcaoMestre();
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[var(--ro-surface)] hover:bg-[var(--ro-surface-raised)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper-muted)] rounded-sm"
                        >
                          → Avançar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onRegistrarNoLog('mestre', `${antAtivo.nome} recuou para cobertura`, 'Aumentou distância e buscou proteção.');
                            onConsumirAcaoMestre();
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[var(--ro-surface)] hover:bg-[var(--ro-surface-raised)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper-muted)] rounded-sm"
                        >
                          ← Recuar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onRegistrarNoLog('mestre', `${antAtivo.nome} interrompeu a ação dos Desvelados`, 'Preparou disparo ou reação contra aproximação.');
                            onConsumirAcaoMestre();
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[var(--ro-surface)] hover:bg-[var(--ro-surface-raised)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper-muted)] rounded-sm"
                        >
                          ⚡ Interromper / Preparar
                        </button>
                      </div>

                      {/* Reações e Passivas */}
                      {(antAtivo.reacoes?.length > 0 || antAtivo.passivas?.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--ro-line)] text-[11px] font-mono">
                          {antAtivo.passivas?.length > 0 && (
                            <div>
                              <span className="text-[var(--ro-ash)] uppercase block">Passivas:</span>
                              {antAtivo.passivas.map(p => (
                                <div key={p.id} className="text-[var(--ro-paper-muted)]">
                                  • <strong className="text-[var(--ro-paper)]">{p.nome}:</strong> {p.descricao}
                                </div>
                              ))}
                            </div>
                          )}
                          {antAtivo.reacoes?.length > 0 && (
                            <div>
                              <span className="text-[var(--ro-ash)] uppercase block">Reações Disponíveis:</span>
                              {antAtivo.reacoes.map(r => (
                                <div key={r.id} className="text-[var(--ro-paper-muted)]">
                                  • <strong className="text-amber-400/90">{r.gatilho}:</strong> {r.efeito}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exibição do Resultado do Ataque */}
                  {resultadoAtaque && (
                    <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-4 rounded-sm space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-[var(--ro-line)] pb-2">
                        <span className="text-[var(--ro-copper)] uppercase tracking-wider font-semibold">
                          Resolução de Ataque Oficial (1d20 vs Defesa)
                        </span>
                        <span className={resultadoAtaque.acertou ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {resultadoAtaque.acertou ? 'ACERTOU' : 'ERROU'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-[var(--ro-paper)]">
                            1d20 = {resultadoAtaque.dadoAtaque} vs DEF {resultadoAtaque.defesaAlvo} ({resultadoAtaque.alvo})
                          </div>
                          <div className="text-[var(--ro-ash)] text-[11px] mt-0.5">
                            Regra: Ação ofensiva de antagonista usa 1d20 puro contra a Defesa do alvo.
                          </div>
                        </div>

                        {resultadoAtaque.acertou && (
                          <div className="text-right">
                            <div className="text-xl font-bold text-rose-400">
                              {resultadoAtaque.danoTotal} Dano
                            </div>
                            <div className="text-[var(--ro-ash)] text-[11px]">
                              Fórmula: {resultadoAtaque.danoFormula}
                            </div>
                          </div>
                        )}
                      </div>

                      {resultadoAtaque.acertou && resultadoAtaque.danoTotal > 0 && (
                        <div className="pt-2 border-t border-[var(--ro-line)] flex justify-end">
                          <button
                            type="button"
                            onClick={aplicarDanoAoAlvo}
                            className="px-4 py-2 bg-rose-900/60 hover:bg-rose-900 border border-rose-700/60 text-[var(--ro-paper)] text-xs font-mono uppercase tracking-wider rounded-sm transition-colors"
                          >
                            Aplicar {resultadoAtaque.danoTotal} de Dano à Vida de {alvoAtivo.nome} →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ABA 2: ATIVAR AMBIENTE */}
          {abaAtiva === 'ambiente' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-2">
                  Presets Rápidos de Efeito Ambiental
                </label>
                <div className="space-y-1.5">
                  {PRESETS_AMBIENTE.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAmbienteDescricao(p)}
                      className={`w-full text-left p-2.5 border rounded-sm text-xs font-mono transition-colors ${
                        ambienteDescricao === p
                          ? 'bg-[var(--ro-surface-raised)] border-[var(--ro-line-strong)] text-[var(--ro-paper)]'
                          : 'bg-[var(--ro-bg)] border-[var(--ro-line)] text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                  Descrição do Evento Ambiental (Editável)
                </label>
                <input
                  type="text"
                  value={ambienteDescricao}
                  onChange={(e) => setAmbienteDescricao(e.target.value)}
                  placeholder="Ex: O teto do saguão desaba entre os personagens e a saída..."
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2 text-xs text-[var(--ro-paper)] rounded-sm focus:outline-none focus:border-[var(--ro-line-strong)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                  Consequência Narrativa ou Mecânica (Opcional)
                </label>
                <input
                  type="text"
                  value={ambienteImpacto}
                  onChange={(e) => setAmbienteImpacto(e.target.value)}
                  placeholder="Ex: Distância aumentada para Longe, teste de Corpo DT 12 para atravessar..."
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2 text-xs text-[var(--ro-paper)] rounded-sm focus:outline-none focus:border-[var(--ro-line-strong)]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!ambienteDescricao.trim()}
                  onClick={handleAtivarAmbiente}
                  className="px-6 py-2.5 bg-[var(--ro-copper)] disabled:opacity-50 hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-medium font-mono uppercase tracking-wider rounded-sm transition-colors"
                >
                  Confirmar Ação de Ambiente →
                </button>
              </div>
            </div>
          )}

          {/* ABA 3: MOVER A FICÇÃO */}
          {abaAtiva === 'ficcao' && (
            <div className="space-y-4">
              <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-3 rounded-sm text-xs font-mono text-[var(--ro-paper-muted)] flex items-start gap-2">
                <span className="text-[var(--ro-copper)]">✦</span>
                <p>
                  A Ação do Mestre é a ferramenta para moldar a tensão sem depender apenas de combate direto. Use-a para alterar posições, fechar passagens, impor escolhas difíceis ou avançar perigos latentes.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'obstaculo', label: 'Criar Obstáculo' },
                  { id: 'distancia', label: 'Alterar Distância' },
                  { id: 'consequencia', label: 'Aplicar Condição' },
                  { id: 'revelar_pista', label: 'Revelar Pista' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFiccaoTipo(t.id as any)}
                    className={`py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors border ${
                      ficcaoTipo === t.id
                        ? 'bg-[var(--ro-surface-raised)] border-[var(--ro-line-strong)] text-[var(--ro-paper)]'
                        : 'bg-[var(--ro-bg)] border-[var(--ro-line)] text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {ficcaoTipo === 'distancia' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--ro-bg)] border border-[var(--ro-line)] p-4 rounded-sm">
                  <div>
                    <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">
                      Participante / Ameaça
                    </label>
                    <select
                      value={alvoDistanciaId}
                      onChange={(e) => setAlvoDistanciaId(e.target.value)}
                      className="w-full bg-[var(--ro-surface)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm"
                    >
                      {antagonistas.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nome} (Atual: {DISTANCIAS_REINOS_ONIRICOS[a.distancia].nome})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">
                      Nova Faixa de Distância
                    </label>
                    <select
                      value={novaDistancia}
                      onChange={(e) => setNovaDistancia(e.target.value as DistanciaFaixa)}
                      className="w-full bg-[var(--ro-surface)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm"
                    >
                      <option value="imediata">Corpo a Corpo / Imediata</option>
                      <option value="muito_proxima">Muito Próxima</option>
                      <option value="proxima">Próxima</option>
                      <option value="longe">Longe</option>
                      <option value="muito_longe">Muito Longe</option>
                      <option value="alem">Além</option>
                    </select>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                  Registro da Mudança na Ficção
                </label>
                <textarea
                  rows={3}
                  value={ficcaoDescricao}
                  onChange={(e) => setFiccaoDescricao(e.target.value)}
                  placeholder="Descreva o que mudou na narrativa e o que os Desvelados percebem imediatamente..."
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] p-3 text-xs text-[var(--ro-paper)] rounded-sm focus:outline-none focus:border-[var(--ro-line-strong)]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleMoverFiccao}
                  className="px-6 py-2.5 bg-[var(--ro-copper)] hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-medium font-mono uppercase tracking-wider rounded-sm transition-colors"
                >
                  Aplicar na Ficção →
                </button>
              </div>
            </div>
          )}

          {/* ABA 4: AVANÇAR CONTADOR */}
          {abaAtiva === 'contador' && (
            <div className="space-y-4">
              <div className="text-xs font-mono text-[var(--ro-ash)]">
                Avance o progresso de ameaças iminentes, contadores de tempo ou rituais que se movem a cada rodada:
              </div>

              {contadores.length === 0 ? (
                <div className="text-xs font-mono text-[var(--ro-ash)] py-6 text-center border border-dashed border-[var(--ro-line)]">
                  Nenhum contador ativo na cena.
                </div>
              ) : (
                <div className="space-y-2">
                  {contadores.map(c => (
                    <div
                      key={c.id}
                      className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-4 rounded-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-mono font-bold text-[var(--ro-paper)]">{c.nome}</div>
                        {c.descricao && (
                          <div className="text-xs text-[var(--ro-ash)] mt-0.5">{c.descricao}</div>
                        )}
                        <div className="text-xs font-mono text-[var(--ro-copper)] mt-1">
                          Progresso: {c.valorAtual}/{c.valorMaximo} {c.concluido ? '(CONCLUÍDO)' : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAvancarContador(c.id, -1)}
                          className="px-3 py-1 bg-[var(--ro-surface)] hover:bg-[var(--ro-surface-raised)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper-muted)] rounded-sm"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAvancarContador(c.id, 1);
                            onConsumirAcaoMestre();
                            onClose();
                          }}
                          className="px-4 py-1.5 bg-[var(--ro-copper)] hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-mono font-medium uppercase tracking-wider rounded-sm transition-colors"
                        >
                          +1 (Consumir Ação)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
