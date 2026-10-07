import React, { useMemo, useState } from 'react';
import { Check, FileText, Image as ImageIcon, Layers3, Map as MapIcon, Play, ScrollText, X } from 'lucide-react';
import { Cena, Handout, MapaNarrativo, Pista, Sessao } from '../../types/campaign';
import { AssetImage } from '../system/AssetImage';
import { campaignAssetService } from '../../services/storage/campaignAssetService';

type Tab = 'cenas' | 'mapas' | 'revelacoes';

interface LiveDirectorPanelProps {
  sessao?: Sessao;
  cenas: Cena[];
  mapas: MapaNarrativo[];
  pistas: Pista[];
  handouts: Handout[];
  activeSceneId?: string;
  activeMapId?: string;
  onActivateScene: (scene: Cena) => void | Promise<void>;
  onActivateMap: (map: MapaNarrativo) => void | Promise<void>;
  onPresentClue: (clue: Pista) => void | Promise<void>;
  onPresentHandout: (handout: Handout) => void | Promise<void>;
  onClose: () => void;
}

const mapVisual = (mapa: MapaNarrativo) =>
  mapa.imagemUrl || (mapa.storagePath ? campaignAssetService.toStorageRef(mapa.storagePath) : '');

export const LiveDirectorPanel: React.FC<LiveDirectorPanelProps> = ({
  sessao,
  cenas,
  mapas,
  pistas,
  handouts,
  activeSceneId,
  activeMapId,
  onActivateScene,
  onActivateMap,
  onPresentClue,
  onPresentHandout,
  onClose
}) => {
  const [tab, setTab] = useState<Tab>('cenas');

  const linkedScenes = useMemo(() => new Set(sessao?.cenaIds || []), [sessao?.cenaIds]);
  const linkedMaps = useMemo(() => new Set(sessao?.mapaIds || []), [sessao?.mapaIds]);
  const linkedClues = useMemo(() => new Set(sessao?.pistaIds || []), [sessao?.pistaIds]);
  const linkedHandouts = useMemo(() => new Set(sessao?.handoutIds || []), [sessao?.handoutIds]);

  const orderedScenes = useMemo(
    () => [...cenas].sort((a, b) => Number(linkedScenes.has(b.id)) - Number(linkedScenes.has(a.id))),
    [cenas, linkedScenes]
  );
  const orderedMaps = useMemo(
    () => [...mapas].sort((a, b) => Number(linkedMaps.has(b.id)) - Number(linkedMaps.has(a.id))),
    [mapas, linkedMaps]
  );

  return (
    <section className="live-vtt__director">
      <header className="live-vtt__drawer-head">
        <div>
          <span>Direção da sessão</span>
          <strong>{sessao?.titulo || 'Mesa em andamento'}</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar direção"><X size={16} /></button>
      </header>

      <nav className="live-vtt__director-tabs" aria-label="Recursos da sessão">
        <button type="button" className={tab === 'cenas' ? 'is-active' : ''} onClick={() => setTab('cenas')}>
          <Layers3 size={14} /> Cenas <span>{cenas.length}</span>
        </button>
        <button type="button" className={tab === 'mapas' ? 'is-active' : ''} onClick={() => setTab('mapas')}>
          <MapIcon size={14} /> Mapas <span>{mapas.length}</span>
        </button>
        <button type="button" className={tab === 'revelacoes' ? 'is-active' : ''} onClick={() => setTab('revelacoes')}>
          <ScrollText size={14} /> Revelações <span>{pistas.length + handouts.length}</span>
        </button>
      </nav>

      <div className="live-vtt__director-body">
        {tab === 'cenas' && (
          <div className="live-vtt__director-list">
            {orderedScenes.map((scene, index) => {
              const linked = linkedScenes.has(scene.id);
              const active = activeSceneId === scene.id;
              return (
                <article key={scene.id} className={`live-vtt__director-card ${active ? 'is-active' : ''}`}>
                  <div className="live-vtt__director-media">
                    {scene.imagemUrl ? <AssetImage src={scene.imagemUrl} alt="" /> : <Layers3 size={20} />}
                  </div>
                  <div className="live-vtt__director-copy">
                    <small>{linked ? `Sessão · cena ${index + 1}` : 'Arquivo da campanha'}</small>
                    <strong>{scene.titulo}</strong>
                    <p>{scene.descricao || 'Sem descrição preparada.'}</p>
                    <div>
                      <span>{scene.tipoDeConteudo}</span>
                      {linked && <span className="is-linked"><Check size={11} /> vinculada</span>}
                    </div>
                  </div>
                  <button type="button" className="live-vtt__director-play" onClick={() => void onActivateScene(scene)}>
                    <Play size={14} /> {active ? 'Ativa' : 'Usar'}
                  </button>
                </article>
              );
            })}
            {cenas.length === 0 && <p className="live-vtt__drawer-empty">Nenhuma cena criada na campanha. Crie cenas no Estúdio de Sessão.</p>}
          </div>
        )}

        {tab === 'mapas' && (
          <div className="live-vtt__director-list">
            {orderedMaps.map((mapa, index) => {
              const linked = linkedMaps.has(mapa.id);
              const active = activeMapId === mapa.id;
              return (
                <article key={mapa.id} className={`live-vtt__director-card ${active ? 'is-active' : ''}`}>
                  <div className="live-vtt__director-media">
                    {mapVisual(mapa) ? <AssetImage src={mapVisual(mapa)} alt="" /> : <MapIcon size={20} />}
                  </div>
                  <div className="live-vtt__director-copy">
                    <small>{linked ? `Sessão · mapa ${index + 1}` : 'Biblioteca da campanha'}</small>
                    <strong>{mapa.titulo}</strong>
                    <p>{mapa.gradeVisivel ? 'Grade ativa' : 'Mapa narrativo'} · {mapa.visibilidade === 'mestre_privado' ? 'privado' : 'revelável'}</p>
                    {linked && <div><span className="is-linked"><Check size={11} /> vinculado</span></div>}
                  </div>
                  <button type="button" className="live-vtt__director-play" onClick={() => void onActivateMap(mapa)}>
                    <Play size={14} /> {active ? 'Ativo' : 'Abrir'}
                  </button>
                </article>
              );
            })}
            {mapas.length === 0 && <p className="live-vtt__drawer-empty">Nenhum mapa criado. A biblioteca de mapas da campanha está vazia.</p>}
          </div>
        )}

        {tab === 'revelacoes' && (
          <div className="live-vtt__director-list">
            {pistas.map(pista => (
              <article key={pista.id} className="live-vtt__director-card">
                <div className="live-vtt__director-media">
                  {pista.imagemUrl ? <AssetImage src={pista.imagemUrl} alt="" /> : <ImageIcon size={20} />}
                </div>
                <div className="live-vtt__director-copy">
                  <small>{linkedClues.has(pista.id) ? 'Pista desta sessão' : 'Pista da campanha'}</small>
                  <strong>{pista.titulo}</strong>
                  <p>{pista.descricao}</p>
                  <div><span>{pista.tipo}</span>{linkedClues.has(pista.id) && <span className="is-linked"><Check size={11} /> vinculada</span>}</div>
                </div>
                <button type="button" className="live-vtt__director-play" onClick={() => void onPresentClue(pista)}>
                  <Play size={14} /> Revelar
                </button>
              </article>
            ))}

            {handouts.map(handout => (
              <article key={handout.id} className="live-vtt__director-card">
                <div className="live-vtt__director-media"><FileText size={20} /></div>
                <div className="live-vtt__director-copy">
                  <small>{linkedHandouts.has(handout.id) ? 'Handout desta sessão' : 'Handout da campanha'}</small>
                  <strong>{handout.titulo}</strong>
                  <p>{handout.descricao || 'Arquivo preparado para apresentação.'}</p>
                  {linkedHandouts.has(handout.id) && <div><span className="is-linked"><Check size={11} /> vinculado</span></div>}
                </div>
                <button type="button" className="live-vtt__director-play" onClick={() => void onPresentHandout(handout)}>
                  <Play size={14} /> Apresentar
                </button>
              </article>
            ))}

            {pistas.length === 0 && handouts.length === 0 && (
              <p className="live-vtt__drawer-empty">Nenhuma pista ou handout preparado na campanha.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
