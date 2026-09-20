import React, { useState } from 'react';
import { 
  Dice5, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  Skull, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight,
  Flame,
  Info
} from 'lucide-react';
import { 
  Personagem, 
  AtributoNome, 
  ResultadoTesteMundano, 
  ResultadoTesteOnirico,
  ResultadoOniricoTipo
} from '../types/character';
import { executarTesteMundano, executarTesteOnirico } from '../rules/rulesEngine';

interface DiceRollerProps {
  personagemAtivo: Personagem | null;
  atributoInicial?: AtributoNome;
  onSalvarPersonagem?: (p: Personagem) => void;
  onAbrirModalRuptura?: (delta: number, motivo: string) => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  personagemAtivo,
  atributoInicial,
  onSalvarPersonagem,
  onAbrirModalRuptura
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'mundano' | 'onirico' | 'morte'>('mundano');

  // Estado do Teste Mundano
  const [atribMundano, setAtribMundano] = useState<AtributoNome>(atributoInicial || 'corpo');
  const [dtMundano, setDtMundano] = useState<number>(12);
  const [modoRolagem, setModoRolagem] = useState<'normal' | 'vantagem' | 'desvantagem'>('normal');
  const [usarFoco, setUsarFoco] = useState<boolean>(false);
  const [modificadorExtra, setModificadorExtra] = useState<number>(0);
  const [nomeModificador, setNomeModificador] = useState<string>('');
  const [resultadoMundano, setResultadoMundano] = useState<ResultadoTesteMundano | null>(null);

  // Estado do Teste Onírico
  const [atribOnirico, setAtribOnirico] = useState<AtributoNome>(atributoInicial || 'vontade');
  const [dtOnirico, setDtOnirico] = useState<number>(13); // Padrão 13 no Livro Básico
  const [condicaoAumentaDT, setCondicaoAumentaDT] = useState<boolean>(false);
  const [resultadoOnirico, setResultadoOnirico] = useState<ResultadoTesteOnirico | null>(null);

  // Estado do Movimento de Morte
  const [resultadoMorte, setResultadoMorte] = useState<{
    dadoRealidade: number;
    dadoSonhar: number;
    sucessoRealidade: boolean;
    sucessoSonhar: boolean;
    tipo: ResultadoOniricoTipo;
    titulo: string;
    efeito: string;
    recuperaVida: number;
    recebeRuptura: number;
  } | null>(null);

  // Executar Teste Mundano
  const handleRolarMundano = () => {
    const valorAtrib = personagemAtivo ? personagemAtivo.atributos[atribMundano] : 0;
    const mods = modificadorExtra !== 0 ? [{ nome: nomeModificador || 'Mod Extra', valor: modificadorExtra }] : [];

    const res = executarTesteMundano({
      atributo: atribMundano,
      valorAtributo: valorAtrib,
      dt: dtMundano,
      modificadores: mods,
      modoRolagem,
      usarFoco
    });

    setResultadoMundano(res);

    // Se usou Foco e há personagem ativo com foco, gasta 1 PF
    if (usarFoco && personagemAtivo && personagemAtivo.focoAtual > 0 && onSalvarPersonagem) {
      onSalvarPersonagem({
        ...personagemAtivo,
        focoAtual: Math.max(0, personagemAtivo.focoAtual - 1),
        atualizadoEm: new Date().toISOString()
      });
    }
  };

  // Executar Teste Onírico
  const handleRolarOnirico = () => {
    const valorAtrib = personagemAtivo ? personagemAtivo.atributos[atribOnirico] : 0;
    const dtFinal = dtOnirico + (condicaoAumentaDT ? 2 : 0);

    const res = executarTesteOnirico({
      atributo: atribOnirico,
      valorAtributo: valorAtrib,
      dt: dtFinal,
      modificadores: []
    });

    setResultadoOnirico(res);
  };

  // Executar Movimento de Morte (Livro Básico pág. 32)
  const handleRolarMovimentoMorte = () => {
    const rolarD20 = () => Math.floor(Math.random() * 20) + 1;
    const dRealidade = rolarD20();
    const dSonhar = rolarD20();
    const dt = 13;

    const sucRealidade = dRealidade >= dt;
    const sucSonhar = dSonhar >= dt;

    let tipo: ResultadoOniricoTipo;
    let titulo = '';
    let efeito = '';
    let recuperaVida = 0;
    let recebeRuptura = 0;

    if (sucRealidade && sucSonhar) {
      tipo = 'convergencia';
      titulo = 'CONVERGÊNCIA';
      efeito = 'Realidade e Sonhar encontram uma maneira de mantê-lo aqui. Retorna à vida com 2 V.';
      recuperaVida = 2;
      recebeRuptura = 0;
    } else if (sucRealidade && !sucSonhar) {
      tipo = 'realidade_vence';
      titulo = 'REALIDADE VENCE';
      efeito = 'Seu corpo físico resiste ao abismo. Retorna à vida com 1 V.';
      recuperaVida = 1;
      recebeRuptura = 0;
    } else if (!sucRealidade && sucSonhar) {
      tipo = 'sonhar_vence';
      titulo = 'SONHAR VENCE';
      efeito = 'Algo impossível impede sua morte. Retorna com 1 V e recebe +2 de Ruptura.';
      recuperaVida = 1;
      recebeRuptura = 2;
    } else {
      tipo = 'divergencia';
      titulo = 'DIVERGÊNCIA';
      efeito = 'Nem a Realidade nem o Sonhar conseguem sustentá-lo. Seu personagem morre. (Reversível apenas por Vida 5).';
      recuperaVida = 0;
      recebeRuptura = 0;
    }

    setResultadoMorte({
      dadoRealidade: dRealidade,
      dadoSonhar: dSonhar,
      sucessoRealidade: sucRealidade,
      sucessoSonhar: sucSonhar,
      tipo,
      titulo,
      efeito,
      recuperaVida,
      recebeRuptura
    });
  };

  const aplicarResultadoMorte = () => {
    if (!resultadoMorte || !personagemAtivo || !onSalvarPersonagem) return;

    let novaVida = Math.min(personagemAtivo.vidaMaxima, personagemAtivo.vidaAtual + resultadoMorte.recuperaVida);
    let novaRuptura = Math.min(6, personagemAtivo.ruptura + resultadoMorte.recebeRuptura);

    onSalvarPersonagem({
      ...personagemAtivo,
      vidaAtual: novaVida,
      ruptura: novaRuptura,
      atualizadoEm: new Date().toISOString()
    });
    alert(`Resultado do Movimento de Morte aplicado! Vida: ${novaVida} V, Ruptura: ${novaRuptura}/6.`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Abas de Navegação do Rolador */}
      <div className="bg-[#12151e] border border-slate-800 rounded-lg p-2 flex gap-2 font-mono text-xs">
        <button
          onClick={() => setAbaAtiva('mundano')}
          className={`flex-1 py-2.5 px-4 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            abaAtiva === 'mundano'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Dice5 className="w-4 h-4 text-amber-400" />
          <span>Teste Mundano (1d20 + Atributo)</span>
        </button>

        <button
          onClick={() => setAbaAtiva('onirico')}
          className={`flex-1 py-2.5 px-4 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            abaAtiva === 'onirico'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Teste Onírico (Realidade + Sonhar)</span>
        </button>

        <button
          onClick={() => setAbaAtiva('morte')}
          className={`py-2.5 px-4 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            abaAtiva === 'morte'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Skull className="w-4 h-4 text-rose-400" />
          <span>Movimento de Morte</span>
        </button>
      </div>

      {/* ABA 1: TESTE MUNDANO */}
      {abaAtiva === 'mundano' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Controles de Entrada */}
          <div className="md:col-span-6 bg-[#12151e] border border-slate-800 rounded-lg p-5 shadow-lg space-y-4 font-mono text-xs">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Configurar Teste Mundano
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                1d20 + Atributo + Modificadores vs DT
              </p>
            </div>

            {/* Atributo */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Atributo Utilizado:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'corpo', label: 'Corpo' },
                  { id: 'mente', label: 'Mente' },
                  { id: 'vontade', label: 'Vontade' },
                  { id: 'vinculo', label: 'Vínculo' }
                ].map(at => {
                  const chave = at.id as AtributoNome;
                  const mod = personagemAtivo?.atributos[chave] ?? 0;
                  const selecionado = atribMundano === chave;
                  return (
                    <button
                      key={at.id}
                      type="button"
                      onClick={() => setAtribMundano(chave)}
                      className={`p-2 rounded border text-left flex items-center justify-between transition ${
                        selecionado
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{at.label}</span>
                      <span className="text-cyan-400 font-bold">{mod >= 0 ? `+${mod}` : mod}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dificuldade (DT) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">Dificuldade do Teste (DT):</label>
                <span className="text-amber-400 font-bold text-sm">DT {dtMundano}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { label: 'Fácil', val: 8 },
                  { label: 'Comum', val: 12 },
                  { label: 'Desafiador', val: 14 },
                  { label: 'Difícil', val: 16 }
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setDtMundano(p.val)}
                    className={`py-1 rounded border text-[11px] ${
                      dtMundano === p.val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {p.label} ({p.val})
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={8}
                max={25}
                value={dtMundano}
                onChange={(e) => setDtMundano(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Vantagem / Desvantagem */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Modo de Rolagem:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Normal (1d20)' },
                  { id: 'vantagem', label: 'Vantagem (2d20 maior)' },
                  { id: 'desvantagem', label: 'Desvantagem (2d20 menor)' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModoRolagem(m.id as any)}
                    className={`py-2 px-1 text-center rounded border text-[11px] font-bold transition ${
                      modoRolagem === m.id
                        ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Foco (+2 no teste) */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usarFoco}
                    disabled={personagemAtivo ? personagemAtivo.focoAtual <= 0 : false}
                    onChange={(e) => setUsarFoco(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/40"
                  />
                  <div>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Gastar 1 Ponto de Foco (+2 no Teste)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Livro Básico pág. 10 · Disponível: {personagemAtivo?.focoAtual ?? 4} PF
                    </span>
                  </div>
                </div>
                {usarFoco && <span className="text-amber-400 font-bold">+2 ATIVO</span>}
              </label>
            </div>

            {/* Modificador Numérico Adicional */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-slate-400 block mb-1">Motivo do Bônus:</label>
                <input
                  type="text"
                  value={nomeModificador}
                  onChange={(e) => setNomeModificador(e.target.value)}
                  placeholder="Ex: Ajudar (+2), Posição..."
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="w-24">
                <label className="text-[11px] text-slate-400 block mb-1">Modificador:</label>
                <input
                  type="number"
                  value={modificadorExtra}
                  onChange={(e) => setModificadorExtra(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs text-center focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Botão de Rolagem */}
            <button
              onClick={handleRolarMundano}
              className="w-full py-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 transition"
            >
              <Dice5 className="w-5 h-5" />
              Executar Teste Mundano
            </button>
          </div>

          {/* Painel de Resolução */}
          <div className="md:col-span-6 bg-[#12151e] border border-slate-800 rounded-lg p-5 shadow-lg font-mono flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-2 mb-4">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  Resolução e Transparência
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cada dado e modificador isolado sem números ocultos
                </p>
              </div>

              {!resultadoMundano ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Dice5 className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                  Configure os parâmetros ao lado e clique em Executar Teste.
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-150">
                  
                  {/* Banner de Resultado */}
                  <div className={`p-4 rounded-lg border text-center ${
                    resultadoMundano.dadoBruto === 20
                      ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : resultadoMundano.sucesso
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-600 text-rose-200'
                  }`}>
                    <div className="text-xs uppercase tracking-widest font-semibold opacity-80">
                      {resultadoMundano.dadoBruto === 20 ? 'CRÍTICO NATURAL' : resultadoMundano.sucesso ? 'SUCESSO' : 'FRACASSO'}
                    </div>
                    <div className="text-3xl font-extrabold my-1 font-['Chakra_Petch']">
                      {resultadoMundano.totalFinal} <span className="text-sm font-normal text-slate-400 font-mono">vs DT {resultadoMundano.dt}</span>
                    </div>
                    <p className="text-xs">
                      {resultadoMundano.dadoBruto === 20
                        ? '20 Natural no d20! Sucesso crítico garantido (dano crítico máximo + dado rolado se aplicável).'
                        : resultadoMundano.sucesso
                        ? 'Ação superou a Dificuldade do Teste!'
                        : 'Ação não alcançou a Dificuldade do Teste.'}
                    </p>
                  </div>

                  {/* Decomposição Passo a Passo */}
                  <div className="bg-slate-950 rounded border border-slate-800 p-3 space-y-2 text-xs">
                    <div className="text-slate-400 font-semibold border-b border-slate-800/80 pb-1">
                      Decomposição do Cálculo:
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Dado Escolhido:</span>
                      <span className="font-bold text-slate-100">
                        [{resultadoMundano.dadoBruto}]
                        {resultadoMundano.dadosRolados.length > 1 && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            (de {resultadoMundano.dadosRolados.join(', ')})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Atributo ({resultadoMundano.atributo}):</span>
                      <span className="font-bold text-cyan-400">
                        {resultadoMundano.valorAtributo >= 0 ? `+${resultadoMundano.valorAtributo}` : resultadoMundano.valorAtributo}
                      </span>
                    </div>
                    {resultadoMundano.focoUtilizado && (
                      <div className="flex justify-between items-center text-amber-300">
                        <span>Ponto de Foco:</span>
                        <span className="font-bold">+2</span>
                      </div>
                    )}
                    {resultadoMundano.modificadores.map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-slate-300">
                        <span>{m.nome}:</span>
                        <span className="font-bold">{m.valor >= 0 ? `+${m.valor}` : m.valor}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-800 pt-1.5 flex justify-between items-center font-bold text-slate-100">
                      <span>Total Final:</span>
                      <span className="text-amber-400 text-sm">{resultadoMundano.totalFinal}</span>
                    </div>
                  </div>

                  {/* Citação de Regra Oficial */}
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-amber-400 font-semibold">Ficção em Primeiro Lugar:</span> Se o teste falhou, o Mestre move a ficção introduzindo uma complicação ou consequência que faça a história continuar, sem travar o jogo.
                  </div>

                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 mt-4 text-right">
              Reinos Oníricos RPG · Livro Básico pág. 28
            </div>
          </div>

        </div>
      )}

      {/* ABA 2: TESTE ONÍRICO (A jóia do sistema) */}
      {abaAtiva === 'onirico' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Controles do Teste Onírico */}
          <div className="md:col-span-5 bg-[#12151e] border border-slate-800 rounded-lg p-5 shadow-lg space-y-4 font-mono text-xs">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold font-['Chakra_Petch'] text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Estrutura do Teste Onírico
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dois dados independentes: 1d20 Realidade + 1d20 Sonhar vs DT 13
              </p>
            </div>

            {/* Atributo da Abordagem */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                Atributo da Abordagem:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mente', label: 'Mente', desc: 'Compreender/estruturar' },
                  { id: 'vontade', label: 'Vontade', desc: 'Impor à Realidade' },
                  { id: 'corpo', label: 'Corpo', desc: 'Movimento / físico' },
                  { id: 'vinculo', label: 'Vínculo', desc: 'Elo / conexão' }
                ].map(at => {
                  const chave = at.id as AtributoNome;
                  const mod = personagemAtivo?.atributos[chave] ?? 0;
                  const selecionado = atribOnirico === chave;
                  return (
                    <button
                      key={at.id}
                      type="button"
                      onClick={() => setAtribOnirico(chave)}
                      className={`p-2 rounded border text-left flex flex-col justify-between transition ${
                        selecionado
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between w-full">
                        <span>{at.label}</span>
                        <span className="text-cyan-400">{mod >= 0 ? `+${mod}` : mod}</span>
                      </div>
                      <span className="text-[9px] opacity-70 font-normal">{at.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DT do Teste Onírico (padrão 13) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">Dificuldade Onírica (DT):</label>
                <span className="text-cyan-400 font-bold">DT {dtOnirico + (condicaoAumentaDT ? 2 : 0)}</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">
                A DT Onírica é normalmente 13 (mede a tensão entre os mundos, não a dificuldade da ação).
              </p>
              
              <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={condicaoAumentaDT}
                  onChange={(e) => setCondicaoAumentaDT(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
                />
                <span className="text-slate-300 text-[11px]">
                  Condição adversa torna manifestação mais difícil (+2 na DT)
                </span>
              </label>
            </div>

            {/* Aviso de Regra Importante */}
            <div className="p-3 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <p className="text-cyan-300 font-semibold flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Regras Absolutas do Teste Onírico:
              </p>
              <p>• NÃO utiliza Vantagem ou Desvantagem.</p>
              <p>• Foco NÃO pode ser utilizado em Testes Oníricos.</p>
              <p>• São dois dados independentes com funções diferentes.</p>
            </div>

            {/* Botão de Rolagem Onírica */}
            <button
              onClick={handleRolarOnirico}
              className="w-full py-3 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-5 h-5" />
              Manifestar (Rolar 2d20 Onírico)
            </button>
          </div>

          {/* Resolução Dual: Realidade vs Sonhar */}
          <div className="md:col-span-7 bg-[#12151e] border border-slate-800 rounded-lg p-5 shadow-lg font-mono flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  Resolução dos Dois Mundos
                </h3>
                <span className="text-[11px] text-slate-400">
                  Realidade e Sonhar avaliados separadamente
                </span>
              </div>

              {!resultadoOnirico ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-30 text-cyan-400 animate-pulse" />
                  Defina a abordagem do Desvelado e clique em Manifestar.
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* Os Dois Dados em Destaque */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Dado de Realidade (Âmbar/Concreto) */}
                    <div className={`p-3.5 rounded-lg border text-center transition-all ${
                      resultadoOnirico.sucessoRealidade
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-950/80 border-slate-800 text-slate-500'
                    }`}>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 mb-1">
                        Dado da Realidade
                      </div>
                      <div className="text-3xl font-extrabold font-['Chakra_Petch'] text-amber-200 my-1">
                        [{resultadoOnirico.dadoRealidade}]
                      </div>
                      <div className="text-xs text-slate-300">
                        Total: <strong>{resultadoOnirico.totalRealidade}</strong> vs DT {resultadoOnirico.dt}
                      </div>
                      <div className={`text-xs font-bold mt-1.5 uppercase ${
                        resultadoOnirico.sucessoRealidade ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {resultadoOnirico.sucessoRealidade ? '✔ Passou a DT' : '✖ Falhou'}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {resultadoOnirico.sucessoRealidade ? 'A Realidade permitiu a manifestação.' : 'A Realidade resistiu ao efeito.'}
                      </p>
                    </div>

                    {/* Dado de Sonhar (Ciano/Névoa) */}
                    <div className={`p-3.5 rounded-lg border text-center transition-all ${
                      resultadoOnirico.sucessoSonhar
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/80 border-slate-800 text-slate-500'
                    }`}>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400 mb-1">
                        Dado do Sonhar
                      </div>
                      <div className="text-3xl font-extrabold font-['Chakra_Petch'] text-cyan-200 my-1">
                        [{resultadoOnirico.dadoSonhar}]
                      </div>
                      <div className="text-xs text-slate-300">
                        Total: <strong>{resultadoOnirico.totalSonhar}</strong> vs DT {resultadoOnirico.dt}
                      </div>
                      <div className={`text-xs font-bold mt-1.5 uppercase ${
                        resultadoOnirico.sucessoSonhar ? 'text-cyan-400' : 'text-slate-500'
                      }`}>
                        {resultadoOnirico.sucessoSonhar ? '✔ Passou a DT' : '✖ Falhou'}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {resultadoOnirico.sucessoSonhar ? 'O Sonhar conseguiu se impor!' : 'O Sonhar não se consolidou.'}
                      </p>
                    </div>

                  </div>

                  {/* Cartão do Resultado Oficial (4 Quadrantes) */}
                  <div className={`p-4 rounded-lg border space-y-2 ${
                    resultadoOnirico.resultado === 'convergencia'
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : resultadoOnirico.resultado === 'realidade_vence'
                      ? 'bg-amber-950/50 border-amber-500 text-amber-100'
                      : resultadoOnirico.resultado === 'sonhar_vence'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-rose-950/60 border-rose-600 text-rose-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        {resultadoOnirico.resultado.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono">
                        {resultadoOnirico.resultado === 'convergencia'
                          ? 'Ruptura: -1'
                          : resultadoOnirico.resultado === 'sonhar_vence'
                          ? 'Ruptura: +1'
                          : resultadoOnirico.resultado === 'divergencia'
                          ? 'Ruptura: +2'
                          : 'Ruptura: 0'}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed">
                      {resultadoOnirico.efeitoNarrativo}
                    </p>

                    {/* Botão de Aplicação Direta de Ruptura */}
                    {resultadoOnirico.impactoRuptura !== 0 && onAbrirModalRuptura && (
                      <div className="pt-2 border-t border-white/10 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const motivo = `Resultado do Teste Onírico: ${resultadoOnirico.resultado.toUpperCase()}`;
                            onAbrirModalRuptura(resultadoOnirico.impactoRuptura, motivo);
                          }}
                          className="px-3 py-1 rounded bg-slate-900/80 hover:bg-slate-900 border border-white/20 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Aplicar {resultadoOnirico.impactoRuptura > 0 ? `+${resultadoOnirico.impactoRuptura}` : resultadoOnirico.impactoRuptura} de Ruptura na Ficha
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 mt-4 text-right">
              Reinos Oníricos RPG · Livro Básico pág. 27
            </div>
          </div>

        </div>
      )}

      {/* ABA 3: MOVIMENTO DE MORTE (Pág. 32) */}
      {abaAtiva === 'morte' && (
        <div className="bg-[#12151e] border border-rose-900/40 rounded-lg p-6 shadow-xl font-mono text-xs space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-rose-950 border border-rose-600 text-rose-400">
                <Skull className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-['Chakra_Petch'] text-slate-100 uppercase tracking-wider">
                  Movimento de Morte
                </h3>
                <p className="text-xs text-slate-400">
                  Ao chegar a 0 de Vida, o personagem aposta sua existência desafiando o Véu.
                </p>
              </div>
            </div>
            <span className="text-rose-400 font-bold border border-rose-900 px-2 py-1 rounded bg-rose-950/40">
              DT 13 (Sem Atributo)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
              <p>
                Role <strong>2d20 puros</strong>: 1d20 de Realidade e 1d20 de Sonhar. Nenhum Atributo é aplicado. Cada dado é comparado separadamente à DT 13.
              </p>
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                <p><strong className="text-emerald-400">Convergência:</strong> Realidade e Sonhar mantêm o personagem. Recupere 2 de Vida.</p>
                <p><strong className="text-amber-400">Realidade vence:</strong> O corpo resiste. Recupere 1 de Vida.</p>
                <p><strong className="text-cyan-400">Sonhar vence:</strong> O impossível impede sua morte. Recupere 1 de Vida e receba +2 de Ruptura.</p>
                <p><strong className="text-rose-400">Divergência:</strong> Nenhum dos mundos consegue sustentá-lo. O personagem morre.</p>
              </div>
              
              <button
                type="button"
                onClick={handleRolarMovimentoMorte}
                className="w-full py-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(244,63,94,0.35)] flex items-center justify-center gap-2 transition"
              >
                <Skull className="w-5 h-5" />
                Rolar Movimento de Morte
              </button>
            </div>

            {/* Resultado do Movimento de Morte */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-center min-h-[220px] flex flex-col justify-center">
              {!resultadoMorte ? (
                <div className="text-slate-500">
                  Clique no botão para desafiar o Véu.
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-center gap-4">
                    <div className="text-center">
                      <span className="text-[10px] uppercase text-amber-400 font-bold">Realidade</span>
                      <div className="text-2xl font-bold font-['Chakra_Petch'] text-amber-200">
                        [{resultadoMorte.dadoRealidade}]
                      </div>
                      <span className={`text-[10px] font-bold ${resultadoMorte.sucessoRealidade ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {resultadoMorte.sucessoRealidade ? 'PASSOU' : 'FALHOU'}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] uppercase text-cyan-400 font-bold">Sonhar</span>
                      <div className="text-2xl font-bold font-['Chakra_Petch'] text-cyan-200">
                        [{resultadoMorte.dadoSonhar}]
                      </div>
                      <span className={`text-[10px] font-bold ${resultadoMorte.sucessoSonhar ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {resultadoMorte.sucessoSonhar ? 'PASSOU' : 'FALHOU'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded border text-left ${
                    resultadoMorte.tipo === 'divergencia'
                      ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}>
                    <div className="font-bold text-sm uppercase mb-1 font-['Chakra_Petch']">
                      {resultadoMorte.titulo}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {resultadoMorte.efeito}
                    </p>
                  </div>

                  {personagemAtivo && (
                    <button
                      type="button"
                      onClick={aplicarResultadoMorte}
                      className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition"
                    >
                      Aplicar Destino na Ficha de {personagemAtivo.nome}
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
