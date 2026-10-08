import React, { useState } from 'react';
import { Dice5, Heart, Sparkles } from 'lucide-react';
import { HabilidadeAtor } from '../../types/campaign';
import { abilityRoll, clampActorHp, rollActorDamage, rollActorMundano, rollActorOnirico } from '../../features/realtime/roActorCombat';

interface Props {
  name: string; hp: number; maxHp: number; threatLevel: number; abilities: HabilidadeAtor[];
  onHpChange: (hp: number) => Promise<unknown>;
  onRoll: (description: string, details: Record<string, unknown>) => Promise<unknown>;
}

/** Controles exclusivos do Mestre: PV persistidos e rolagens registradas com visibilidade Mestre. */
export const ActorCombatControls: React.FC<Props> = ({ name, hp, maxHp, threatLevel, abilities, onHpChange, onRoll }) => {
  const [busy,setBusy] = useState(false);
  const [amount,setAmount] = useState(1);
  const [die,setDie] = useState(8);
  const [oniric,setOniric] = useState(false);
  const [bonus,setBonus] = useState(Math.min(5,Math.max(0,threatLevel)));
  const [dt,setDt] = useState(13);
  const [feedback,setFeedback] = useState('');
  const [error,setError] = useState('');

  const editHp = async (delta: number) => {
    if (busy) return;
    setBusy(true);setError('');
    try {
      const next = clampActorHp(hp,maxHp,delta);
      if(next !== hp) await onHpChange(next);
      setFeedback(`PV de ${name}: ${next}/${maxHp}`);
    } catch(reason) {setError(reason instanceof Error ? reason.message : 'Falha ao salvar PV no banco.');}
    finally {setBusy(false);}
  };

  const register = async (description: string, details: Record<string,unknown>) => {
    if (busy) return;
    setBusy(true);setError('');
    try { await onRoll(description,details);setFeedback(description); }
    catch(reason) {setError(reason instanceof Error ? reason.message : 'A rolagem não foi registrada.');}
    finally {setBusy(false);}
  };

  const rollTest = (kind: 'mundano' | 'onirico') => {
    const result = kind==='onirico' ? rollActorOnirico(dt,0) : rollActorMundano(dt,0);
    const description = result.kind==='onirico'
      ? `${name} · Teste Onírico: Realidade ${result.realidade}, Sonhar ${result.sonhar}, DT ${result.dt}: ${result.outcome}; Ruptura ${result.ruptura>=0?'+':''}${result.ruptura}.`
      : `${name} · 1d20 sem bônus: ${result.die} vs DT ${result.dt} — ${result.success?'sucesso':'fracasso'}${result.critical?' crítico':''}.`;
    void register(description,{actor:name,roll:result});
  };

  const rollAbility = (ability: HabilidadeAtor) => {
    if (ability.teste==='reflexo') {
      void register(`${name} · ${ability.nome}: solicitar Teste Reflexo de ${ability.atributo||'Corpo'} ao alvo, DT ${ability.dt??12}.`,{
        actor:name,ability:ability.nome,kind:'reflexo',dt:ability.dt??12,attribute:ability.atributo||'corpo',requiresTargetRoll:true
      });
      return;
    }
    const result = abilityRoll(ability);
    if(!result)return;
    const text = result.kind==='onirico'
      ? `${name} · ${ability.nome}: Realidade ${result.realidade} e Sonhar ${result.sonhar} +${result.modifier} vs DT ${result.dt}: ${result.outcome} (Ruptura ${result.ruptura>=0?'+':''}${result.ruptura}).`
      : `${name} · ${ability.nome}: 1d20 (${result.die}) ${result.modifier>=0?'+':'−'}${Math.abs(result.modifier)} = ${result.total} vs DT ${result.dt}: ${result.success?'sucesso':'fracasso'}.`;
    void register(text,{actor:name,ability:ability.nome,roll:result});
  };
  const rollDamage = () => {
    const applied = oniric ? bonus : 0;
    const result = rollActorDamage(die,applied,oniric);
    void register(`${name} · Dano ${oniric?'onírico':'mundano'}: 1d${die} (${result.die}) ${applied>0?'+ '+applied:''} = ${result.total}.`,{actor:name,roll:result});
  };

  return (
    <div className="live-vtt__combat" onPointerDown={e=>e.stopPropagation()}>
      <div className="live-vtt__combat-hp">
        <Heart size={13}/><strong>PV {hp}/{maxHp}</strong>
        <label>Quantidade <input type="number" min={1} max={99} value={amount} onChange={e=>setAmount(Math.min(99,Math.max(1,Number(e.target.value)||1)))}/></label>
        <button type="button" disabled={busy||hp<=0} onClick={()=>void editHp(-amount)} title="Reduzir PV">− PV</button>
        <button type="button" disabled={busy||hp>=maxHp} onClick={()=>void editHp(amount)} title="Recuperar PV">+ PV</button>
      </div>
      <div className="live-vtt__combat-rolls">
        <label>DT <input type="number" min={1} max={40} value={dt} onChange={e=>setDt(Math.min(40,Math.max(1,Number(e.target.value)||13)))}/></label>
        <button type="button" disabled={busy} onClick={()=>rollTest('mundano')}><Dice5 size={13}/> Ataque 1d20</button>
        <button type="button" disabled={busy} onClick={()=>rollTest('onirico')}><Sparkles size={13}/> Teste Onírico</button>
      </div>
      <div className="live-vtt__combat-damage">
        <label>Dado <select value={die} onChange={e=>setDie(Number(e.target.value))}>
          {[4,6,8,10,12,20].map(f=><option key={f} value={f}>d{f}</option>)}
        </select></label>
        <label><input type="checkbox" checked={oniric} onChange={e=>setOniric(e.target.checked)}/> Dano do Sonhar</label>
        {oniric&&<label>Bônus <select value={bonus} onChange={e=>setBonus(Number(e.target.value))}>
          {[0,1,2,3,4,5].map(n=><option key={n} value={n}>+{n}</option>)}
        </select></label>}
        <button type="button" disabled={busy} onClick={rollDamage}><Dice5 size={13}/> Rolar dano</button>
      </div>
      {abilities.filter(a=>a.categoria!=='passiva'&&a.teste).length>0 && <div className="live-vtt__combat-abilities">
        {abilities.filter(a=>a.categoria!=='passiva'&&a.teste).map(a=><button key={a.id} type="button" disabled={busy} onClick={()=>rollAbility(a)}>
          {a.teste==='reflexo'?'Solicitar Reflexo':a.teste==='onirico'?'Sonhar':'Teste'}: {a.nome}
        </button>)}
      </div>}
      {feedback&&<p className="live-vtt__combat-feedback" role="status">{feedback}</p>}
      {error&&<p className="live-vtt__combat-error" role="alert">{error}</p>}
      <small>Rolagens privadas do Mestre. Dano é rolado; a perda de PV deve ser aplicada conforme a Resistência e as regras.</small>
    </div>
  );
};
