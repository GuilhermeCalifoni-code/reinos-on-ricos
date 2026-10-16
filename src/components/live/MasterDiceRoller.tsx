import React, { useState } from 'react';
import { Dice5, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import type { NewSessionEvent } from '../../types/sessionEvent';

export type MasterRollResult = {
  faces: number;
  quantity: number;
  rolls: number[];
  modifier: number;
  total: number;
  difficulty?: number;
};

export function rollMasterDice(
  faces: number,
  quantity: number,
  modifier: number,
  difficulty?: number,
  random: () => number = Math.random
): MasterRollResult {
  if (![4, 6, 8, 10, 12, 20, 100].includes(faces) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 10 ||
      !Number.isInteger(modifier) || Math.abs(modifier) > 99 ||
      (difficulty !== undefined && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 100))) {
    throw new Error('Configure dados, quantidade, modificador e DT válidos.');
  }
  const rolls = Array.from({length: quantity}, () =>
    Math.min(faces, Math.max(1, Math.floor(random() * faces) + 1))
  );
  return {faces, quantity, rolls, modifier,
    total: rolls.reduce((sum, die) => sum + die, modifier),
    ...(difficulty === undefined ? {} : {difficulty})};
}

interface Props {
  onRegistrarRolagem: (event: NewSessionEvent) => Promise<unknown>;
}

/** Mestre rolls from an independent pool — never inherits or modifies a player sheet. */
export const MasterDiceRoller: React.FC<Props> = ({onRegistrarRolagem}) => {
  const [faces, setFaces] = useState(20);
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [difficulty, setDifficulty] = useState('');
  const [shareWithPlayers, setShareWithPlayers] = useState(false);
  const [result, setResult] = useState<MasterRollResult | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reason, setReason] = useState('');

  const roll = async () => {
    if (sending) return;
    setError('');
    setSaved(false);
    let rolled: MasterRollResult;
    try {
      rolled = rollMasterDice(faces, quantity, modifier, difficulty === '' ? undefined : Number(difficulty));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dados inválidos.');
      return;
    }
    setResult(rolled);
    setSending(true);
    try {
      await onRegistrarRolagem({
        type: 'roll',
        visibility: shareWithPlayers ? 'todos' : 'mestre',
        characterId: null,
        content: `Mestre · ${reason.trim() || 'Rolagem livre'}: ${quantity}d${faces} [${rolled.rolls.join(', ')}] ${modifier >= 0 ? '+' : '−'} ${Math.abs(modifier)} = ${rolled.total}${rolled.difficulty === undefined ? '' : ` (DT ${rolled.difficulty})`}.`,
        metadata: {
          authorRole: 'mestre',
          kind: 'master_free_roll',
          roll: {kind: 'mestre_livre', faces, quantity, rolls: rolled.rolls, total: rolled.total,
            modifier, ...(rolled.difficulty === undefined ? {} : {difficulty: rolled.difficulty})}
        }
      });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'O Registro Vivo não confirmou a rolagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="live-vtt__master-dice" aria-label="Rolador independente do Mestre">
      <div className="live-vtt__master-dice-title">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <h2>Dados do Mestre</h2>
          <p>Rolagens livres, sem ficha associada e sem gastar recursos de Desvelados.</p>
        </div>
      </div>
      <div className="live-vtt__master-dice-fields">
        <label>Tipo de dado
          <select value={faces} onChange={e => setFaces(Number(e.target.value))}>
            {[4, 6, 8, 10, 12, 20, 100].map(value => (
              <option key={value} value={value}>d{value}</option>
            ))}
          </select>
        </label>
        <label>Quantidade
          <input aria-label="Quantidade de dados" type="number" min={1} max={10}
            value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </label>
        <label>Modificador
          <input aria-label="Modificador do Mestre" type="number" min={-99} max={99}
            value={modifier} onChange={e => setModifier(Number(e.target.value))} />
        </label>
        <label>DT (opcional)
          <input aria-label="DT opcional do Mestre" type="number" min={1} max={100}
            placeholder="Sem DT" value={difficulty}
            onChange={e => setDifficulty(e.target.value)} />
        </label>
      </div>
      <label className="live-vtt__master-dice-reason">Descrição da rolagem (opcional)
        <input value={reason} maxLength={100} onChange={e => setReason(e.target.value)}
          placeholder="Ex.: percepção do inimigo, evento, sorte..." />
      </label>
      <label className="live-vtt__master-dice-visibility">
        <input type="checkbox" checked={shareWithPlayers}
          onChange={e => setShareWithPlayers(e.target.checked)} />
        {shareWithPlayers ? <Eye size={17} /> : <EyeOff size={17} />}
        {shareWithPlayers ? 'Compartilhar resultado com os Jogadores' : 'Rolagem privada: apenas o Mestre vê'}
      </label>
      <button type="button" className="live-vtt__master-dice-roll" disabled={sending}
        onClick={() => { void roll(); }}>
        <Dice5 size={20} aria-hidden="true" />
        {sending ? 'Registrando...' : 'Rolar dados'}
      </button>
      {result && <div className="live-vtt__master-dice-result" role="status" aria-live="polite">
        <span>{result.quantity}d{result.faces}: [{result.rolls.join(', ')}] {result.modifier >= 0 ? '+' : '−'} {Math.abs(result.modifier)}</span>
        <strong>Total: {result.total}</strong>
        {result.difficulty !== undefined &&
          <span>{result.total >= result.difficulty ? 'Alcançou' : 'Não alcançou'} DT {result.difficulty}</span>}
        {saved && <span>Rolagem salva no Registro Vivo.</span>}
      </div>}
      {error && <p role="alert" className="live-vtt__master-dice-error">
        {result ? 'Rolagem realizada, mas não registrada: ' : ''}{error}
      </p>}
    </div>
  );
};
