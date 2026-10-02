import React from 'react';
import { Campanha, ConteudoDeCena, MapaNarrativo, TokenMapa } from '../../types/campaign';
import { MapStage } from './MapStage';
import { NewSessionEvent } from '../../types/sessionEvent';

interface SceneStageProps {
  campanha: Campanha;
  mestre: boolean;
  conteudo: ConteudoDeCena;
  title?: string;
  description?: string;
  onAtualizarTexto?: (title: string, description: string) => void;
  onMudarConteudo: (conteudo: ConteudoDeCena) => void;
  mapas: MapaNarrativo[];
  tokensMapa: TokenMapa[];
  mapaAtualId?: string;
  onSelecionarMapa: (id: string) => void;
  onAdicionarMapa: React.ComponentProps<typeof MapStage>['onAdicionarMapa'];
  onAtualizarMapa: React.ComponentProps<typeof MapStage>['onAtualizarMapa'];
  onRemoverMapa: React.ComponentProps<typeof MapStage>['onRemoverMapa'];
  onAdicionarToken: React.ComponentProps<typeof MapStage>['onAdicionarToken'];
  onAtualizarToken: React.ComponentProps<typeof MapStage>['onAtualizarToken'];
  onRemoverToken: React.ComponentProps<typeof MapStage>['onRemoverToken'];
  onRegistrarEvento?: (event: NewSessionEvent) => void;
}

const copy: Record<Exclude<ConteudoDeCena, 'mapa'>, { title: string; hint: string }> = {
  ambientacao: { title: 'A cidade contém a respiração', hint: 'Ambientação da cena. O Mestre pode preparar imagem, mapa ou handout para esta área.' },
  imagem: { title: 'A imagem da cena', hint: 'Imagem narrativa pronta para a projeção da mesa.' },
  handout: { title: 'Documento encontrado', hint: 'Handout revelado à mesa quando o Mestre decidir.' }
};

export const SceneStage: React.FC<SceneStageProps> = (props) => {
  const { campanha, mestre, conteudo, title, description, onAtualizarTexto, onMudarConteudo, mapas, tokensMapa, mapaAtualId, onSelecionarMapa, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, onAdicionarToken, onAtualizarToken, onRemoverToken, onRegistrarEvento } = props;
  const [editing, setEditing] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(title || '');
  const [draftDescription, setDraftDescription] = React.useState(description || '');
  React.useEffect(() => { if (!editing) { setDraftTitle(title || ''); setDraftDescription(description || ''); } }, [description, editing, title]);
  const mudarConteudo = (proximo: ConteudoDeCena) => { onMudarConteudo(proximo); if (proximo !== conteudo) onRegistrarEvento?.({ type: 'scene_change', content: `A cena mudou para ${proximo}.`, metadata: { conteudo: proximo } }); };
  if (conteudo === 'mapa') return <MapStage campanhaId={campanha.id} mapas={mapas} tokens={tokensMapa} mestre={mestre} mapaAtualId={mapaAtualId} onSelecionarMapa={onSelecionarMapa} onAdicionarMapa={onAdicionarMapa} onAtualizarMapa={onAtualizarMapa} onRemoverMapa={onRemoverMapa} onAdicionarToken={onAdicionarToken} onAtualizarToken={onAtualizarToken} onRemoverToken={onRemoverToken} />;
  const texto = copy[conteudo];
  const sceneTitle = title?.trim() || texto.title;
  const sceneDescription = description?.trim() || texto.hint;
  const salvarTexto = () => {
    onAtualizarTexto?.(draftTitle.trim() || texto.title, draftDescription.trim() || texto.hint);
    setEditing(false);
  };
  return <main className={`live-table__stage live-table__stage--${conteudo}`}>
    <div className="live-table__geometry" />
    {conteudo === 'imagem' && <img src={campanha.imagemUrl} alt="Cena atual" />}
    <div className="live-table__stage-copy">
      <p className="ro-eyebrow">Cena atual</p>
      {editing ? <div className="live-table__scene-editor">
        <input value={draftTitle} onChange={event => setDraftTitle(event.target.value)} placeholder="Título da cena" />
        <textarea value={draftDescription} onChange={event => setDraftDescription(event.target.value)} rows={3} placeholder="Descrição / ambientação" />
        <div><button className="ro-button--quiet" type="button" onClick={() => setEditing(false)}>Cancelar</button><button className="ro-button" type="button" onClick={salvarTexto}>Aplicar cena</button></div>
      </div> : <>
        <h2>{sceneTitle}</h2>
        <p>{sceneDescription}</p>
        {mestre && <button type="button" className="live-table__edit-scene" onClick={() => setEditing(true)}>Editar cena</button>}
      </>}
    </div>
    {mestre && <div className="live-table__scene-controls"><span>Conteúdo da cena</span>{(['ambientacao', 'imagem', 'mapa', 'handout'] as ConteudoDeCena[]).map(tipo => <button key={tipo} onClick={() => mudarConteudo(tipo)} className={conteudo === tipo ? 'is-active' : ''}>{tipo}</button>)}</div>}
  </main>;
};
