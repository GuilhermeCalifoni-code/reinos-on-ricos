import React, { useState } from 'react';
import { Heart, Shield, Sparkles, UserRound, Users, X } from 'lucide-react';
import { Personagem } from '../../types/character';
import { Adversario, NPC, TokenMapa } from '../../types/campaign';
import { resolvedTokenHp } from '../../features/realtime/mapTokenInstances';
import { AssetImage } from '../system/AssetImage';
import { ActorCombatControls } from './ActorCombatControls';

type ActorsTab = 'personagens' | 'npcs' | 'ameacas';

interface LiveActorsPanelProps {
  personagens: Personagem[];
  npcs: NPC[];
  adversarios: Adversario[];
  tokens: TokenMapa[];
  onTokenHpChange: (tokenId: string, currentHp: number, maximumHp: number) => Promise<unknown>;
  selecionadoId: string;
  mestre: boolean;
  onSelecionar: (id: string) => void;
  onAbrirFicha: (personagem: Personagem) => void;
  onAjustar: (personagem: Personagem, campo: 'vidaAtual' | 'focoAtual', delta: number) => void;
  onRuptura: (personagem: Personagem) => void;
  onUpdateNpc: (id: string, nextHp: number) => Promise<unknown>;
  onUpdateAdversary: (id: string, nextHp: number) => Promise<unknown>;
  onActorRoll: (content: string, details: Record<string, unknown>) => Promise<unknown>;
  onClose: () => void;
}

const Portrait: React.FC<{ image?: string; name: string }> = ({ image, name }) => (
  <span className={`live-vtt__actor-portrait ${image ? 'has-image' : ''}`}>
    {image
      ? <AssetImage src={image} alt="" />
      : <span>{name.slice(0, 2).toUpperCase()}</span>}
  </span>
);

export const LiveActorsPanel: React.FC<LiveActorsPanelProps> = ({
  personagens,
  npcs,
  adversarios,
  tokens,
  onTokenHpChange,
  selecionadoId,
  mestre,
  onSelecionar,
  onAbrirFicha,
  onAjustar,
  onRuptura,
  onActorRoll,
  onClose
}) => {
  const [tab, setTab] = useState<ActorsTab>('personagens');

  const startDrag = (
    event: React.DragEvent,
    payload: { kind: 'personagem' | 'npc' | 'adversario'; id: string; name: string; imageUrl?: string }
  ) => {
    if (!mestre) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-ro-actor', JSON.stringify(payload));
  };

  return (
    <section className="live-vtt__actors">
      <header className="live-vtt__drawer-head">
        <div>
          <span>Mesa</span>
          <strong>{mestre ? 'Elenco & ameaças' : 'Seu Desvelado'}</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar painel"><X size={16} /></button>
      </header>

      {mestre && (
        <nav className="live-vtt__actor-tabs" aria-label="Elenco da mesa">
          <button type="button" className={tab === 'personagens' ? 'is-active' : ''} onClick={() => setTab('personagens')}>
            <Users size={14} /> Desvelados <span>{personagens.length}</span>
          </button>
          <button type="button" className={tab === 'npcs' ? 'is-active' : ''} onClick={() => setTab('npcs')}>
            <UserRound size={14} /> NPCs <span>{npcs.length}</span>
          </button>
          <button type="button" className={tab === 'ameacas' ? 'is-active' : ''} onClick={() => setTab('ameacas')}>
            <Sparkles size={14} /> Ameaças <span>{adversarios.length}</span>
          </button>
        </nav>
      )}

      <div className="live-vtt__actor-list">
        {tab === 'personagens' && (
          <>
            {personagens.length === 0 && <p className="live-vtt__drawer-empty">Nenhum Desvelado vinculado a esta campanha.</p>}
            {personagens.map(personagem => (
              <article
                key={personagem.id}
                className={`live-vtt__actor-card ${selecionadoId === personagem.id ? 'is-selected' : ''}`}
                draggable={mestre}
                onDragStart={event => startDrag(event, { kind: 'personagem', id: personagem.id, name: personagem.nome, imageUrl: personagem.imagemUrl })}
              >
                <button type="button" className="live-vtt__actor-main" onClick={() => onSelecionar(personagem.id)}>
                  <Portrait image={personagem.imagemUrl} name={personagem.nome} />
                  <span>
                    <strong>{personagem.nome}</strong>
                    <small>{personagem.conceito} · Nível {personagem.nivel}</small>
                  </span>
                  <span className="live-vtt__actor-open" onClick={(event) => { event.stopPropagation(); onAbrirFicha(personagem); }}>Ficha</span>
                </button>

                <div className="live-vtt__actor-resources">
                  <span><Heart size={12} /> <b>{personagem.vidaAtual}</b>/{personagem.vidaMaxima}</span>
                  <span><Sparkles size={12} /> <b>{personagem.focoAtual}</b>/{personagem.focoMaximo}</span>
                  <span className={personagem.ruptura >= 4 ? 'is-danger' : ''}><Shield size={12} /> <b>{personagem.ruptura}</b>/6</span>
                </div>

                {mestre && (
                  <div className="live-vtt__actor-actions">
                    <button type="button" onClick={() => onAjustar(personagem, 'vidaAtual', -1)}>− Vida</button>
                    <button type="button" onClick={() => onAjustar(personagem, 'vidaAtual', 1)}>+ Vida</button>
                    <button type="button" onClick={() => onRuptura(personagem)}>+ Ruptura</button>
                  </div>
                )}
              </article>
            ))}
          </>
        )}

        {mestre && tab === 'npcs' && (
          <>
            {npcs.length === 0 && <p className="live-vtt__drawer-empty">Nenhum NPC preparado para esta campanha.</p>}
            {npcs.map(npc => {
              const copies = tokens.filter(t=>t.tipo==='npc'&&t.npcId===npc.id);
              return (
              <article key={npc.id} className="live-vtt__actor-card" draggable
                onDragStart={event => startDrag(event,{kind:'npc',id:npc.id,name:npc.nome,imageUrl:npc.imagemUrl})}>
                <div className="live-vtt__actor-main is-static">
                  <Portrait image={npc.imagemUrl} name={npc.nome}/>
                  <span><strong>{npc.nome}</strong><small>Modelo de NPC · {copies.length} cópias no mapa</small></span>
                </div>
                <div className="live-vtt__actor-resources">
                  <span>PV modelo: <b>{npc.vida ?? 0}</b>/{npc.vidaMaxima ?? npc.vida ?? 1}</span>
                </div>
                {copies.length === 0 && <p className="live-vtt__actor-instance-empty">Arraste o modelo para o mapa ou use “Biblioteca e criação rápida” para criar várias cópias.</p>}
                {copies.map(token=>{
                  const hp = resolvedTokenHp(token,npc.vida,npc.vidaMaxima);
                  return <div key={token.id} className="live-vtt__actor-instance">
                    <strong>{token.nome}</strong>
                    <span className="live-vtt__actor-instance-location">Cópia independente · PV {hp.current}/{hp.max}</span>
                    <ActorCombatControls key={token.id} name={token.nome} hp={hp.current} maxHp={hp.max}
                      threatLevel={npc.nivelAmeaca ?? 0} abilities={npc.habilidades || []}
                      onHpChange={value=>onTokenHpChange(token.id,value,hp.max)}
                      onRoll={(content,details)=>onActorRoll(content,{...details,tokenId:token.id})}/>
                  </div>;
                })}
              </article>
            )})}
          </>
        )}

        {mestre && tab === 'ameacas' && (
          <>
            {adversarios.length === 0 && <p className="live-vtt__drawer-empty">Nenhuma ameaça preparada para esta campanha.</p>}
            {adversarios.map(adversario => {
              const copies=tokens.filter(t=>t.tipo==='adversario'&&t.adversaryId===adversario.id);
              return <article key={adversario.id} className="live-vtt__actor-card is-threat" draggable
                onDragStart={event=>startDrag(event,{kind:'adversario',id:adversario.id,name:adversario.nome,imageUrl:adversario.imagemUrl})}>
                <div className="live-vtt__actor-main is-static">
                  <Portrait image={adversario.imagemUrl} name={adversario.nome}/>
                  <span><strong>{adversario.nome}</strong><small>{adversario.tipo} · Nível {adversario.nivel} · {copies.length} cópias</small></span>
                </div>
                <div className="live-vtt__actor-resources">
                  <span>PV modelo: <b>{adversario.vida}</b>/{adversario.vidaMaxima}</span>
                  <span>Defesa <b>{adversario.defesa}</b></span>
                  <span>DT <b>{adversario.dificuldade ?? adversario.defesa}</b></span>
                </div>
                {copies.length === 0 && <p className="live-vtt__actor-instance-empty">Arraste o modelo para o mapa ou adicione várias cópias pela biblioteca.</p>}
                {copies.map(token=>{
                  const hp=resolvedTokenHp(token,adversario.vida,adversario.vidaMaxima);
                  return <div key={token.id} className="live-vtt__actor-instance">
                    <strong>{token.nome}</strong>
                    <span className="live-vtt__actor-instance-location">Cópia independente · PV {hp.current}/{hp.max}</span>
                    <ActorCombatControls key={token.id} name={token.nome} hp={hp.current} maxHp={hp.max}
                      threatLevel={adversario.nivel} abilities={adversario.habilidades||[]}
                      onHpChange={value=>onTokenHpChange(token.id,value,hp.max)}
                      onRoll={(content,details)=>onActorRoll(content,{...details,tokenId:token.id})}/>
                  </div>;
                })}
              </article>;
            })}
          </>
        )}
      </div>
    </section>
  );
};
