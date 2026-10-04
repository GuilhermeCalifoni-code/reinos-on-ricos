import React, { useEffect, useRef, useState } from 'react';
import { MapaNarrativo, TipoTokenMapa, TokenMapa } from '../../types/campaign';
import { campaignAssetService } from '../../services/storage/campaignAssetService';

interface MapStageProps {
  campanhaId: string;
  mapas: MapaNarrativo[];
  tokens: TokenMapa[];
  mestre: boolean;
  mapaAtualId?: string;
  onSelecionarMapa: (id: string) => void;
  onAdicionarMapa: (mapa: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizarMapa: (id: string, parcial: Partial<MapaNarrativo>) => void;
  onRemoverMapa: (id: string) => void;
  onAdicionarToken: (token: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizarToken: (id: string, parcial: Partial<TokenMapa>) => void;
  onRemoverToken: (id: string) => void;
}

const cores: Record<TipoTokenMapa, string> = { personagem: '#c8a568', npc: '#8ea1bb', adversario: '#bd6570', marcador: '#a99c83' };

export const MapStage: React.FC<MapStageProps> = ({
  campanhaId, mapas, tokens, mestre, mapaAtualId, onSelecionarMapa, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, onAdicionarToken, onAtualizarToken, onRemoverToken
}) => {
  const mapaAtual = mapas.find(mapa => mapa.id === mapaAtualId) || mapas[0];
  const mapaVisivel = Boolean(mapaAtual && (mestre || mapaAtual.visibilidade !== 'mestre_privado'));
  const tokensAtuais = mapaAtual ? tokens.filter(token => token.mapaId === mapaAtual.id && (mestre || !token.oculto)) : [];
  const viewport = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [posicoesLocais, setPosicoesLocais] = useState<Record<string, { x: number; y: number }>>({});
  const [movendoCamera, setMovendoCamera] = useState<{ x: number; y: number } | null>(null);
  const [novoMapa, setNovoMapa] = useState('');
  const [novaImagem, setNovaImagem] = useState('');
  const [novoStoragePath, setNovoStoragePath] = useState('');
  const [imagemResolvida, setImagemResolvida] = useState('');
  const [uploading, setUploading] = useState(false);
  const [assetError, setAssetError] = useState('');
  const [arquivoNome, setArquivoNome] = useState('');
  const [novoToken, setNovoToken] = useState('');
  const [tipoToken, setTipoToken] = useState<TipoTokenMapa>('marcador');
  const criarMapa = (event: React.FormEvent) => {
    event.preventDefault();
    if (!novoMapa.trim() || uploading) return;
    onAdicionarMapa({
      campanhaId,
      titulo: novoMapa.trim(),
      imagemUrl: novoStoragePath ? undefined : (novaImagem.trim() || undefined),
      storagePath: novoStoragePath || undefined,
      visibilidade: 'revelado_jogadores',
      gradeVisivel: false
    });
    setNovoMapa('');
    setNovaImagem('');
    setNovoStoragePath('');
    setArquivoNome('');
    setAssetError('');
  };
  const criarToken = (event: React.FormEvent) => { event.preventDefault(); if (!mapaAtual || !novoToken.trim()) return; onAdicionarToken({ campanhaId, mapaId: mapaAtual.id, tipo: tipoToken, nome: novoToken.trim(), cor: cores[tipoToken], x: 50, y: 50, oculto: false }); setNovoToken(''); };
  const mover = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!viewport.current) return;
    if (arrastando) {
      const box = viewport.current.getBoundingClientRect();
      setPosicoesLocais(atual => ({ ...atual, [arrastando]: { x: Math.max(2, Math.min(98, ((event.clientX - box.left) / box.width) * 100)), y: Math.max(2, Math.min(98, ((event.clientY - box.top) / box.height) * 100)) } }));
    } else if (movendoCamera) {
      setPan(atual => ({ x: atual.x + event.clientX - movendoCamera.x, y: atual.y + event.clientY - movendoCamera.y }));
      setMovendoCamera({ x: event.clientX, y: event.clientY });
    }
  };
  const finalizarArrasto = () => {
    if (arrastando && posicoesLocais[arrastando]) onAtualizarToken(arrastando, posicoesLocais[arrastando]);
    if (arrastando) setPosicoesLocais(atual => { const { [arrastando]: _, ...restante } = atual; return restante; });
    setArrastando(null); setMovendoCamera(null);
  };
  const selecionarArquivo = async (file?: File) => {
    if (!file) return;
    setAssetError('');
    if (!file.type.startsWith('image/')) {
      setAssetError('Selecione uma imagem PNG, JPG, WEBP ou GIF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setAssetError('A imagem excede o limite de 15 MB.');
      return;
    }
    setArquivoNome(file.name);
    if (campaignAssetService.isRemoteCampaignId(campanhaId)) {
      setUploading(true);
      try {
        const path = await campaignAssetService.uploadMap(campanhaId, file);
        setNovoStoragePath(path);
        setNovaImagem('');
      } catch (error: any) {
        const mensagem = error.message || 'Não foi possível enviar a imagem.';
        setAssetError(`${mensagem} Verifique se a migration de Storage foi aplicada no Supabase.`);
      } finally {
        setUploading(false);
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setNovaImagem(String(reader.result)); setNovoStoragePath(''); };
    reader.readAsDataURL(file);
  };
  const fullscreen = () => viewport.current?.requestFullscreen?.();

  useEffect(() => {
    let ativo = true;
    if (!mapaAtual?.storagePath) {
      setImagemResolvida(mapaAtual?.imagemUrl || '');
      return () => { ativo = false; };
    }
    setImagemResolvida('');
    void campaignAssetService.signedUrl(mapaAtual.storagePath)
      .then(url => { if (ativo) setImagemResolvida(url); })
      .catch(() => { if (ativo) setImagemResolvida(''); });
    return () => { ativo = false; };
  }, [mapaAtual?.imagemUrl, mapaAtual?.storagePath]);
  return (
    <section className="map-stage map-stage--v4">
      <header className="map-stage__head">
        <div>
          <p className="ro-eyebrow">Mapa da cena</p>
          <h2>{mapaAtual?.titulo || 'Nenhum mapa selecionado'}</h2>
        </div>
        <div className="map-stage__tools">
          <button onClick={() => setZoom(valor => Math.max(.6, valor - .1))} aria-label="Diminuir zoom">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(valor => Math.min(2, valor + .1))} aria-label="Aumentar zoom">+</button>
          <button onClick={fullscreen}>⛶</button>
        </div>
      </header>

      {mestre && (
        <div className="map-stage__library map-stage__library--v4">
          <select value={mapaAtual?.id || ''} onChange={(e) => onSelecionarMapa(e.target.value)} aria-label="Selecionar mapa">
            <option value="">Selecionar mapa</option>
            {mapas.map(mapa => <option key={mapa.id} value={mapa.id}>{mapa.titulo}</option>)}
          </select>
          {mapaAtual && <button onClick={() => onAtualizarMapa(mapaAtual.id, { gradeVisivel: !mapaAtual.gradeVisivel })}>{mapaAtual.gradeVisivel ? 'Sem grade' : 'Grade'}</button>}
          {mapaAtual && <button onClick={() => onAtualizarMapa(mapaAtual.id, { visibilidade: mapaAtual.visibilidade === 'mestre_privado' ? 'revelado_jogadores' : 'mestre_privado' })}>{mapaAtual.visibilidade === 'mestre_privado' ? 'Revelar' : 'Ocultar'}</button>}
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Centralizar</button>
        </div>
      )}

      <div
        ref={viewport}
        className={`map-stage__viewport ${mapaAtual?.gradeVisivel ? 'has-grid' : ''}`}
        onPointerMove={mover}
        onPointerUp={finalizarArrasto}
        onPointerLeave={finalizarArrasto}
        onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('.map-stage__token')) setMovendoCamera({ x: e.clientX, y: e.clientY }); }}
        onWheel={(e) => { e.preventDefault(); setZoom(valor => Math.max(.6, Math.min(2, valor + (e.deltaY < 0 ? .1 : -.1)))); }}
      >
        {mapaVisivel && mapaAtual ? (
          <div className="map-stage__canvas" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, backgroundImage: imagemResolvida ? `url(${imagemResolvida})` : undefined }}>
            {!imagemResolvida && <span className="map-stage__placeholder">Adicione uma imagem para transformar este espaço no mapa da cena.</span>}
            {tokensAtuais.map(token => {
              const posicao = posicoesLocais[token.id] || token;
              return (
                <button
                  key={token.id}
                  className={`map-stage__token token--${token.tipo} ${token.oculto ? 'is-hidden' : ''}`}
                  style={{ left: `${posicao.x}%`, top: `${posicao.y}%`, '--token-color': token.cor } as React.CSSProperties}
                  onPointerDown={(e) => {
                    if (!mestre) return;
                    e.stopPropagation();
                    setArrastando(token.id);
                    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                  }}
                  onDoubleClick={() => mestre && onAtualizarToken(token.id, { nome: window.prompt('Nome do token', token.nome) || token.nome })}
                  title={mestre ? `${token.nome} · arraste para mover · duplo clique para renomear` : token.nome}
                >
                  {token.nome.slice(0, 2).toUpperCase()}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="map-stage__empty">{mestre ? 'Crie ou selecione um mapa para a cena.' : 'O mapa desta cena ainda não foi revelado.'}</p>
        )}
      </div>

      {mapaAtual && (
        <footer className="map-stage__caption">
          <div><strong>{mapaAtual.titulo}</strong><small>{mapaAtual.gradeVisivel ? 'Grade ativa' : 'Mapa narrativo'}</small></div>
          <span>{mapaAtual.visibilidade === 'mestre_privado' ? 'Privado do Mestre' : 'Visível à mesa'}</span>
        </footer>
      )}

      {mestre && (
        <details className="map-stage__setup">
          <summary>Preparar mapa e tokens</summary>
          <div className="map-stage__setup-body">
            <form onSubmit={criarMapa} className="map-stage__create">
              <input value={novoMapa} onChange={(e) => setNovoMapa(e.target.value)} placeholder="Nome do novo mapa" />
              <input value={novaImagem} onChange={(e) => { setNovaImagem(e.target.value); setNovoStoragePath(''); setArquivoNome(''); }} placeholder="URL da imagem, opcional" />
              <label className={`map-stage__file ${novoStoragePath || novaImagem ? 'has-file' : ''}`}>
                <strong>{uploading ? 'Enviando imagem…' : arquivoNome || (novoStoragePath ? 'Imagem pronta' : 'Anexar imagem')}</strong>
                <small>{novoStoragePath ? 'Upload concluído' : 'PNG, JPG, WEBP ou GIF · até 15 MB'}</small>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={(e) => void selecionarArquivo(e.target.files?.[0])} />
              </label>
              <button className="ro-button" disabled={uploading || !novoMapa.trim()}>Criar mapa</button>
              {assetError && <span className="map-stage__asset-error">{assetError}</span>}
            </form>

            {mapaAtual && (
              <>
                <form onSubmit={criarToken} className="map-stage__create map-stage__create--token">
                  <input value={novoToken} onChange={(e) => setNovoToken(e.target.value)} placeholder="Nome do token" />
                  <select value={tipoToken} onChange={(e) => setTipoToken(e.target.value as TipoTokenMapa)}>
                    <option value="personagem">Personagem</option>
                    <option value="npc">NPC</option>
                    <option value="adversario">Adversário</option>
                    <option value="marcador">Marcador</option>
                  </select>
                  <button className="ro-button">Adicionar token</button>
                </form>
                <div className="map-stage__tokens">
                  {tokens.filter(token => token.mapaId === mapaAtual.id).map(token => (
                    <div key={token.id}>
                      <span style={{ background: token.cor }} />
                      <strong>{token.nome}</strong>
                      <button onClick={() => onAtualizarToken(token.id, { oculto: !token.oculto })}>{token.oculto ? 'Revelar' : 'Ocultar'}</button>
                      <button onClick={() => onRemoverToken(token.id)} className="is-danger">Remover</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => onRemoverMapa(mapaAtual.id)} className="map-stage__delete is-danger">Excluir mapa atual</button>
              </>
            )}
          </div>
        </details>
      )}
    </section>
  );
};