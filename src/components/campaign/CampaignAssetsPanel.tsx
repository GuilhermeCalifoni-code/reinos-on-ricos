import React, { useState } from 'react';
import { Cena, ConteudoDeCena, Handout, VisibilidadeConteudo } from '../../types/campaign';
import { campaignAssetService } from '../../services/storage/campaignAssetService';
import { AssetImage } from '../system/AssetImage';

interface CampaignAssetsPanelProps {
  campaignId: string;
  mode: 'cenas' | 'handouts';
  scenes: Cena[];
  handouts: Handout[];
  canManage: boolean;
  onAddScene: (scene: Omit<Cena, 'id'>) => Promise<unknown> | unknown;
  onUpdateScene: (id: string, patch: Partial<Cena>) => Promise<unknown> | unknown;
  onRemoveScene: (id: string) => Promise<unknown> | unknown;
  onAddHandout: (handout: Omit<Handout, 'id'>) => Promise<unknown> | unknown;
  onUpdateHandout: (id: string, patch: Partial<Handout>) => Promise<unknown> | unknown;
  onRemoveHandout: (id: string) => Promise<unknown> | unknown;
}

const visibilityLabel: Record<VisibilidadeConteudo, string> = {
  mestre_privado: 'Mestre privado',
  compartilhado: 'Compartilhado',
  revelado_jogadores: 'Revelado aos jogadores'
};

export const CampaignAssetsPanel: React.FC<CampaignAssetsPanelProps> = ({
  campaignId, mode, scenes, handouts, canManage,
  onAddScene, onUpdateScene, onRemoveScene,
  onAddHandout, onUpdateHandout, onRemoveHandout
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<VisibilidadeConteudo>('mestre_privado');
  const [contentType, setContentType] = useState<ConteudoDeCena>('ambientacao');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setVisibility('mestre_privado');
    setContentType('ambientacao');
    setImageUrl('');
    setFile(null);
  };

  const fileToDataUrl = (selected: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(selected);
  });

  const submitScene = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true); setMessage('');
    try {
      let finalImageUrl = imageUrl.trim() || undefined;

      if (file && (contentType === 'imagem' || contentType === 'handout')) {
        if (campaignAssetService.isRemoteCampaignId(campaignId)) {
          const storagePath = await campaignAssetService.uploadSceneImage(campaignId, file);
          finalImageUrl = campaignAssetService.toStorageRef(storagePath);
        } else {
          finalImageUrl = await fileToDataUrl(file);
        }
      }

      await onAddScene({
        campanhaId: campaignId,
        titulo: title.trim(),
        descricao: description.trim() || undefined,
        visibilidade: visibility,
        tipoDeConteudo: contentType,
        imagemUrl: finalImageUrl
      });
      reset();
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível salvar a cena.');
    } finally { setBusy(false); }
  };

  const submitHandout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true); setMessage('');
    try {
      let arquivoUrl: string | undefined;
      let storagePath: string | undefined;

      if (file) {
        if (campaignAssetService.isRemoteCampaignId(campaignId)) {
          storagePath = await campaignAssetService.uploadHandout(campaignId, file);
        } else {
          arquivoUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          });
        }
      }

      await onAddHandout({
        campanhaId: campaignId,
        titulo: title.trim(),
        descricao: description.trim() || undefined,
        arquivoUrl,
        storagePath,
        visibilidade: visibility
      });
      reset();
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível salvar o handout.');
    } finally { setBusy(false); }
  };

  const openSceneImage = async (scene: Cena) => {
    if (!scene.imagemUrl) return;
    setMessage('');
    try {
      const url = await campaignAssetService.resolveImageRef(scene.imagemUrl);
      if (!url) throw new Error('Esta cena não possui imagem.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível abrir a imagem da cena.');
    }
  };

  const removeScene = async (scene: Cena) => {
    try {
      if (scene.imagemUrl && campaignAssetService.isStorageRef(scene.imagemUrl)) {
        await campaignAssetService.remove(campaignAssetService.fromStorageRef(scene.imagemUrl));
      }
      await onRemoveScene(scene.id);
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível excluir a cena.');
    }
  };

  const openHandout = async (handout: Handout) => {
    setMessage('');
    try {
      const url = handout.storagePath
        ? await campaignAssetService.signedUrl(handout.storagePath)
        : handout.arquivoUrl;
      if (!url) throw new Error('Este handout não possui arquivo anexado.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível abrir o arquivo.');
    }
  };

  const toggleSceneVisibility = (scene: Cena) => {
    const next: VisibilidadeConteudo = scene.visibilidade === 'mestre_privado'
      ? 'revelado_jogadores'
      : 'mestre_privado';
    void onUpdateScene(scene.id, { visibilidade: next });
  };

  const removeHandout = async (handout: Handout) => {
    try {
      if (handout.storagePath) await campaignAssetService.remove(handout.storagePath);
      await onRemoveHandout(handout.id);
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível excluir o handout.');
    }
  };

  const toggleHandoutVisibility = (handout: Handout) => {
    const next: VisibilidadeConteudo = handout.visibilidade === 'mestre_privado'
      ? 'revelado_jogadores'
      : 'mestre_privado';
    void onUpdateHandout(handout.id, { visibilidade: next });
  };

  if (mode === 'cenas') {
    return (
      <section className="campaign-assets">
        <header className="campaign-assets__head">
          <div><p className="ro-eyebrow">Preparação narrativa</p><h2>Cenas da campanha</h2></div>
          <span>{scenes.length} registros</span>
        </header>

        {canManage && (
          <form className="campaign-assets__form" onSubmit={submitScene}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da cena" required />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="O que acontece nesta cena?" rows={3} />
            <div className="campaign-assets__row">
              <select value={contentType} onChange={e => setContentType(e.target.value as ConteudoDeCena)}>
                <option value="ambientacao">Ambientação</option>
                <option value="imagem">Imagem</option>
                <option value="mapa">Mapa</option>
                <option value="handout">Handout</option>
              </select>
              <select value={visibility} onChange={e => setVisibility(e.target.value as VisibilidadeConteudo)}>
                {Object.entries(visibilityLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {(contentType === 'imagem' || contentType === 'handout') && (
              <div className="campaign-assets__visual-inputs">
                <label className="campaign-assets__file">
                  <span>{file ? file.name : 'Selecionar imagem da cena'}</span>
                  <small>PNG, JPG, WEBP ou GIF · até 15 MB</small>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <span className="campaign-assets__or">ou</span>
                <input value={imageUrl} onChange={e => { setImageUrl(e.target.value); if (e.target.value) setFile(null); }} placeholder="URL visual opcional" />
              </div>
            )}
            <button className="ro-button" disabled={busy}>{busy ? 'Salvando…' : 'Criar cena'}</button>
          </form>
        )}

        <div className="campaign-assets__grid">
          {scenes.map(scene => (
            <article key={scene.id} className="campaign-assets__card">
              <div className="campaign-assets__card-head">
                <div><small>{scene.tipoDeConteudo}</small><h3>{scene.titulo}</h3></div>
                <span>{visibilityLabel[scene.visibilidade]}</span>
              </div>
              {scene.imagemUrl && (
                <button type="button" className="campaign-assets__scene-image" onClick={() => void openSceneImage(scene)} aria-label={`Abrir imagem de ${scene.titulo}`}>
                  <AssetImage src={scene.imagemUrl} fallbackSrc="/ro-login-mist-city.webp" alt="" />
                </button>
              )}
              {scene.descricao && <p>{scene.descricao}</p>}
              {scene.imagemUrl && <button type="button" className="campaign-assets__open" onClick={() => void openSceneImage(scene)}>Abrir imagem ↗</button>}
              {canManage && (
                <div className="campaign-assets__actions">
                  <button type="button" onClick={() => toggleSceneVisibility(scene)}>
                    {scene.visibilidade === 'mestre_privado' ? 'Revelar' : 'Ocultar'}
                  </button>
                  <button type="button" className="is-danger" onClick={() => void removeScene(scene)}>Excluir</button>
                </div>
              )}
            </article>
          ))}
          {scenes.length === 0 && <p className="campaign-assets__empty">Nenhuma cena preparada ainda.</p>}
        </div>
        {message && <p className="campaign-assets__message">{message}</p>}
      </section>
    );
  }

  return (
    <section className="campaign-assets">
      <header className="campaign-assets__head">
        <div><p className="ro-eyebrow">Arquivos da história</p><h2>Handouts</h2></div>
        <span>{handouts.length} arquivos</span>
      </header>

      {canManage && (
        <form className="campaign-assets__form" onSubmit={submitHandout}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do handout" required />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Contexto ou observação do Mestre" rows={3} />
          <select value={visibility} onChange={e => setVisibility(e.target.value as VisibilidadeConteudo)}>
            {Object.entries(visibilityLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="campaign-assets__file">
            <span>{file ? file.name : 'Selecionar arquivo'}</span>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <button className="ro-button" disabled={busy}>{busy ? 'Enviando…' : 'Adicionar handout'}</button>
        </form>
      )}

      <div className="campaign-assets__grid">
        {handouts.map(handout => (
          <article key={handout.id} className="campaign-assets__card">
            <div className="campaign-assets__card-head">
              <div><small>handout</small><h3>{handout.titulo}</h3></div>
              <span>{visibilityLabel[handout.visibilidade]}</span>
            </div>
            {handout.descricao && <p>{handout.descricao}</p>}
            <button type="button" className="campaign-assets__open" onClick={() => void openHandout(handout)}>Abrir arquivo ↗</button>
            {canManage && (
              <div className="campaign-assets__actions">
                <button type="button" onClick={() => toggleHandoutVisibility(handout)}>
                  {handout.visibilidade === 'mestre_privado' ? 'Revelar' : 'Ocultar'}
                </button>
                <button type="button" className="is-danger" onClick={() => void removeHandout(handout)}>Excluir</button>
              </div>
            )}
          </article>
        ))}
        {handouts.length === 0 && <p className="campaign-assets__empty">Nenhum handout adicionado ainda.</p>}
      </div>
      {message && <p className="campaign-assets__message">{message}</p>}
    </section>
  );
};
