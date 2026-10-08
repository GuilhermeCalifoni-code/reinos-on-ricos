import React, { useState } from 'react';
import { Heart, Shield, Sparkles, UserRound, Users, X } from 'lucide-react';
import { Personagem } from '../../types/character';
import { Adversario, NPC } from '../../types/campaign';
import { AssetImage } from '../system/AssetImage';
import { ActorCombatControls } from './ActorCombatControls';

type ActorsTab = 'personagens' | 'npcs' | 'ameacas';

interface LiveActorsPanelProps {
  personagens: Personagem[];
  npcs: NPC[];
  adversarios: Adversario[];
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
  selecionadoId,
  mestre,
  onSelecionar,
  onAbrirFicha,
  onAjustar,
  onRuptura,
  onUpdateNpc,
  onUpdateAdversary,
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
            {npcs.map(npc => (
              <article
                key={npc.id}
                className="live-vtt__actor-card"
                draggable
                onDragStart={event => startDrag(event, { kind: 'npc', id: npc.id, name: npc.nome, imageUrl: npc.imagemUrl })}
              >
                <div className="live-vtt__actor-main is-static">
                  <Portrait image={npc.imagemUrl} name={npc.nome} />
                  <span>
                    <strong>{npc.nome}</strong>
                    <small>{npc.isDesvelado ? 'Desvelado' : (npc.papel || npc.conceito || 'NPC')} · {npc.atitude}</small>
                  </span>
                </div>
                <div className="live-vtt__actor-resources">
                  <span><Heart size={12} /> <b>{npc.vida ?? '—'}</b>/{npc.vidaMaxima ?? npc.vida ?? '—'}</span>
                  {npc.isDesvelado && <span><Sparkles size={12} /> <b>{npc.foco ?? 0}</b>/{npc.focoMaximo ?? 0}</span>}
                  {npc.isDesvelado && <span className={(npc.ruptura ?? 0) >= 4 ? 'is-danger' : ''}><Shield size={12} /> <b>{npc.ruptura ?? 0}</b>/6</span>}
                  <span><Shield size={12} /> {npc.isDesvelado ? 'Def' : 'DT'} <b>{npc.isDesvelado ? (npc.defesa ?? npc.dificuldade ?? '—') : (npc.dificuldade ?? '—')}</b></span>
                </div>
                <ActorCombatControls
                  key={npc.id} name={npc.nome} hp={npc.vida ?? 0} maxHp={npc.vidaMaxima ?? npc.vida ?? 1}
                  threatLevel={npc.nivelAmeaca ?? 0} abilities={npc.habilidades || []}
                  onHpChange={hp => onUpdateNpc(npc.id,hp)} onRoll={onActorRoll}
                />
              </article>
            ))}
          </>
        )}

        {mestre && tab === 'ameacas' && (
          <>
            {adversarios.length === 0 && <p className="live-vtt__drawer-empty">Nenhuma ameaça preparada para esta campanha.</p>}
            {adversarios.map(adversario => (
              <article
                key={adversario.id}
                className="live-vtt__actor-card is-threat"
                draggable
                onDragStart={event => startDrag(event, { kind: 'adversario', id: adversario.id, name: adversario.nome, imageUrl: adversario.imagemUrl })}
              >
                <div className="live-vtt__actor-main is-static">
                  <Portrait image={adversario.imagemUrl} name={adversario.nome} />
                  <span>
                    <strong>{adversario.nome}</strong>
                    <small>{adversario.tipo} · Nível {adversario.nivel}</small>
                  </span>
                </div>
                <div className="live-vtt__actor-resources">
                  <span><Heart size={12} /> <b>{adversario.vida}</b>/{adversario.vidaMaxima}</span>
                  <span><Shield size={12} /> Defesa <b>{adversario.defesa}</b></span>
                  <span>DT <b>{adversario.dificuldade ?? adversario.defesa}</b></span>
                </div>
                <ActorCombatControls
                  key={adversario.id} name={adversario.nome} hp={adversario.vida} maxHp={adversario.vidaMaxima}
                  threatLevel={adversario.nivel} abilities={adversario.habilidades || []}
                  onHpChange={hp => onUpdateAdversary(adversario.id,hp)} onRoll={onActorRoll}
                />
              </article>
            ))}
          </>
        )}
      </div>
    </section>
  );
};
