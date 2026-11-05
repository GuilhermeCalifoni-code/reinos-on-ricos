import React, { useEffect, useRef, useState } from 'react';
import { Dice5, Sparkles, X } from 'lucide-react';
import type { AtributoNome, Personagem, ResultadoTesteMundano, ResultadoTesteOnirico } from '../types/character';
import type { NewSessionEvent } from '../types/sessionEvent';
import { atributoDoTesteOnirico } from '../rules/fichaContrato';
import { ajustarRuptura } from '../rules/rupturaRapida';
import {
  RESULTADO_ONIRICO_ROTULO, rolarMundanoRapido, rolarOniricoRapido, rotuloAtributo,
  type OpcoesMundano, type OpcoesOnirico
} from '../rules/rolagemRapida';

export type PedidoRolagem =
  | { id: number; modo: 'onirico' }
  | { id: number; modo: 'mundano'; atributo?: AtributoNome; rolarDireto?: boolean };

type Resultado =
  | { tipo: 'mundano'; r: ResultadoTesteMundano }
  | { tipo: 'onirico'; r: ResultadoTesteOnirico; rupturaAplicada: boolean };

type EstadoEnvio = 'local' | 'enviando' | 'enviado' | 'erro';

const ATRIBUTOS: AtributoNome[] = ['corpo', 'mente', 'vontade', 'vinculo'];
const sinal = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

interface Props {
  personagem: Personagem;
  pedido: PedidoRolagem | null;
  onFecharPainel: () => void;
  onSalvar: (p: Personagem) => void;
  onRegistrarRolagem?: (event: NewSessionEvent) => Promise<unknown> | void;
  onAbrirRoladorCompleto: (atributo?: AtributoNome) => void;
}

/** Rolagem rápida da ficha: janela pequena para rolar e resultado no canto direito da tela. */
export function RolagemRapida({ personagem, pedido, onFecharPainel, onSalvar, onRegistrarRolagem, onAbrirRoladorCompleto }: Props) {
  const [opMundano, setOpMundano] = useState<OpcoesMundano>({ dt: 12, modoRolagem: 'normal', usarFoco: false, modificador: 0 });
  const [opOnirico, setOpOnirico] = useState<OpcoesOnirico>({ usarFoco: false, condicaoAdversa: false, dificuldadeAdversario: null });
  const [atributo, setAtributo] = useState<AtributoNome>('corpo');
  const [opcoesAbertas, setOpcoesAbertas] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [envio, setEnvio] = useState<EstadoEnvio>('local');
  const ultimoEnvio = useRef(0);
  const botaoRolar = useRef<HTMLButtonElement>(null);

  const registrar = (evento: NewSessionEvent) => {
    if (!onRegistrarRolagem) { setEnvio('local'); return; }
    const n = ++ultimoEnvio.current;
    setEnvio('enviando');
    void Promise.resolve()
      .then(() => onRegistrarRolagem(evento))
      .then(() => { if (ultimoEnvio.current === n) setEnvio('enviado'); })
      .catch(() => { if (ultimoEnvio.current === n) setEnvio('erro'); });
  };

  const rolarMundano = (a: AtributoNome) => {
    const feita = rolarMundanoRapido(personagem, a, opMundano);
    if (feita.personagemAtualizado) onSalvar(feita.personagemAtualizado);
    setResultado({ tipo: 'mundano', r: feita.resultado });
    setOpMundano(o => ({ ...o, usarFoco: false }));
    registrar(feita.evento);
    onFecharPainel();
  };

  const rolarOnirico = () => {
    const feita = rolarOniricoRapido(personagem, opOnirico);
    if (feita.personagemAtualizado) onSalvar(feita.personagemAtualizado);
    setResultado({ tipo: 'onirico', r: feita.resultado, rupturaAplicada: false });
    setOpOnirico(o => ({ ...o, usarFoco: false }));
    registrar(feita.evento);
    onFecharPainel();
  };

  // Novo pedido vindo da ficha (botão do topo ou "Testar aqui" de um atributo).
  useEffect(() => {
    if (!pedido) return;
    setOpcoesAbertas(false);
    if (pedido.modo === 'mundano' && pedido.atributo) {
      setAtributo(pedido.atributo);
      if (pedido.rolarDireto) rolarMundano(pedido.atributo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido?.id]);

  const painelAberto = Boolean(pedido && !(pedido.modo === 'mundano' && pedido.rolarDireto));

  useEffect(() => {
    if (!painelAberto) return;
    botaoRolar.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFecharPainel(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [painelAberto, onFecharPainel]);

  const aplicarRuptura = () => {
    if (!resultado || resultado.tipo !== 'onirico' || resultado.rupturaAplicada) return;
    const r = resultado.r;
    onSalvar(ajustarRuptura(personagem, r.impactoRuptura, `Teste Onírico: ${RESULTADO_ONIRICO_ROTULO[r.resultado]}`));
    setResultado({ ...resultado, rupturaAplicada: true });
  };

  const principal = atributoDoTesteOnirico(personagem);
  const temFoco = personagem.focoAtual > 0;

  return <>
    {painelAberto && pedido && (
      <div className="ro-quickroll__backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onFecharPainel(); }}>
        <section className="ro-quickroll" role="dialog" aria-modal="true"
          aria-label={pedido.modo === 'onirico' ? 'Teste Onírico rápido' : 'Teste Mundano rápido'}>
          <header className="ro-quickroll__head">
            <span>{pedido.modo === 'onirico' ? <Sparkles size={17}/> : <Dice5 size={17}/>}
              {pedido.modo === 'onirico' ? 'Teste Onírico' : 'Teste Mundano'}</span>
            <button type="button" onClick={onFecharPainel} aria-label="Fechar"><X size={17}/></button>
          </header>

          {pedido.modo === 'onirico' ? <>
            <p className="ro-quickroll__principal">
              <span>Atributo Principal</span>
              <strong>{rotuloAtributo(principal.atributo)} {sinal(principal.valor)}</strong>
            </p>
            <small className="ro-quickroll__hint">2d20 (Realidade e Sonhar) + Principal · DT {Math.max(13 + (opOnirico.condicaoAdversa ? 2 : 0), opOnirico.dificuldadeAdversario ?? 0)}</small>
            <label className="ro-quickroll__check">
              <input type="checkbox" checked={opOnirico.usarFoco && temFoco} disabled={!temFoco}
                onChange={e => setOpOnirico(o => ({ ...o, usarFoco: e.target.checked }))}/>
              Usar Foco (+2 nos dois dados) · {personagem.focoAtual} PF
            </label>
            <button type="button" className="ro-quickroll__more" aria-expanded={opcoesAbertas} onClick={() => setOpcoesAbertas(v => !v)}>
              {opcoesAbertas ? '− Menos opções' : '+ Mais opções'}
            </button>
            {opcoesAbertas && <div className="ro-quickroll__options">
              <label className="ro-quickroll__check">
                <input type="checkbox" checked={opOnirico.condicaoAdversa}
                  onChange={e => setOpOnirico(o => ({ ...o, condicaoAdversa: e.target.checked }))}/>
                Condição adversa (+2 na DT)
              </label>
              <label className="ro-quickroll__field">Dificuldade do Adversário
                <input type="number" min={1} placeholder="Sem adversário" value={opOnirico.dificuldadeAdversario ?? ''}
                  onChange={e => setOpOnirico(o => ({ ...o, dificuldadeAdversario: e.target.value === '' ? null : Number(e.target.value) }))}/>
              </label>
            </div>}
            <button ref={botaoRolar} type="button" className="ro-quickroll__roll" onClick={rolarOnirico}><Sparkles size={17}/> Rolar</button>
          </> : <>
            <div className="ro-quickroll__attrs" role="group" aria-label="Escolha o atributo e role">
              {ATRIBUTOS.map(a => (
                <button key={a} type="button" ref={a === atributo ? botaoRolar : undefined}
                  className={a === atributo ? 'is-active' : ''} onClick={() => rolarMundano(a)}>
                  <span>{rotuloAtributo(a)}</span><strong>{sinal(personagem.atributos[a] ?? 0)}</strong>
                </button>
              ))}
            </div>
            <small className="ro-quickroll__hint">Clique no atributo para rolar 1d20 + atributo · DT {opMundano.dt}</small>
            <label className="ro-quickroll__check">
              <input type="checkbox" checked={opMundano.usarFoco && temFoco} disabled={!temFoco}
                onChange={e => setOpMundano(o => ({ ...o, usarFoco: e.target.checked }))}/>
              Usar Foco (+2) · {personagem.focoAtual} PF
            </label>
            <button type="button" className="ro-quickroll__more" aria-expanded={opcoesAbertas} onClick={() => setOpcoesAbertas(v => !v)}>
              {opcoesAbertas ? '− Menos opções' : '+ Mais opções'}
            </button>
            {opcoesAbertas && <div className="ro-quickroll__options">
              <label className="ro-quickroll__field">DT
                <input type="number" min={1} value={opMundano.dt} onChange={e => setOpMundano(o => ({ ...o, dt: Number(e.target.value) || 12 }))}/>
              </label>
              <label className="ro-quickroll__field">Modificador
                <input type="number" value={opMundano.modificador} onChange={e => setOpMundano(o => ({ ...o, modificador: Number(e.target.value) || 0 }))}/>
              </label>
              <div className="ro-quickroll__modes" role="group" aria-label="Modo de rolagem">
                {(['desvantagem', 'normal', 'vantagem'] as const).map(m => (
                  <button key={m} type="button" className={opMundano.modoRolagem === m ? 'is-active' : ''} aria-pressed={opMundano.modoRolagem === m}
                    onClick={() => setOpMundano(o => ({ ...o, modoRolagem: m }))}>{m[0].toUpperCase() + m.slice(1)}</button>
                ))}
              </div>
            </div>}
          </>}
          <button type="button" className="ro-quickroll__full" onClick={() => { onFecharPainel(); onAbrirRoladorCompleto(pedido.modo === 'mundano' ? atributo : undefined); }}>
            Abrir rolador completo
          </button>
        </section>
      </div>
    )}

    {resultado && (
      <aside className="ro-quickroll-result" role="status" aria-live="polite">
        <button type="button" className="ro-quickroll-result__close" onClick={() => setResultado(null)} aria-label="Fechar resultado"><X size={16}/></button>
        {resultado.tipo === 'mundano' ? <>
          <span className="ro-quickroll-result__title">{personagem.nome} · {rotuloAtributo(resultado.r.atributo)}</span>
          <div className="ro-quickroll-result__numbers">
            <div><strong>{resultado.r.totalFinal}</strong><small>TOTAL</small></div>
            <div><strong className="is-die">{resultado.r.dadoBruto}</strong><small>{resultado.r.dadosRolados.length > 1 ? `d20 (${resultado.r.dadosRolados.join(' e ')})` : 'd20'}</small></div>
          </div>
          <p className={`ro-quickroll-result__verdict ${resultado.r.sucesso ? 'is-good' : 'is-bad'}`}>
            {resultado.r.sucesso ? 'Sucesso' : 'Fracasso'} <small>vs DT {resultado.r.dt}{resultado.r.dadoBruto === 20 ? ' · 20 natural' : ''}{resultado.r.focoUtilizado ? ' · Foco +2' : ''}</small>
          </p>
        </> : <>
          <span className="ro-quickroll-result__title">{personagem.nome} · Teste Onírico</span>
          <div className="ro-quickroll-result__numbers">
            <div className={resultado.r.sucessoRealidade ? 'is-pass' : ''}><strong>{resultado.r.totalRealidade}</strong><small>REALIDADE ({resultado.r.dadoRealidade})</small></div>
            <div className={resultado.r.sucessoSonhar ? 'is-pass' : ''}><strong>{resultado.r.totalSonhar}</strong><small>SONHAR ({resultado.r.dadoSonhar})</small></div>
          </div>
          <p className="ro-quickroll-result__verdict">
            {RESULTADO_ONIRICO_ROTULO[resultado.r.resultado]} <small>vs DT {resultado.r.dt}</small>
          </p>
          <p className="ro-quickroll-result__effect">
            {resultado.r.resultado === 'convergencia' || resultado.r.resultado === 'sonhar_vence' ? 'A manifestação acontece.' : 'A manifestação não acontece.'}
            {resultado.r.resultado === 'convergencia' ? ' Crítico.' : ''}
          </p>
          {resultado.r.impactoRuptura !== 0 && (
            <button type="button" className="ro-quickroll-result__apply" disabled={resultado.rupturaAplicada} onClick={aplicarRuptura}>
              {resultado.rupturaAplicada ? `Ruptura ${sinal(resultado.r.impactoRuptura)} aplicada` : `Aplicar ${sinal(resultado.r.impactoRuptura)} de Ruptura`}
            </button>
          )}
        </>}
        <small className="ro-quickroll-result__sent">
          {envio === 'local' ? 'Rolagem local' : envio === 'enviando' ? 'Enviando para a mesa…' : envio === 'enviado' ? 'Registrada na mesa' : 'Não foi registrada na mesa'}
        </small>
      </aside>
    )}
  </>;
}
