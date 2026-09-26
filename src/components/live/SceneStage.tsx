import React from 'react';
import { Campanha, ConteudoDeCena, MapaNarrativo, TokenMapa } from '../../types/campaign';
import { MapStage } from './MapStage';
import { NewSessionEvent } from '../../types/sessionEvent';

interface SceneStageProps {
  campanha: Campanha;
  mestre: boolean;
  conteudo: ConteudoDeCena;
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
  const { campanha, mestre, conteudo, onMudarConteudo, mapas, tokensMapa, mapaAtualId, onSelecionarMapa, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, onAdicionarToken, onAtualizarToken, onRemoverToken, onRegistrarEvento } = props;
  const mudarConteudo = (proximo: ConteudoDeCena) => { onMudarConteudo(proximo); if (proximo !== conteudo) onRegistrarEvento?.({ type: 'scene_change', content: `A cena mudou para ${proximo}.`, metadata: { conteudo: proximo } }); };
  if (conteudo === 'mapa') return <MapStage campanhaId={campanha.id} mapas={mapas} tokens={tokensMapa} mestre={mestre} mapaAtualId={mapaAtualId} onSelecionarMapa={onSelecionarMapa} onAdicionarMapa={onAdicionarMapa} onAtualizarMapa={onAtualizarMapa} onRemoverMapa={onRemoverMapa} onAdicionarToken={onAdicionarToken} onAtualizarToken={onAtualizarToken} onRemoverToken={onRemoverToken} />;
  const texto = copy[conteudo];
  return <main className={`live-table__stage live-table__stage--${conteudo}`}>
    <div className="live-table__geometry" />
    {conteudo === 'imagem' && <img src={campanha.imagemUrl} alt="Cena atual" />}
    <div className="live-table__stage-copy"><p className="ro-eyebrow">Cena atual</p><h2>{texto.title}</h2><p>{texto.hint}</p></div>
    {mestre && <div className="live-table__scene-controls"><span>Conteúdo da cena</span>{(['ambientacao', 'imagem', 'mapa', 'handout'] as ConteudoDeCena[]).map(tipo => <button key={tipo} onClick={() => mudarConteudo(tipo)} className={conteudo === tipo ? 'is-active' : ''}>{tipo}</button>)}</div>}
  </main>;
};
