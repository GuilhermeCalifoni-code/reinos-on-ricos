import React, { useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { Local, Pista, Sessao, VisibilidadeConteudo } from '../../types/campaign';
import { AssetImage } from '../system/AssetImage';
import { campaignAssetService } from '../../services/storage/campaignAssetService';
import { SessionResourceLinks } from './SessionResourceLinks';

interface Props {
  mode: 'locais' | 'pistas';
  campaignId: string;
  locations: Local[];
  clues: Pista[];
  sessions: Sessao[];
  canManage: boolean;
  onUpdateSession: (id: string, patch: Partial<Sessao>) => Promise<unknown> | unknown;
  onAddLocation: (item: Omit<Local, 'id'>) => Promise<unknown> | unknown;
  onUpdateLocation: (id: string, patch: Partial<Local>) => Promise<unknown> | unknown;
  onRemoveLocation: (id: string) => Promise<unknown> | unknown;
  onAddClue: (item: Omit<Pista, 'id'>) => Promise<unknown> | unknown;
  onUpdateClue: (id: string, patch: Partial<Pista>) => Promise<unknown> | unknown;
  onRemoveClue: (id: string) => Promise<unknown> | unknown;
}

const readLocal = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(file);
});

export const CampaignCluesLocationsPanel: React.FC<Props> = ({
  mode, campaignId, locations, clues, sessions, canManage, onUpdateSession,
  onAddLocation, onUpdateLocation, onRemoveLocation, onAddClue, onUpdateClue, onRemoveClue
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [extra, setExtra] = useState('');
  const [kind, setKind] = useState('documento');
  const [status, setStatus] = useState<Pista['status']>('descoberta');
  const [visibility, setVisibility] = useState<VisibilidadeConteudo>('mestre_privado');
  const [imageUrl, setImageUrl] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isClue = mode === 'pistas';
  const items = isClue ? clues : locations;
  const current = items.find(item => item.id === editingId);
  const displayImage = file ? URL.createObjectURL(file) : removeImage ? '' : imageUrl || current?.imagemUrl || '';
  React.useEffect(() => {
    if (!file) return;
    // A prévia é temporária; liberar a URL ao escolher outra imagem ou fechar.
    return () => { /* a URL é revogada em efeito dedicado abaixo */ };
  }, [file]);

  const close = () => { setEditorOpen(false); setEditingId(null); setFile(null); setError(''); };
  const open = (item?: Local | Pista) => {
    setEditingId(item?.id || null);
    setName(item ? ('nome' in item ? item.nome : item.titulo) : '');
    setDescription(item?.descricao || '');
    setExtra(item && 'anomaliaDetectada' in item ? item.anomaliaDetectada || '' : '');
    setKind(item?.tipo || (isClue ? 'documento' : 'urbano'));
    setStatus(item && 'status' in item ? item.status : 'descoberta');
    setVisibility(item?.visibilidade || 'mestre_privado');
    setImageUrl('');
    setRemoveImage(false);
    setFile(null);
    setError('');
    setEditorOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    if (file && (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024)) {
      setError('Use uma imagem de até 15 MB.'); return;
    }
    setBusy(true); setError('');
    try {
      let nextImage: string | undefined;
      const replaceImage = Boolean(file || imageUrl.trim() || removeImage);
      if (file) {
        nextImage = campaignAssetService.isRemoteCampaignId(campaignId)
          ? campaignAssetService.toStorageRef(await campaignAssetService.uploadSceneImage(campaignId, file))
          : await readLocal(file);
      } else if (removeImage) nextImage = '';
      else if (imageUrl.trim()) nextImage = imageUrl.trim();
      if (isClue) {
        const patch: Partial<Pista> = {
          titulo: name.trim(), descricao: description.trim(), tipo: kind as Pista['tipo'],
          status, visibilidade: visibility,
          ...(replaceImage ? { imagemUrl: nextImage } : {})
        };
        if (editingId) await onUpdateClue(editingId, patch);
        else await onAddClue({ campanhaId: campaignId, ...patch } as Omit<Pista, 'id'>);
      } else {
        const patch: Partial<Local> = {
          nome: name.trim(), descricao: description.trim(), tipo: kind as Local['tipo'],
          anomaliaDetectada: extra.trim(), visibilidade: visibility,
          ...(replaceImage ? { imagemUrl: nextImage } : {})
        };
        if (editingId) await onUpdateLocation(editingId, patch);
        else await onAddLocation({ campanhaId: campaignId, ...patch } as Omit<Local, 'id'>);
      }
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally { setBusy(false); }
  };
  const remove = async (item: Local | Pista) => {
    const label = 'nome' in item ? item.nome : item.titulo;
    if (!window.confirm(`Excluir "${label}"? O registro deixará de existir nas sessões.`)) return;
    setBusy(true); setError('');
    try { if (isClue) await onRemoveClue(item.id); else await onRemoveLocation(item.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível excluir.'); }
    finally { setBusy(false); }
  };
  return (
    <section className="campaign-resource-manager">
      <header className="campaign-assets__head">
        <div><p className="ro-eyebrow">Arquivo da campanha</p>
          <h2>{isClue ? 'Pistas & Evidências' : 'Locais & Fronteiras'}</h2>
          <p>Edite registros e associe cada um a uma ou mais sessões.</p>
        </div>
        {canManage && <button type="button" className="ro-button" onClick={() => open()}><Plus size={14}/>{isClue ? 'Nova pista' : 'Novo local'}</button>}
      </header>
      <div className="campaign-assets__grid">
        {items.map(item => {
          const title = 'nome' in item ? item.nome : item.titulo;
          const field = isClue ? 'pistaIds' : 'localIds';
          return (
            <article className="campaign-assets__card" key={item.id}>
              <div className="campaign-assets__card-head">
                <div><small>{item.tipo}</small><h3>{title}</h3></div>
                <span>{item.visibilidade === 'mestre_privado' ? 'Privado' : 'Compartilhado'}</span>
              </div>
              {item.imagemUrl && <AssetImage src={item.imagemUrl} alt={title} />}
              <p>{item.descricao}</p>
              {'anomaliaDetectada' in item && item.anomaliaDetectada && <small>Anomalia: {item.anomaliaDetectada}</small>}
              {'status' in item && <small>Estado: {item.status}</small>}
              <SessionResourceLinks resourceId={item.id} field={field} sessions={sessions} canManage={canManage} onUpdateSession={onUpdateSession} />
              {canManage && <div className="campaign-assets__actions">
                <button type="button" onClick={() => open(item)}><Pencil size={13}/> Editar / imagem</button>
                <button type="button" className="is-danger" disabled={busy} onClick={() => void remove(item)}><Trash2 size={13}/> Excluir</button>
              </div>}
            </article>
          );
        })}
        {items.length === 0 && <p className="campaign-assets__empty">Nenhum registro. Crie o primeiro.</p>}
      </div>
      {error && !editorOpen && <p role="alert" className="campaign-assets__message">{error}</p>}
      {editorOpen && (
        <div className="actor-editor__backdrop" onMouseDown={close}>
          <form className="actor-editor" onSubmit={save} onMouseDown={event => event.stopPropagation()}>
            <header><h2>{editingId ? 'Editar' : 'Criar'} {isClue ? 'pista' : 'local'}</h2><button type="button" onClick={close}><X size={18}/></button></header>
            <div className="actor-editor__body">
              <label>Nome / título<input required value={name} onChange={event => setName(event.target.value)}/></label>
              <label>Tipo<select value={kind} onChange={event => setKind(event.target.value)}>
                {(isClue ? ['documento','objeto','testemunho','anomalia'] : ['urbano','fronteira','onirico']).map(value => <option key={value} value={value}>{value}</option>)}
              </select></label>
              {isClue ? <label>Status<select value={status} onChange={event => setStatus(event.target.value as Pista['status'])}>
                <option value="descoberta">Descoberta</option><option value="sob_analise">Sob análise</option><option value="resolvida">Resolvida</option>
              </select></label> : <label>Anomalia<input value={extra} onChange={event => setExtra(event.target.value)}/></label>}
              <label>Visibilidade<select value={visibility} onChange={event => setVisibility(event.target.value as VisibilidadeConteudo)}>
                <option value="mestre_privado">Privado do Mestre</option>
                <option value="compartilhado">Compartilhado</option>
                <option value="revelado_jogadores">Revelado aos jogadores</option>
              </select></label>
              <label className="actor-editor__wide">Descrição<textarea rows={4} value={description} onChange={event => setDescription(event.target.value)}/></label>
              <div className="actor-editor__wide campaign-resource-manager__image">
                {displayImage ? <AssetImage src={displayImage} alt="Prévia" /> : <ImagePlus size={30}/>}
                <label><Upload size={14}/> Escolher imagem
                  <input type="file" accept="image/*" onChange={event => { setFile(event.target.files?.[0] || null); setRemoveImage(false); }}/>
                </label>
                <input type="url" value={imageUrl} placeholder="Ou URL de outra imagem"
                  onChange={event => { setImageUrl(event.target.value); setFile(null); setRemoveImage(false); }}/>
                {current?.imagemUrl && <button type="button" onClick={() => { setRemoveImage(true); setImageUrl(''); setFile(null); }}>Remover imagem</button>}
              </div>
              {error && <p role="alert">{error}</p>}
            </div>
            <footer><button type="button" className="ro-button--quiet" onClick={close}>Cancelar</button>
              <button className="ro-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button></footer>
          </form>
        </div>
      )}
    </section>
  );
};
