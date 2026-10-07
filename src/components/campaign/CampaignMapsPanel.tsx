import React, { useState } from 'react';
import { Eye, EyeOff, Grid3X3, ImagePlus, Map as MapIcon, Trash2, Upload } from 'lucide-react';
import { MapaNarrativo } from '../../types/campaign';
import { campaignAssetService } from '../../services/storage/campaignAssetService';
import { AssetImage } from '../system/AssetImage';

interface CampaignMapsPanelProps {
  campaignId: string;
  maps: MapaNarrativo[];
  canManage: boolean;
  onAdd: (map: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<unknown> | unknown;
  onUpdate: (id: string, patch: Partial<MapaNarrativo>) => Promise<unknown> | unknown;
  onRemove: (id: string) => Promise<unknown> | unknown;
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(file);
});

const visual = (map: MapaNarrativo) =>
  map.imagemUrl || (map.storagePath ? campaignAssetService.toStorageRef(map.storagePath) : '');

export const CampaignMapsPanel: React.FC<CampaignMapsPanelProps> = ({
  campaignId,
  maps,
  canManage,
  onAdd,
  onUpdate,
  onRemove
}) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const createMap = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setMessage('');
    try {
      let imagemUrl = imageUrl.trim() || undefined;
      let storagePath: string | undefined;
      if (file) {
        if (campaignAssetService.isRemoteCampaignId(campaignId)) {
          storagePath = await campaignAssetService.uploadMap(campaignId, file);
          imagemUrl = undefined;
        } else {
          imagemUrl = await fileToDataUrl(file);
        }
      }

      await onAdd({
        campanhaId: campaignId,
        titulo: title.trim(),
        imagemUrl,
        storagePath,
        visibilidade: 'mestre_privado',
        gradeVisivel: false
      });

      setTitle('');
      setImageUrl('');
      setFile(null);
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível criar o mapa.');
    } finally {
      setBusy(false);
    }
  };

  const removeMap = async (map: MapaNarrativo) => {
    setMessage('');
    try {
      if (map.storagePath) await campaignAssetService.remove(map.storagePath);
      await onRemove(map.id);
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível excluir o mapa.');
    }
  };

  return (
    <section className="campaign-maps">
      <header className="campaign-maps__head">
        <div>
          <p className="ro-eyebrow">Cartografia narrativa</p>
          <h2>Biblioteca de Mapas</h2>
          <p>Crie os mapas aqui, organize-os na campanha e depois aponte cada um para a sessão certa no Estúdio de Sessão.</p>
        </div>
        <span>{maps.length} mapas</span>
      </header>

      {canManage && (
        <form className="campaign-maps__create" onSubmit={createMap}>
          <div className="campaign-maps__create-copy">
            <MapIcon size={18} />
            <div><strong>Novo mapa</strong><span>Batalha, investigação, planta, cidade, região ou referência visual.</span></div>
          </div>
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Nome do mapa" required />
          <input value={imageUrl} onChange={event => { setImageUrl(event.target.value); if (event.target.value) setFile(null); }} placeholder="URL da imagem (opcional)" />
          <label className="campaign-maps__upload">
            <Upload size={15} />
            <span>{file ? file.name : 'Enviar imagem'}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => setFile(event.target.files?.[0] || null)} />
          </label>
          <button type="submit" className="ro-button" disabled={busy}>{busy ? 'Criando…' : 'Criar mapa'}</button>
        </form>
      )}

      <div className="campaign-maps__grid">
        {maps.map(map => (
          <article key={map.id} className="campaign-maps__card">
            <div className="campaign-maps__media">
              {visual(map) ? <AssetImage src={visual(map)} alt="" /> : <div><ImagePlus size={25} /><span>Sem imagem</span></div>}
              <span>{map.visibilidade === 'mestre_privado' ? 'Privado' : 'Revelável'}</span>
            </div>
            <div className="campaign-maps__body">
              <h3>{map.titulo}</h3>
              <p>{map.gradeVisivel ? 'Grade preparada' : 'Sem grade'} · pronto para vincular a sessões.</p>
              {canManage && (
                <div className="campaign-maps__actions">
                  <button type="button" onClick={() => void onUpdate(map.id, { gradeVisivel: !map.gradeVisivel })}>
                    <Grid3X3 size={13} /> {map.gradeVisivel ? 'Remover grade' : 'Usar grade'}
                  </button>
                  <button type="button" onClick={() => void onUpdate(map.id, { visibilidade: map.visibilidade === 'mestre_privado' ? 'revelado_jogadores' : 'mestre_privado' })}>
                    {map.visibilidade === 'mestre_privado' ? <Eye size={13} /> : <EyeOff size={13} />}
                    {map.visibilidade === 'mestre_privado' ? 'Permitir revelar' : 'Tornar privado'}
                  </button>
                  <button type="button" className="is-danger" onClick={() => void removeMap(map)}>
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
        {maps.length === 0 && <p className="campaign-maps__empty">Nenhum mapa no arquivo da campanha. Crie o primeiro sem precisar entrar na Mesa Ao Vivo.</p>}
      </div>

      {message && <p className="campaign-maps__message">{message}</p>}
    </section>
  );
};
