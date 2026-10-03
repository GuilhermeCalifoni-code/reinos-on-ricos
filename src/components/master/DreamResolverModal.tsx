import React, { useState } from 'react';
import { DominioNome, AtributoNome, Personagem, DistanciaFaixa } from '../../types/character';
import { LINGUAGEM_DOMINIOS, DESCRICAO_DOMINIOS, DISTANCIAS_REINOS_ONIRICOS } from '../../rules/rulesData';
import { passosPotenciaDoNivel } from '../../rules/referenceTables';
import { TesteOniricoResultado } from '../../types/tension';

interface DreamResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  personagens: Personagem[];
  onRegistrarNoLog: (tipo: 'sonhar', descricao: string, detalhes?: string) => void;
}

export const DreamResolverModal: React.FC<DreamResolverModalProps> = ({
  isOpen,
  onClose,
  personagens,
  onRegistrarNoLog
}) => {
  const [modoAba, setModoAba] = useState<'sonhar' | 'percepcao'>('sonhar');

  // Personagem Ativo no Assistente
  const [personagemId, setPersonagemId] = useState<string>(personagens[0]?.id || '');
  const personagemAtual = personagens.find(p => p.id === personagemId) || personagens[0];

  // Etapas do Sonhar
  const [intencaoJogador, setIntencaoJogador] = useState('');
  const [dominioSelecionado, setDominioSelecionado] = useState<DominioNome>('consciencia');
  const [nivelVerbo, setNivelVerbo] = useState<number>(1);
  const [alcance, setAlcance] = useState<DistanciaFaixa>('muito_proxima');
  const [tipoAlvo, setTipoAlvo] = useState<'unico' | 'pequeno_grupo' | 'area_ampla'>('unico');
  const [duracao, setDuracao] = useState<'instantanea' | 'rodada' | 'cena'>('instantanea');
  const [complexidade, setComplexidade] = useState<'simples' | 'complexa'>('simples');
  const [atributoEscolhido, setAtributoEscolhido] = useState<AtributoNome>('mente');
  const [dtDificuldade, setDtDificuldade] = useState<number>(13);

  // Resultado do Teste
  const [resultadoTeste, setResultadoTeste] = useState<TesteOniricoResultado | null>(null);

  // Percepção Onírica
  const [dominioPercepcao, setDominioPercepcao] = useState<DominioNome>('consciencia');
  const [alvoPercepcao, setAlvoPercepcao] = useState('');
  const [resultadoPercepcao, setResultadoPercepcao] = useState('');

  if (!isOpen) return null;

  const nivelDominioPJ = personagemAtual?.dominios?.[dominioSelecionado] || 0;
  const excedeNivelPJ = nivelVerbo > nivelDominioPJ;
  const valorAtributoPJ = personagemAtual?.atributos?.[atributoEscolhido] || 0;
  const passosPotencia = passosPotenciaDoNivel(nivelVerbo);

  // Executar Teste Onírico — cada dado é avaliado separadamente contra a mesma DT.
  const executarTesteOnirico = () => {
    if (excedeNivelPJ) return;
    const dadoRealidade = Math.floor(Math.random() * 20) + 1;
    const totalRealidade = dadoRealidade + valorAtributoPJ;
    const sucessoRealidade = totalRealidade >= dtDificuldade;

    const dadoSonho = Math.floor(Math.random() * 20) + 1;
    const totalSonho = dadoSonho + valorAtributoPJ;
    const sucessoSonho = totalSonho >= dtDificuldade;

    let interpretacao = '';
    let consequencia = '';

    if (sucessoRealidade && sucessoSonho) {
      interpretacao = 'CONVERGÊNCIA: a manifestação acontece e é crítica.';
      consequencia = 'Reduza 1 de Ruptura. Se a manifestação causar dano, aplique Dano Crítico.';
    } else if (sucessoRealidade && !sucessoSonho) {
      interpretacao = 'REALIDADE VENCE: a manifestação não acontece.';
      consequencia = 'A Ruptura não se altera. Para tentar novamente, algo relevante precisa mudar.';
    } else if (!sucessoRealidade && sucessoSonho) {
      interpretacao = 'SONHAR VENCE: a manifestação acontece.';
      consequencia = 'Aumente 1 de Ruptura e aplique normalmente os efeitos da manifestação.';
    } else {
      interpretacao = 'DIVERGÊNCIA: a manifestação não acontece.';
      consequencia = 'Aumente 2 de Ruptura. Para tentar novamente, algo relevante precisa mudar.';
    }

    const resultado: TesteOniricoResultado = {
      atributoNome: atributoEscolhido,
      atributoValor: valorAtributoPJ,
      dt: dtDificuldade,
      realidadeDado: dadoRealidade,
      realidadeTotal: totalRealidade,
      realidadeSucesso: sucessoRealidade,
      sonhoDado: dadoSonho,
      sonhoTotal: totalSonho,
      sonhoSucesso: sucessoSonho,
      interpretacao,
      consequenciaSugerida: consequencia
    };

    setResultadoTeste(resultado);

    onRegistrarNoLog(
      'sonhar',
      `${personagemAtual.nome} manifestou ${DESCRICAO_DOMINIOS[dominioSelecionado].nome} (${LINGUAGEM_DOMINIOS[nivelVerbo - 1]?.verbo})`,
      `Realidade: ${dadoRealidade}+${valorAtributoPJ}=${totalRealidade} (${sucessoRealidade ? 'Sucesso' : 'Falha'}) | Sonhar: ${dadoSonho}+${valorAtributoPJ}=${totalSonho} (${sucessoSonho ? 'Sucesso' : 'Falha'}) vs DT ${dtDificuldade}. ${interpretacao}`
    );
  };

  const handleRegistrarPercepcao = () => {
    if (!alvoPercepcao.trim()) return;
    onRegistrarNoLog(
      'sonhar',
      `Percepção Onírica (${DESCRICAO_DOMINIOS[dominioPercepcao].nome}) por ${personagemAtual.nome}`,
      `Observando: ${alvoPercepcao}. ${resultadoPercepcao ? 'Descoberta: ' + resultadoPercepcao : ''} (Perceber ou interpretar algo já presente não exige Teste Onírico; interferir, revelar ativamente algo oculto ou alterar a Realidade exige.)`
    );
    setAlvoPercepcao('');
    setResultadoPercepcao('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[var(--ro-surface)] border border-[var(--ro-line)] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-[var(--ro-line)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold tracking-widest text-[var(--ro-copper)] border border-[#75603D]/60 px-1.5 py-0.5 rounded-sm">
              ONÍRICO
            </span>
            <h2 className="font-serif text-xl text-[var(--ro-paper)]">
              Assistente de Sonhar & Percepção
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[var(--ro-bg)] border border-[var(--ro-line)] p-0.5 rounded-sm text-xs font-mono">
              <button
                onClick={() => setModoAba('sonhar')}
                className={`px-3 py-1 rounded-sm transition-colors ${
                  modoAba === 'sonhar' ? 'bg-[var(--ro-surface-raised)] text-[var(--ro-paper)]' : 'text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
                }`}
              >
                Resolver Sonhar
              </button>
              <button
                onClick={() => setModoAba('percepcao')}
                className={`px-3 py-1 rounded-sm transition-colors ${
                  modoAba === 'percepcao' ? 'bg-[var(--ro-surface-raised)] text-[var(--ro-paper)]' : 'text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
                }`}
              >
                Percepção Onírica
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-[var(--ro-ash)] hover:text-[var(--ro-paper)] font-mono text-sm px-2 py-1 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Seleção de Desvelado */}
          <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-3 rounded-sm flex items-center justify-between">
            <div className="text-xs font-mono text-[var(--ro-ash)] uppercase">
              Desvelado Agindo:
            </div>
            <select
              value={personagemId}
              onChange={(e) => setPersonagemId(e.target.value)}
              className="bg-[var(--ro-surface)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] px-3 py-1.5 rounded-sm focus:outline-none focus:border-[var(--ro-line-strong)]"
            >
              {personagens.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Nível {p.nivel} · Foco {p.focoAtual}/{p.focoMaximo} · Ruptura {p.ruptura}/6)
                </option>
              ))}
            </select>
          </div>

          {modoAba === 'sonhar' ? (
            <div className="space-y-6">
              
              {/* Etapa 1: O que o jogador quer fazer */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                  Etapa 1 · Intenção do Desvelado na Ficção
                </label>
                <input
                  type="text"
                  value={intencaoJogador}
                  onChange={(e) => setIntencaoJogador(e.target.value)}
                  placeholder="Ex: Curvar a geometria do corredor para afastar o Agente do Véu..."
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2 text-xs text-[var(--ro-paper)] rounded-sm focus:outline-none focus:border-[var(--ro-line-strong)]"
                />
              </div>

              {/* Etapa 2 e 3: Domínio e Nível do Verbo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                    Etapa 2 · Domínio Envolvido
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(Object.keys(DESCRICAO_DOMINIOS) as DominioNome[]).map(d => {
                      const pjDom = personagemAtual?.dominios?.[d] || 0;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDominioSelecionado(d)}
                          className={`text-left px-3 py-2 border rounded-sm transition-colors text-xs ${
                            dominioSelecionado === d
                              ? 'bg-[var(--ro-surface-raised)] border-[var(--ro-line-strong)] text-[var(--ro-paper)]'
                              : 'bg-[var(--ro-bg)] border-[var(--ro-line)] text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-semibold capitalize text-[var(--ro-paper)]">{d}</span>
                            <span className="text-[11px] text-[var(--ro-copper)]">Ficha: Nível {pjDom}</span>
                          </div>
                          <div className="text-[11px] text-[var(--ro-ash)] mt-0.5 line-clamp-1">
                            {DESCRICAO_DOMINIOS[d].tema}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                    Etapa 3 · Nível do Verbo / Intensidade
                  </label>
                  <div className="space-y-1.5">
                    {LINGUAGEM_DOMINIOS.map(item => (
                      <button
                        key={item.nivel}
                        type="button"
                        onClick={() => setNivelVerbo(item.nivel)}
                        className={`w-full text-left px-3 py-2 border rounded-sm transition-colors text-xs ${
                          nivelVerbo === item.nivel
                            ? 'bg-[var(--ro-surface-raised)] border-[var(--ro-line-strong)] text-[var(--ro-paper)]'
                            : 'bg-[var(--ro-bg)] border-[var(--ro-line)] text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-semibold text-[var(--ro-paper)]">L{item.nivel} — {item.verbo}</span>
                          {item.nivel > nivelDominioPJ && (
                            <span className="text-[10px] text-amber-500 font-mono">Excede Ficha</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--ro-ash)] mt-0.5">
                          {item.descricao}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Limite mecânico do Domínio */}
              {excedeNivelPJ && (
                <div className="bg-amber-950/20 border border-amber-900/60 p-3 rounded-sm text-xs font-mono text-amber-300 flex items-start gap-2">
                  <span>⚠</span>
                  <div className="space-y-1">
                    <p className="font-semibold">Esta manifestação excede o Domínio atual ({nivelDominioPJ}) do Desvelado.</p>
                    <p className="text-[11px] text-amber-400/80">
                      O Nível do Domínio define o que é possível manifestar. Reformule a intenção para um efeito permitido pelo nível atual, combine Domínios quando a ficção justificar ou busque outra solução narrativa. Aumentar a DT não substitui um nível de Domínio que o Desvelado ainda não possui.
                    </p>
                  </div>
                </div>
              )}

              {/* Parâmetros Operacionais: Alcance, Alvos, Duração, Complexidade, Atributo, DT */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono text-[var(--ro-ash)] uppercase mb-1">
                    Etapa 4 · Alcance
                  </label>
                  <select
                    value={alcance}
                    onChange={(e) => setAlcance(e.target.value as DistanciaFaixa)}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm"
                  >
                    <option value="imediata">Corpo a Corpo (até 1,5 m)</option>
                    <option value="muito_proxima">Muito Próximo (até 3 m)</option>
                    <option value="proxima">Próximo (3–9 m)</option>
                    <option value="longe">Longe (9–15 m)</option>
                    <option value="muito_longe">Muito Longe (15–30 m)</option>
                    <option value="alem">Além (&gt;30–60 m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--ro-ash)] uppercase mb-1">
                    Etapa 5 · Alvos
                  </label>
                  <select
                    value={tipoAlvo}
                    onChange={(e) => setTipoAlvo(e.target.value as any)}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm"
                  >
                    <option value="unico">Alvo Único</option>
                    <option value="pequeno_grupo">Pequeno Grupo (2-3)</option>
                    <option value="area_ampla">Área Ampla</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--ro-ash)] uppercase mb-1">
                    Etapa 6 · Duração
                  </label>
                  <select
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value as any)}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm"
                  >
                    <option value="instantanea">Instantâneo</option>
                    <option value="rodada">1 Rodada (Níveis 2–3)</option>
                    <option value="cena">1 Cena (Níveis 4–5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--ro-ash)] uppercase mb-1">
                    Etapa 7 · Complexidade
                  </label>
                  <select
                    value={complexidade}
                    onChange={(e) => setComplexidade(e.target.value as any)}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm"
                  >
                    <option value="simples">Simples (1 Ação)</option>
                    <option value="complexa">Complexa (Ritual/Foco)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--ro-ash)] uppercase mb-1">
                    Etapa 8 · Atributo
                  </label>
                  <select
                    value={atributoEscolhido}
                    onChange={(e) => setAtributoEscolhido(e.target.value as AtributoNome)}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm capitalize"
                  >
                    <option value="mente">Mente (+{personagemAtual?.atributos?.mente ?? 0})</option>
                    <option value="vontade">Vontade (+{personagemAtual?.atributos?.vontade ?? 0})</option>
                    <option value="corpo">Corpo (+{personagemAtual?.atributos?.corpo ?? 0})</option>
                    <option value="vinculo">Vínculo (+{personagemAtual?.atributos?.vinculo ?? 0})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--ro-ash)] uppercase mb-1">
                    Etapa 9 · DT
                  </label>
                  <input
                    type="number"
                    value={dtDificuldade}
                    onChange={(e) => setDtDificuldade(Number(e.target.value))}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2 rounded-sm text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-2">
                  <span className="text-[var(--ro-ash)]">Potência</span>
                  <strong className="block text-[var(--ro-copper)] mt-0.5">{nivelVerbo === 1 ? 'Percepção Onírica' : `${passosPotencia} ${passosPotencia === 1 ? 'Passo' : 'Passos'}`}</strong>
                </div>
                <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-2">
                  <span className="text-[var(--ro-ash)]">Alvos</span>
                  <strong className="block text-[var(--ro-paper-muted)] mt-0.5">{tipoAlvo === 'unico' ? '1 alvo por padrão' : 'Múltiplos alvos exigem Área'}</strong>
                </div>
                <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-2">
                  <span className="text-[var(--ro-ash)]">Lembrete</span>
                  <strong className="block text-[var(--ro-paper-muted)] mt-0.5">DT Onírica normalmente 13</strong>
                </div>
              </div>

              {/* Botão de Rolar Teste Onírico */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={executarTesteOnirico}
                  disabled={excedeNivelPJ}
                  className="px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--ro-copper)] hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-medium font-mono uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
                >
                  <span>Executar Teste Onírico (Realidade & Sonho)</span>
                  <span>→</span>
                </button>
              </div>

              {/* Resultado do Teste Onírico */}
              {resultadoTeste && (
                <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-5 rounded-sm space-y-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-[var(--ro-copper)] border-b border-[var(--ro-line)] pb-2">
                    Resultado da Manifestação vs DT {resultadoTeste.dt}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Realidade */}
                    <div className={`p-4 border rounded-sm ${
                      resultadoTeste.realidadeSucesso
                        ? 'border-emerald-900/60 bg-emerald-950/10'
                        : 'border-rose-900/60 bg-rose-950/10'
                    }`}>
                      <div className="text-xs font-mono text-[var(--ro-ash)] uppercase mb-1">Realidade (1d20 + Atributo)</div>
                      <div className="text-2xl font-mono font-bold text-[var(--ro-paper)]">
                        {resultadoTeste.realidadeDado} + {resultadoTeste.atributoValor} = {resultadoTeste.realidadeTotal}
                      </div>
                      <div className={`text-xs font-mono mt-1 ${resultadoTeste.realidadeSucesso ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {resultadoTeste.realidadeSucesso ? '✓ SUCESSO' : '✕ FALHA'}
                      </div>
                    </div>

                    {/* Sonho */}
                    <div className={`p-4 border rounded-sm ${
                      resultadoTeste.sonhoSucesso
                        ? 'border-emerald-900/60 bg-emerald-950/10'
                        : 'border-rose-900/60 bg-rose-950/10'
                    }`}>
                      <div className="text-xs font-mono text-[var(--ro-ash)] uppercase mb-1">Sonho (1d20 + Atributo)</div>
                      <div className="text-2xl font-mono font-bold text-[var(--ro-paper)]">
                        {resultadoTeste.sonhoDado} + {resultadoTeste.atributoValor} = {resultadoTeste.sonhoTotal}
                      </div>
                      <div className={`text-xs font-mono mt-1 ${resultadoTeste.sonhoSucesso ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {resultadoTeste.sonhoSucesso ? '✓ SUCESSO' : '✕ FALHA'}
                      </div>
                    </div>
                  </div>

                  {/* Leitura e Consequência */}
                  <div className="space-y-2 pt-2 border-t border-[var(--ro-line)] text-xs font-mono">
                    <div>
                      <span className="text-[var(--ro-copper)] font-semibold">Leitura da Ficção: </span>
                      <span className="text-[var(--ro-paper)]">{resultadoTeste.interpretacao}</span>
                    </div>
                    <div>
                      <span className="text-[var(--ro-ash)]">Sugestão para o Mestre: </span>
                      <span className="text-[var(--ro-paper-muted)]">{resultadoTeste.consequenciaSugerida}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Modo Percepção Onírica */
            <div className="space-y-5">
              <div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-4 rounded-sm space-y-2 text-xs font-mono">
                <div className="text-[var(--ro-copper)] font-semibold uppercase tracking-wider">
                  Regra do Livro Básico · Percepção Onírica
                </div>
                <p className="text-[var(--ro-paper-muted)] leading-relaxed">
                  A Percepção Onírica é o ato de perscrutar através da névoa consensual da metrópole.
                </p>
                <div className="p-2.5 bg-[var(--ro-surface)] border border-[var(--ro-line)] text-[var(--ro-paper)]">
                  <span className="text-[var(--ro-copper)]">Lembrete de Ação: </span>
                  Perceber ou interpretar aquilo que já está presente <strong className="text-[var(--ro-paper)]">não exige Teste Onírico</strong>. Quando o Desvelado tenta interferir, revelar ativamente algo oculto ou produzir uma alteração na Realidade, resolva normalmente uma manifestação do Sonhar.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                    Domínio da Percepção
                  </label>
                  <select
                    value={dominioPercepcao}
                    onChange={(e) => setDominioPercepcao(e.target.value as DominioNome)}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-paper)] p-2.5 rounded-sm capitalize"
                  >
                    {(Object.keys(DESCRICAO_DOMINIOS) as DominioNome[]).map(d => (
                      <option key={d} value={d}>
                        {DESCRICAO_DOMINIOS[d].nome} — {DESCRICAO_DOMINIOS[d].tema}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                    O que está sendo percebido?
                  </label>
                  <input
                    type="text"
                    value={alvoPercepcao}
                    onChange={(e) => setAlvoPercepcao(e.target.value)}
                    placeholder="Ex: Ecos residuais na parede, intenção hostil oculta..."
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3 py-2.5 text-xs text-[var(--ro-paper)] rounded-sm focus:outline-none focus:border-[var(--ro-line-strong)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-1.5">
                  Informação Revelada pelo Mestre (Para o Log da Cena)
                </label>
                <textarea
                  rows={3}
                  value={resultadoPercepcao}
                  onChange={(e) => setResultadoPercepcao(e.target.value)}
                  placeholder="Ex: O Desvelado percebe que as marcas no concreto não foram feitas por ferramentas humanas, mas por densidade alterada de Substância..."
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] p-3 text-xs text-[var(--ro-paper)] rounded-sm focus:outline-none focus:border-[var(--ro-line-strong)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRegistrarPercepcao}
                  className="px-5 py-2.5 bg-[var(--ro-copper)] hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-medium font-mono uppercase tracking-wider rounded-sm transition-colors"
                >
                  Registrar Percepção na Cena →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
