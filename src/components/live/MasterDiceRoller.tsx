import React, { useState } from 'react';
import { Dice5, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import type { NewSessionEvent } from '../../types/sessionEvent';

/** d20 advantage/disadvantage selects one die; normal pools sum all dice. */
export type MasterRollMode = 'normal' | 'vantagem' | 'desvantagem';

export type MasterRollResult = {
  faces: number;
  quantity: number;
  rolls: number[];
  modifier: number;
  total: number;
  difficulty?: number;
  mode?: Exclude<MasterRollMode, 'normal'>;
  selectedRoll?: number;
  discardedRoll?: number;
};

export function rollMasterDice(
  faces: number,
  quantity: number,
  modifier: number,
  difficulty?: number,
  random: () => number = Math.random,
  mode: MasterRollMode = 'normal'
): MasterRollResult {
  if (![4, 6, 8, 10, 12, 20, 100].includes(faces) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 10 ||
      !Number.isInteger(modifier) || Math.abs(modifier) > 99 ||
      (difficulty !== undefined && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 100)) ||
      !['normal', 'vantagem', 'desvantagem'].includes(mode) ||
      (mode !== 'normal' && (faces !== 20 || quantity !== 2))) {
    throw new Error('Configure dados, quantidade, modificador e DT válidos.');
  }
  const rolls = Array.from({length: quantity}, () =>
    Math.min(faces, Math.max(1, Math.floor(random() * faces) + 1))
  );
  if (mode === 'vantagem' || mode === 'desvantagem') {
    const selectedRoll = mode === 'vantagem' ? Math.max(...rolls) : Math.min(...rolls);
    // Both dice are shown in the log; only the selected d20 receives the modifier.
    const selectedIndex = rolls.indexOf(selectedRoll);
    return {
      faces, quantity, rolls, modifier, mode,
      selectedRoll,
      discardedRoll: rolls[1 - selectedIndex],
      total: selectedRoll + modifier,
      ...(difficulty === undefined ? {} : {difficulty})
    };
  }
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
  const [mode, setMode] = useState<MasterRollMode>('normal');
  const [modifier, setModifier] = useState(0);
  const [difficulty, setDifficulty] = useState('');
  const [shareWithPlayers, setShareWithPlayers] = useState(false);
  const [result, setResult] = useState<MasterRollResult | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reason, setReason] = useState('');

  const effectiveQuantity = mode === 'normal' ? quantity : 2;
  const rollLabel = mode === 'vantagem' ? 'Vantagem' : mode === 'desvantagem' ? 'Desvantagem' : 'Soma dos dados';

  const roll = async () => {
    if (sending) return;
    setError('');
    setSaved(false);
    let rolled: MasterRollResult;
    try {
      rolled = rollMasterDice(faces, effectiveQuantity, modifier,
        difficulty === '' ? undefined : Number(difficulty), Math.random, mode);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dados inválidos.');
      return;
    }
    setResult(rolled);
    setSending(true);
    const detail = rolled.mode
      ? `${rollLabel}: ${rolled.quantity}d20 [${rolled.rolls.join(', ')}] → escolhido ${rolled.selectedRoll} (descartado ${rolled.discardedRoll})`
      : `Soma: ${rolled.quantity}d${rolled.faces} [${rolled.rolls.join(', ')}]`;
    try {
      await onRegistrarRolagem({
        type: 'roll',
        visibility: shareWithPlayers ? 'todos' : 'mestre',
        characterId: null,
        content: `Mestre · ${reason.trim() || 'Rolagem livre'}: ${detail} ${modifier >= 0 ? '+' : '−'} ${Math.abs(modifier)} = ${rolled.total}${rolled.difficulty === undefined ? '' : ` (DT ${rolled.difficulty})`}.`,
        metadata: {
          authorRole: 'mestre',
          kind: 'master_free_roll',
          roll: {kind: 'mestre_livre', faces, quantity: effectiveQuantity, rolls: rolled.rolls, total: rolled.total,
            mode, modifier,
            ...(rolled.mode ? {selectedRoll: rolled.selectedRoll, discardedRoll: rolled.discardedRoll} : {}),
            ...(rolled.difficulty === undefined ? {} : {difficulty: rolled.difficulty})}
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
          <select value={faces} onChange={e => {
            const next = Number(e.target.value);
            setFaces(next);
            if (next !== 20) setMode('normal');
          }}>
            {[4, 6, 8, 10, 12, 20, 100].map(value => (
              <option key={value} value={value}>d{value}</option>
            ))}
          </select>
        </label>
        <label>Quantidade
          <input aria-label="Quantidade de dados" type="number" min={1} max={10}
            disabled={mode !== 'normal'}
            value={effectiveQuantity} onChange={e => setQuantity(Number(e.target.value))} />
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
      <fieldset className="live-vtt__master-dice-mode">
        <legend>Como rolar?</legend>
        <div className="live-vtt__master-dice-mode-options">
          {([
            {id: 'normal', label: 'Normal (somar dados)', help: 'Soma os valores de todos os dados, mais o modificador.'},
            {id: 'vantagem', label: 'Vantagem', help: 'Rola 2d20 e usa apenas o maior resultado.'},
            {id: 'desvantagem', label: 'Desvantagem', help: 'Rola 2d20 e usa apenas o menor resultado.'}
          ] as const).map(option => (
            <label key={option.id} title={option.help}>
              <input type="radio" name="master-roll-mode" value={option.id}
                checked={mode === option.id}
                disabled={faces !== 20 && option.id !== 'normal'}
                onChange={() => setMode(option.id)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <small>{mode === 'normal'
          ? 'Rolagem normal: os dados são somados. Para Vantagem ou Desvantagem, escolha d20.'
          : `${rollLabel}: são rolados exatamente 2d20; somente o ${mode === 'vantagem' ? 'maior' : 'menor'} conta. O modificador entra uma única vez.`}</small>
      </fieldset>
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
        <span>{result.mode === 'vantagem' ? 'Vantagem' : result.mode === 'desvantagem' ? 'Desvantagem' : 'Rolagem normal'} · {result.quantity}d{result.faces}: [{result.rolls.join(', ')}]</span>
        {result.mode && <span>Usado: <b>{result.selectedRoll}</b> · Descartado: {result.discardedRoll}</span>}
        <strong>Resultado: {result.total}</strong>
        <span>Modificador: {result.modifier >= 0 ? '+' : '−'} {Math.abs(result.modifier)}{result.mode ? ' (aplicado ao dado escolhido)' : ''}</span>
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
