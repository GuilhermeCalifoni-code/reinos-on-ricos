import React, { useEffect, useState } from 'react';
import { ImagePlus, Link2, Upload } from 'lucide-react';
import { CampanhaTipo } from '../types/campaign';

interface CreateCampaignViewProps {
  onCriar: (dados: {
    nome: string;
    descricao: string;
    imagemUrl: string;
    imagemArquivo?: File;
    tipo: CampanhaTipo;
  }) => Promise<void> | void;
  onCancelar: () => void;
}

export const CreateCampaignView: React.FC<CreateCampaignViewProps> = ({ onCriar, onCancelar }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [previewLocal, setPreviewLocal] = useState('');
  const [tipo, setTipo] = useState<CampanhaTipo>('campanha');
  const [modoImagem, setModoImagem] = useState<'upload' | 'url'>('upload');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!imagemArquivo) {
      setPreviewLocal('');
      return;
    }
    const url = URL.createObjectURL(imagemArquivo);
    setPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [imagemArquivo]);

  const escolherArquivo = (file?: File) => {
    setErro('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione uma imagem PNG, JPG, WEBP ou GIF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErro('A imagem excede o limite de 15 MB.');
      return;
    }
    setImagemArquivo(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    setErro('');
    try {
      await onCriar({
        nome: nome.trim(),
        descricao: descricao.trim(),
        imagemUrl: imagemUrl.trim(),
        imagemArquivo: modoImagem === 'upload' ? imagemArquivo || undefined : undefined,
        tipo
      });
    } catch (error: any) {
      setErro(error.message || 'Não foi possível criar a campanha.');
    } finally {
      setSalvando(false);
    }
  };

  const preview = modoImagem === 'upload' && previewLocal ? previewLocal : imagemUrl;

  return (
    <section className="ro-create-campaign">
      <header className="ro-create-campaign__head">
        <div>
          <p className="ro-eyebrow">Novo arquivo da Vigília</p>
          <h1>Nova Campanha</h1>
          <p>Defina o essencial agora. Todo o restante pode ser preparado dentro da campanha.</p>
        </div>
        <button type="button" className="ro-button--quiet" onClick={onCancelar}>Cancelar</button>
      </header>

      <form onSubmit={handleSubmit} className="ro-create-campaign__form">
        <div className="ro-create-campaign__main">
          <label>
            <span>Nome da campanha</span>
            <input type="text" required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: O Homem que Atrasa" />
          </label>

          <label>
            <span>Descrição</span>
            <textarea rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="O que os Desvelados encontrarão nesta história?" />
          </label>

          <div className="ro-create-campaign__type">
            <span>Formato</span>
            <div>
              {([
                ['campanha', 'Campanha', 'Crônica contínua com várias sessões.'],
                ['oneshot', 'One-shot', 'Uma história para uma única sessão.'],
                ['playtest', 'Playtest', 'Mesa de teste para regras e conteúdo.']
              ] as [CampanhaTipo, string, string][]).map(([value, label, hint]) => (
                <button key={value} type="button" onClick={() => setTipo(value)} className={tipo === value ? 'is-active' : ''}>
                  <strong>{label}</strong><small>{hint}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="ro-create-campaign__visual">
          <div className="ro-create-campaign__preview">
            {preview ? <img src={preview} alt="Prévia da capa da campanha" /> : <ImagePlus />}
            <span>Prévia da campanha</span>
          </div>

          <div className="ro-create-campaign__image-tabs">
            <button type="button" className={modoImagem === 'upload' ? 'is-active' : ''} onClick={() => setModoImagem('upload')}><Upload /> Arquivo</button>
            <button type="button" className={modoImagem === 'url' ? 'is-active' : ''} onClick={() => setModoImagem('url')}><Link2 /> URL</button>
          </div>

          {modoImagem === 'upload' && (
            <label className="ro-create-campaign__upload">
              <Upload />
              <strong>{imagemArquivo ? imagemArquivo.name : 'Escolher imagem'}</strong>
              <small>PNG, JPG, WEBP ou GIF · até 15 MB</small>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => escolherArquivo(e.target.files?.[0])} />
            </label>
          )}

          {modoImagem === 'url' && (
            <label>
              <span>URL da imagem</span>
              <input type="url" value={imagemUrl} onChange={e => { setImagemUrl(e.target.value); setImagemArquivo(null); }} placeholder="https://…" />
            </label>
          )}

          {modoImagem === 'colecao' && (
            <div className="ro-create-campaign__collection">
              {IMAGENS_ATMOSFERICAS_PREDEFINIDAS.map(img => (
                <button key={img.id} type="button" className={imagemUrl === img.url ? 'is-active' : ''} onClick={() => { setImagemUrl(img.url); setImagemArquivo(null); }}>
                  <img src={img.url} alt="" /><span>{img.nome}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {erro && <p className="ro-create-campaign__error">{erro}</p>}

        <footer className="ro-create-campaign__footer">
          <p>A capa pode ser alterada depois. Imagens enviadas em campanhas online ficam no Storage privado da campanha.</p>
          <button type="submit" className="ro-button" disabled={salvando || !nome.trim()}>
            {salvando ? 'Criando…' : 'Criar campanha'} <span aria-hidden="true">→</span>
          </button>
        </footer>
      </form>
    </section>
  );
};
