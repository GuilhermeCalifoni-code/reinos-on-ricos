import React, {useState} from 'react';
import type {MembroCampanha} from '../../types/campaign';

/** Sem iniciativa: os jogadores escolhem a ordem, e cada ativação alterna com o Mestre. */
export interface RoundState {
  active: boolean;
  round: number;
  phase: 'jogador' | 'mestre';
  currentPlayerId: string | null;
  actedPlayerIds: string[];
}
export const firstRound = (players: string[]): RoundState => ({
  active: true, round: 1, phase: 'jogador',
  currentPlayerId: players[0] || null, actedPlayerIds: []
});
export function nextRoundTurn(current: RoundState, playerIds: string[]): RoundState {
  if (!current.active || !playerIds.length) return current;
  if (current.phase === 'jogador') {
    return {
      ...current, phase: 'mestre',
      actedPlayerIds: [...new Set([...current.actedPlayerIds,
        ...(current.currentPlayerId ? [current.currentPlayerId] : [])])]
    };
  }
  const unplayed = playerIds.filter(id => !current.actedPlayerIds.includes(id));
  return unplayed.length
    ? {...current, phase: 'jogador', currentPlayerId: unplayed[0]}
    : {...current, active: true, round: current.round + 1, phase: 'jogador',
      currentPlayerId: playerIds[0], actedPlayerIds: []};
}
export function parseRoundState(input: unknown): RoundState | null {
  if (!input || typeof input !== 'object') return null;
  const v = input as Record<string,unknown>;
  if (typeof v.active !== 'boolean' || typeof v.round !== 'number' || !Number.isInteger(v.round) || v.round<1 ||
    (v.phase !== 'jogador' && v.phase !== 'mestre') ||
    (v.currentPlayerId !== null && typeof v.currentPlayerId !== 'string') ||
    !Array.isArray(v.actedPlayerIds) ||
    !v.actedPlayerIds.every(x=>typeof x==='string')) return null;
  return {
    active: v.active, round: Number(v.round), phase: v.phase,
    currentPlayerId: v.currentPlayerId as string | null,
    actedPlayerIds: v.actedPlayerIds as string[]
  };
}
interface Props {
  members: MembroCampanha[];
  mestre: boolean;
  ready: boolean;
  value: RoundState | null;
  onChange: (value: RoundState) => Promise<unknown>;
}
export const RoundTracker: React.FC<Props> = ({members,mestre,ready,value,onChange}) => {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const players = members.filter(m=>m.role==='jogador' && m.status==='ativo');
  const playerIds=players.map(m=>m.userId);
  const currentPlayer=players.find(p=>p.userId===value?.currentPlayerId);
  const submit=async (next:RoundState) => {
    if (!mestre || !ready || busy) return;
    setBusy(true);setError('');
    try {await onChange(next);}
    catch(cause) {setError(cause instanceof Error ? cause.message : 'Falha ao salvar a rodada.');}
    finally {setBusy(false);}
  };
  if (!mestre && !value?.active) return null;
  return (
    <section className="live-round-tracker" aria-label="Organização de Rodadas — Jogador e Mestre">
      <div className="live-round-tracker__status">
        <span className="ro-eyebrow">Sem iniciativa · alternância Jogador / Mestre</span>
        <strong>{value?.active ? `Rodada ${value.round}` : 'Organização de rodadas'}</strong>
        <span aria-live="polite">{value?.active
          ? value.phase==='mestre' ? 'Turno do Mestre'
          : `Turno do Jogador: ${currentPlayer?.nome || 'Escolher participante'}`
          : 'Aguardando o Mestre iniciar'}</span>
      </div>
      {value?.active && <div className="live-round-tracker__players" aria-label="Ativações da rodada">
        {players.map(p=><span key={p.userId} className={
          value.actedPlayerIds.includes(p.userId) ? 'is-done'
          : value.phase==='jogador' && value.currentPlayerId===p.userId ? 'is-current' : ''
        }>{p.nome || 'Jogador'}{value.actedPlayerIds.includes(p.userId)?' ✓':''}</span>)}
      </div>}
      {mestre && <div className="live-round-tracker__controls">
        {!value ? (
          <button type="button" disabled={!ready||busy||!players.length}
            onClick={()=>void submit(firstRound(playerIds))}>Iniciar Rodada 1</button>
        ) : !value.active ? (
          <>
            <button type="button" disabled={!ready||busy||!players.length}
              onClick={()=>void submit({...value,active:true})}>Retomar Rodada {value.round}</button>
            <button type="button" disabled={!ready||busy||!players.length}
              onClick={() => {if(window.confirm('Reiniciar o controle a partir da Rodada 1?'))
                void submit(firstRound(playerIds));}}>Reiniciar</button>
          </>
        ) : <>
          {value.phase==='jogador' && <label>Próximo jogador
            <select value={value.currentPlayerId || ''} disabled={!ready||busy}
              onChange={e=>void submit({...value,currentPlayerId:e.target.value})}>
              {players.filter(p=>!value.actedPlayerIds.includes(p.userId)).map(p=>(
                <option key={p.userId} value={p.userId}>{p.nome || 'Jogador'}</option>
              ))}
            </select>
          </label>}
          <button type="button" disabled={!ready||busy}
            onClick={()=>void submit(nextRoundTurn(value,playerIds))}>
            {value.phase==='jogador' ? 'Encerrar Jogador → Mestre'
              : 'Encerrar Mestre → Próximo Jogador'}
          </button>
          <button type="button" disabled={!ready||busy}
            onClick={()=>void submit({...value,active:false})}>Pausar</button>
          <button type="button" disabled={!ready||busy}
            onClick={() => {if(window.confirm('Reiniciar o controle a partir da Rodada 1?'))
              void submit(firstRound(playerIds));}}>Reiniciar</button>
        </>}
        {!players.length && <small>Adicione jogadores ativos à campanha para iniciar.</small>}
        {!ready && <small>Aguardando sincronização da Mesa.</small>}
        {error && <small role="alert">{error}</small>}
      </div>}
    </section>
  );
};
