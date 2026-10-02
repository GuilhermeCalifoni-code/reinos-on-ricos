import React, { useEffect, useMemo, useState } from 'react';
import { Campanha, Cena, ConteudoDeCena, MapaNarrativo, TokenMapa, VisibilidadeConteudo } from '../../types/campaign';
import { MapStage } from './MapStage';
import { NewSessionEvent } from '../../types/sessionEvent';

interface SceneStageProps {
  campanha: Campanha;
  mestre: boolean;
  conteudo: ConteudoDeCena;
  onMudarConteudo: (conteudo: ConteudoDeCena) => void;
  cenas: Cena[];
  cenaAtualId?: string;
  onSelecionarCena: (id: string) => void;
  onAdicionarCena: (cena: Omit<Cena, 'id'>) => Promise<unknown> | unknown;
  onAtualizarCena: (id: string, patch: Partial<Cena>) => Promise<unknown> | unknown;
  onRemoverCena: (id: string) => Promise<unknown> | unknown;
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

const fallbackCopy: Record<Exclude<ConteudoDeCena, 'mapa'>, { title: string; hint: string }> = {
  ambientacao: { title: 'A cidade contém a respiração', hint: 'Defina uma cena para transformar este espaço na situação atual da mesa.' },
  imagem: { title: 'A imagem da cena', hint: 'Selecione uma cena com uma referência visual ou edite a cena atual.' },
  handout: { title: 'Documento encontrado', hint: 'Use uma cena ou Arquivo da campanha para conduzir esta revelação.' }
};

export const SceneStage: React.FC<SceneStageProps> = (props) => {
  const {
    campanha, mestre, conteudo, onMudarConteudo, cenas, cenaAtualId, onSelecionarCena,
    onAdicionarCena, onAtualizarCena, onRemoverCena,
    mapas, tokensMapa, mapaAtualId, onSelecionarMapa, onAdicionarMapa, onAtualizarMapa,
    onRemoverMapa, onAdicionarToken, onAtualizarToken, onRemoverToken, onRegistrarEvento
  } = props;

  const cenaAtual = useMemo(() => cenas.find(item => item.id === cenaAtualId), [cenaAtualId, cenas]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<ConteudoDeCena>('ambientacao');
  const [visibilidade, setVisibilidade] = useState<VisibilidadeConteudo>('mestre_privado');
  const [imagemUrl, setImagemUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const syncForm = (scene?: Cena) => {
    setTitulo(scene?.titulo || '');
    setDescricao(scene?.descricao || '');
    setTipo(scene?.tipoDeConteudo || 'ambientacao');
    setVisibilidade(scene?.visibilidade || 'mestre_privado');
    setImagemUrl(scene?.imagemUrl || '');
  };

  useEffect(() => {
    if (!editorOpen || creating) return;
    syncForm(cenaAtual);
  }, [cenaAtual, creating, editorOpen]);

  const openCreate = () => {
    setCreating(true); syncForm(undefined); setEditorOpen(true); setError('');
  };
  const openEdit = () => {
    if (!cenaAtual) return openCreate();
    setCreating(false); syncForm(cenaAtual); setEditorOpen(true); setError('');
  };

  const mudarConteudo = (proximo: ConteudoDeCena) => {
    onMudarConteudo(proximo);
    if (proximo !== conteudo) onRegistrarEvento?.({
      type: 'scene_change',
      content: `A cena mudou para ${proximo}.`,
      metadata: { conteudo: proximo, sceneId: cenaAtual?.id }
    });
  };

  const saveScene = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true); setError('');
    try {
      if (creating || !cenaAtual) {
        await onAdicionarCena({
          campanhaId: campanha.id,
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          visibilidade,
          tipoDeConteudo: tipo,
          imagemUrl: imagemUrl.trim() || undefined
        });
      } else {
        await onAtualizarCena(cenaAtual.id, {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          visibilidade,
          tipoDeConteudo: tipo,
          imagemUrl: imagemUrl.trim() || undefined
        });
        onMudarConteudo(tipo);
      }
      setEditorOpen(false);
    } catch (cause: any) {
      setError(cause.message || 'Não foi possível salvar a cena.');
    } finally { setSaving(false); }
  };

  const deleteScene = async () => {
    if (!cenaAtual || !window.confirm(`Excluir a cena "${cenaAtual.titulo}"?`)) return;
    try {
      await onRemoverCena(cenaAtual.id);
      onSelecionarCena('');
    } catch (cause: any) {
      setError(cause.message || 'Não foi possível excluir a cena.');
    }
  };

  const director = mestre ? (
    <div className="scene-director">
      <div className="scene-director__select">
        <span>Cena atual</span>
        <select value={cenaAtualId || ''} onChange={event => onSelecionarCena(event.target.value)}>
          <option value="">Cena livre</option>
          {cenas.map(scene => <option key={scene.id} value={scene.id}>{scene.titulo}</option>)}
        </select>
      </div>
      <div className="scene-director__actions">
        <button type="button" onClick={openCreate}>+ Cena</button>
        <button type="button" onClick={openEdit}>{cenaAtual ? 'Editar' : 'Definir área'}</button>
        {cenaAtual && <button type="button" className="is-danger" onClick={() => void deleteScene()}>Excluir</button>}
      </div>
      <div className="scene-director__modes" aria-label="Conteúdo exibido">
        {(['ambientacao', 'imagem', 'mapa', 'handout'] as ConteudoDeCena[]).map(value => (
          <button key={value} type="button" onClick={() => mudarConteudo(value)} className={conteudo === value ? 'is-active' : ''}>{value}</button>
        ))}
      </div>
    </div>
  ) : null;

  const editor = editorOpen ? (
    <div className="scene-editor">
      <form onSubmit={saveScene}>
        <header><div><p className="ro-eyebrow">{creating ? 'Nova cena' : 'Editar cena'}</p><h3>{creating ? 'Definir uma nova área' : cenaAtual?.titulo}</h3></div><button type="button" onClick={() => setEditorOpen(false)}>×</button></header>
        <label><span>Título</span><input autoFocus required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Sala de arquivos" /></label>
        <label><span>Descrição / ambientação</span><textarea rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="O que os personagens percebem aqui?" /></label>
        <div className="scene-editor__row">
          <label><span>Conteúdo</span><select value={tipo} onChange={e => setTipo(e.target.value as ConteudoDeCena)}><option value="ambientacao">Ambientação</option><option value="imagem">Imagem</option><option value="mapa">Mapa</option><option value="handout">Handout</option></select></label>
          <label><span>Visibilidade</span><select value={visibilidade} onChange={e => setVisibilidade(e.target.value as VisibilidadeConteudo)}><option value="mestre_privado">Mestre privado</option><option value="compartilhado">Compartilhado</option><option value="revelado_jogadores">Revelado</option></select></label>
        </div>
        <label><span>URL de imagem opcional</span><input value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} placeholder="https://..." /></label>
        {error && <p className="scene-editor__error">{error}</p>}
        <footer><button type="button" className="ro-button--quiet" onClick={() => setEditorOpen(false)}>Cancelar</button><button className="ro-button" disabled={saving}>{saving ? 'Salvando…' : 'Salvar cena'}</button></footer>
      </form>
    </div>
  ) : null;

  if (conteudo === 'mapa') {
    return <main className="scene-stage-shell">
      {director}
      <div className="scene-stage-shell__content">
        <MapStage campanhaId={campanha.id} mapas={mapas} tokens={tokensMapa} mestre={mestre} mapaAtualId={mapaAtualId} onSelecionarMapa={onSelecionarMapa} onAdicionarMapa={onAdicionarMapa} onAtualizarMapa={onAtualizarMapa} onRemoverMapa={onRemoverMapa} onAdicionarToken={onAdicionarToken} onAtualizarToken={onAtualizarToken} onRemoverToken={onRemoverToken} />
      </div>
      {editor}
    </main>;
  }

  const texto = cenaAtual
    ? { title: cenaAtual.titulo, hint: cenaAtual.descricao || fallbackCopy[conteudo].hint }
    : fallbackCopy[conteudo];
  const sceneImage = cenaAtual?.imagemUrl || (conteudo === 'imagem' ? campanha.imagemUrl : undefined);

  return <main className={`scene-stage-shell live-table__stage live-table__stage--${conteudo}`}>
    {sceneImage && <img src={sceneImage} alt={cenaAtual?.titulo || 'Cena atual'} onError={event => { event.currentTarget.style.display = 'none'; }} />}
    <div className="live-table__geometry" />
    <div className="live-table__stage-copy">
      <p className="ro-eyebrow">Cena atual</p>
      <h2>{texto.title}</h2>
      <p>{texto.hint}</p>
      {cenaAtual && <small className="scene-stage__visibility">{cenaAtual.visibilidade === 'mestre_privado' ? 'Somente Mestre' : cenaAtual.visibilidade === 'compartilhado' ? 'Compartilhada' : 'Revelada'}</small>}
    </div>
    {director}
    {editor}
  </main>;
};
