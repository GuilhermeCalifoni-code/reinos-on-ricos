import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { AtributoNome, DominioNome, Personagem } from '../types/character';
import type { NewSessionEvent } from '../types/sessionEvent';
import { ATRIBUTO_ROTULOS } from '../rules/fichaContrato';
import {
  ATRIBUTO_MAXIMO, DOMINIO_ROTULOS, aplicarSubidaDeNivel, eventoSubidaDeNivel, ganhosDoNivel, pendenciasDaSubida
} from '../rules/subirNivel';

interface Props {
  personagem: Personagem;
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (p: Personagem) => void;
  onRegistrarRolagem?: (event: NewSessionEvent) => Promise<unknown> | void;
}

const ATRIBUTOS: AtributoNome[] = ['corpo', 'mente', 'vontade', 'vinculo'];
const DOMINIOS: DominioNome[] = ['consciencia', 'espaco', 'fluxo', 'substancia', 'vida'];
const sinal = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Subir de nível: abertura com os ganhos, escolhas e uma comemoração curta. */
export function SubirNivelModal({ personagem, isOpen, onClose, onSalvar, onRegistrarRolagem }: Props) {
  const [etapa, setEtapa] = useState<'abertura' | 'escolhas' | 'festa'>('abertura');
  const [historia, setHistoria] = useState('');
  const [atributoExtra, setAtributoExtra] = useState<AtributoNome | null>(null);
  const [pontosNovos, setPontosNovos] = useState<Partial<Record<DominioNome, number>>>({});
  // Guardado na confirmação: depois de salvar, personagem.nivel já é o novo e não serve para a animação.
  const [nivelAlcancado, setNivelAlcancado] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEtapa('abertura'); setHistoria(''); setAtributoExtra(null); setPontosNovos({}); setNivelAlcancado(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || etapa === 'festa') return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [isOpen, etapa, onClose]);

  useEffect(() => {
    if (etapa !== 'festa') return;
    const t = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(t);
  }, [etapa, onClose]);

  if (!isOpen) return null;
  if (etapa === 'festa') {
    return (
      <div className="ro-levelup-party" role="status" aria-live="polite" onClick={onClose}>
        <div className="ro-levelup-party__glow" aria-hidden="true" />
        <span className="ro-levelup-party__eyebrow">{personagem.nome}</span>
        <strong className="ro-levelup-party__number">Nível {nivelAlcancado}</strong>
        <span className="ro-levelup-party__line">Alguma coisa mudou na sua história.</span>
      </div>
    );
  }

  const g = ganhosDoNivel(personagem.nivel + 1);
  if (!g) return null;

  const escolhas = { atributoExtra, pontosNovos, historia };
  const pendencias = pendenciasDaSubida(personagem, escolhas);
  const usados = Object.values(pontosNovos).reduce((t, v) => t + (v ?? 0), 0);
  const restantes = g.pontosDeSonhar - usados;

  const mudarPonto = (d: DominioNome, delta: number) =>
    setPontosNovos(p => ({ ...p, [d]: Math.max(0, (p[d] ?? 0) + delta) }));

  const confirmar = () => {
    if (pendencias.length) return;
    setNivelAlcancado(g.nivel);
    onSalvar(aplicarSubidaDeNivel(personagem, escolhas));
    if (onRegistrarRolagem) void Promise.resolve(onRegistrarRolagem(eventoSubidaDeNivel(personagem, g.nivel, historia))).catch(() => {});
    setEtapa('festa');
  };

  const ganhos = [
    g.vida > 0 && `+${g.vida} PV`,
    g.foco > 0 && `+${g.foco} Foco`,
    g.atributo > 0 && `+${g.atributo} Atributo, à sua escolha`,
    `+${g.pontosDeSonhar} ${g.pontosDeSonhar === 1 ? 'Ponto' : 'Pontos'} de Sonhar`,
    `Domínio máximo ${g.dominioMaximo}${g.nivel === 5 ? ' (só um Domínio pode chegar a 5)' : ''}`
  ].filter(Boolean) as string[];

  return (
    <div className="ro-quickroll__backdrop ro-levelup__backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="ro-quickroll ro-levelup" role="dialog" aria-modal="true" aria-label={`Subir ${personagem.nome} para o nível ${g.nivel}`}>
        <header className="ro-quickroll__head">
          <span><Sparkles size={17}/> Subir de nível</span>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={17}/></button>
        </header>

        {etapa === 'abertura' ? <>
          <div className="ro-levelup__hero">
            <small>Nível {personagem.nivel} →</small>
            <strong>Nível {g.nivel}</strong>
          </div>
          <blockquote className="ro-levelup__quote">
            Personagens não avançam porque acumularam pontos. Avançam porque alguma coisa mudou em sua história.
            <cite>Livro Básico, p. 16</cite>
          </blockquote>
          <div className="ro-levelup__gains">
            <span>O que você ganha</span>
            <ul>{ganhos.map(t => <li key={t}>{t}</li>)}</ul>
          </div>
          <label className="ro-quickroll__field">O que mudou na história? <small>(opcional, vai para as anotações da ficha)</small>
            <textarea rows={3} value={historia} maxLength={600} onChange={e => setHistoria(e.target.value)}
              placeholder="Ex.: Encarou o próprio Pesadelo e entendeu o que ele queria."/>
          </label>
          <button type="button" className="ro-quickroll__roll" onClick={() => setEtapa('escolhas')}>Continuar</button>
        </> : <>
          {g.atributo > 0 && <div className="ro-levelup__block">
            <span className="ro-levelup__label">+1 Atributo · qualquer um, inclusive o Principal</span>
            <div className="ro-quickroll__attrs" role="radiogroup" aria-label="Atributo que recebe +1">
              {ATRIBUTOS.map(a => {
                const atual = personagem.atributos[a] ?? 0;
                const cheio = atual >= ATRIBUTO_MAXIMO;
                return <button key={a} type="button" role="radio" aria-checked={atributoExtra === a} disabled={cheio}
                  className={atributoExtra === a ? 'is-active' : ''} onClick={() => setAtributoExtra(a)}>
                  <span>{ATRIBUTO_ROTULOS[a]}{personagem.atributoPrincipal === a ? ' · Principal' : ''}</span>
                  <strong>{atributoExtra === a ? `${sinal(atual)} → ${sinal(atual + 1)}` : sinal(atual)}</strong>
                </button>;
              })}
            </div>
          </div>}

          <div className="ro-levelup__block">
            <span className="ro-levelup__label">
              Pontos de Sonhar novos · {restantes > 0 ? `faltam ${restantes}` : restantes === 0 ? 'todos distribuídos' : `${-restantes} a mais`} · máximo {g.dominioMaximo} por Domínio
            </span>
            <div className="ro-levelup__domains">
              {DOMINIOS.map(d => {
                const antes = personagem.dominios[d] ?? 0;
                const novo = pontosNovos[d] ?? 0;
                return <div key={d} className="ro-levelup__domain">
                  <span>{DOMINIO_ROTULOS[d]}</span>
                  <div className="ro-sheet__stepper ro-sheet__stepper--valor">
                    <button type="button" disabled={novo <= 0} onClick={() => mudarPonto(d, -1)} aria-label={`Tirar ponto de ${DOMINIO_ROTULOS[d]}`}>−</button>
                    <strong className={novo > 0 ? 'is-new' : ''}>{antes + novo}</strong>
                    <button type="button" disabled={restantes <= 0 || antes + novo >= g.dominioMaximo} onClick={() => mudarPonto(d, 1)} aria-label={`Pôr ponto em ${DOMINIO_ROTULOS[d]}`}>+</button>
                  </div>
                </div>;
              })}
            </div>
          </div>

          {pendencias.length > 0 && <div className="ro-sheet__validation is-warning ro-levelup__pending">
            <strong>Para subir, falta:</strong><ul>{pendencias.map(p => <li key={p}>{p}</li>)}</ul>
          </div>}
          <div className="ro-levelup__actions">
            <button type="button" className="ro-damage__cancel ro-levelup__back" onClick={() => setEtapa('abertura')}>Voltar</button>
            <button type="button" className="ro-quickroll__roll" disabled={pendencias.length > 0} onClick={confirmar}>
              <Sparkles size={17}/> Subir para o nível {g.nivel}
            </button>
          </div>
        </>}
      </section>
    </div>
  );
}
