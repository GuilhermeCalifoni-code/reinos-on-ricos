import React, { useEffect, useState } from 'react';
import { Heart, Skull, X } from 'lucide-react';
import { Personagem } from '../types/character';
import { processarDano } from '../rules/rulesEngine';

interface DamageModalProps {
  personagem: Personagem;
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (personagemAtualizado: Personagem) => void;
  onDispararMovimentoMorte?: () => void;
}

// Atalhos de valor de dano (os mesmos de antes).
const ATALHOS = [
  { label: 'Soco', dado: 'd4', val: 3 },
  { label: 'Faca', dado: 'd6', val: 5 },
  { label: 'Pistola', dado: 'd8', val: 7 },
  { label: 'Fuzil', dado: 'd10', val: 9 },
  { label: 'Pesado', dado: 'd12', val: 11 },
  { label: 'Onírico', dado: 'd20', val: 16 }
];

/** Janela "Sofrer dano": conversão Dano × Resistência (VF18), no visual da ficha. */
export const DamageModal: React.FC<DamageModalProps> = ({ personagem, isOpen, onClose, onSalvar, onDispararMovimentoMorte }) => {
  const [dano, setDano] = useState<number>(6);
  const [usarPO, setUsarPO] = useState<boolean>(personagem.protecaoOniricaAtual > 0);
  const [usarDanoMassivo, setUsarDanoMassivo] = useState<boolean>(true);
  const [opcoesAbertas, setOpcoesAbertas] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const poDisponivel = personagem.protecaoOniricaAtual;
  const r = processarDano(dano, personagem.resistencia, personagem.vidaAtual, poDisponivel, usarPO, usarDanoMassivo);
  const perdaBase = r.vidaPerdida + r.poUtilizada;
  const massivo = usarDanoMassivo && dano > personagem.resistencia * 2;
  const chegouAZero = r.vidaRestante === 0;
  const mudarDano = (v: number) => setDano(Math.max(1, Math.min(99, Math.round(v) || 1)));

  const aplicar = () => {
    onSalvar({ ...personagem, vidaAtual: r.vidaRestante, protecaoOniricaAtual: r.poRestante, atualizadoEm: new Date().toISOString() });
    onClose();
    if (chegouAZero && onDispararMovimentoMorte) onDispararMovimentoMorte();
  };

  return (
    <div className="ro-quickroll__backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="ro-quickroll ro-damage" role="dialog" aria-modal="true" aria-label={`Sofrer dano: ${personagem.nome}`}>
        <header className="ro-quickroll__head">
          <span><Heart size={17}/> Sofrer dano</span>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={17}/></button>
        </header>

        <div className="ro-damage__amount">
          <span>Dano recebido</span>
          <div className="ro-sheet__stepper ro-sheet__stepper--valor">
            <button type="button" disabled={dano <= 1} onClick={() => mudarDano(dano - 1)} aria-label="Diminuir dano">−</button>
            <input type="number" min={1} max={99} value={dano} onChange={e => mudarDano(Number(e.target.value))} aria-label="Valor do dano"/>
            <button type="button" disabled={dano >= 99} onClick={() => mudarDano(dano + 1)} aria-label="Aumentar dano">+</button>
          </div>
        </div>

        <div className="ro-damage__chips" role="group" aria-label="Atalhos de dano">
          {ATALHOS.map(a => (
            <button key={a.label} type="button" className={dano === a.val ? 'is-active' : ''} onClick={() => setDano(a.val)}>
              {a.label} <small>{a.dado}</small>
            </button>
          ))}
        </div>

        <div className={`ro-damage__verdict ${massivo ? 'is-bad' : dano > personagem.resistencia ? 'is-warn' : ''}`}>
          <strong>Perde {perdaBase} PV</strong>
          <small>
            {massivo ? `Dano Massivo: ${dano} > 2 × Resistência (${personagem.resistencia * 2})`
              : dano > personagem.resistencia ? `Dano ${dano} > Resistência ${personagem.resistencia}`
              : `Dano ${dano} ≤ Resistência ${personagem.resistencia}`}
            {r.poUtilizada ? ' · a Proteção Onírica absorve 1' : ''}
          </small>
        </div>

        <label className="ro-quickroll__check">
          <input type="checkbox" checked={usarPO && poDisponivel > 0} disabled={poDisponivel === 0} onChange={e => setUsarPO(e.target.checked)}/>
          Usar 1 Proteção Onírica (−1 PV) · {poDisponivel} PO
        </label>

        <button type="button" className="ro-quickroll__more" aria-expanded={opcoesAbertas} onClick={() => setOpcoesAbertas(v => !v)}>
          {opcoesAbertas ? '− Menos opções' : '+ Mais opções'}
        </button>
        {opcoesAbertas && <div className="ro-quickroll__options">
          <label className="ro-quickroll__check">
            <input type="checkbox" checked={usarDanoMassivo} onChange={e => setUsarDanoMassivo(e.target.checked)}/>
            Regra opcional: Dano Massivo (acima de 2 × Resistência perde 3 PV)
          </label>
        </div>}

        <div className="ro-damage__after">
          <div className={chegouAZero ? 'is-bad' : ''}><small>VIDA</small><strong>{personagem.vidaAtual} → {r.vidaRestante}</strong></div>
          <div><small>PROTEÇÃO ONÍRICA</small><strong>{poDisponivel} → {r.poRestante}</strong></div>
        </div>

        {chegouAZero && (
          <p className="ro-damage__death"><Skull size={17}/> Chega a 0 PV: faça o Movimento de Morte (2d20 contra DT 13).</p>
        )}

        <div className="ro-damage__actions">
          <button type="button" className="ro-damage__cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="ro-quickroll__roll" onClick={aplicar}>
            Aplicar dano{r.vidaPerdida > 0 ? ` (−${r.vidaPerdida} PV)` : ''}
          </button>
        </div>
      </section>
    </div>
  );
};
