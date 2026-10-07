import React, { useEffect, useRef, useState } from 'react';
import { Adversario, MapaNarrativo, NPC, TipoTokenMapa, TokenMapa } from '../../types/campaign';
import { Personagem } from '../../types/character';
import { campaignAssetService } from '../../services/storage/campaignAssetService';
import { AssetImage } from '../system/AssetImage';

interface MapStageProps {
  campanhaId: string;
  mapas: MapaNarrativo[];
  tokens: TokenMapa[];
  mestre: boolean;
  personagens?: Personagem[];
  npcs?: NPC[];
  adversarios?: Adversario[];
  onActorUsed?: (kind: 'personagem' | 'npc' | 'adversario', id: string) => void;
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
  campanhaId, mapas, tokens, mestre, personagens = [], npcs = [], adversarios = [], onActorUsed, mapaAtualId, onSelecionarMapa, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, onAdicionarToken, onAtualizarToken, onRemoverToken
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
  const [tokenSource, setTokenSource] = useState('manual');
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
  const criarToken = (event: React.FormEvent) => {
    event.preventDefault();
    if (!mapaAtual) return;

    if (tokenSource !== 'manual') {
      const [kind, id] = tokenSource.split(':', 2);
      const personagem = kind === 'personagem' ? personagens.find(item => item.id === id) : undefined;
      const npc = kind === 'npc' ? npcs.find(item => item.id === id) : undefined;
      const adversario = kind === 'adversario' ? adversarios.find(item => item.id === id) : undefined;
      const actor = personagem || npc || adversario;
      if (!actor) return;
      const tipo = kind as TipoTokenMapa;
      onAdicionarToken({
        campanhaId,
        mapaId: mapaAtual.id,
        tipo,
        nome: actor.nome,
        imagemUrl: actor.imagemUrl,
        characterId: kind === 'personagem' ? id : undefined,
        npcId: kind === 'npc' ? id : undefined,
        adversaryId: kind === 'adversario' ? id : undefined,
        cor: cores[tipo],
        x: 50,
        y: 50,
        oculto: false
      });
      onActorUsed?.(kind as 'personagem' | 'npc' | 'adversario', id);
      setTokenSource('manual');
      return;
    }

    if (!novoToken.trim()) return;
    onAdicionarToken({
      campanhaId,
      mapaId: mapaAtual.id,
      tipo: tipoToken,
      nome: novoToken.trim(),
      cor: cores[tipoToken],
      x: 50,
      y: 50,
      oculto: false
    });
    setNovoToken('');
  };
  const dropActor = (event: React.DragEvent<HTMLDivElement>) => {
    if (!mestre || !mapaAtual || !viewport.current) return;
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/x-ro-actor');
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as {
        kind: 'personagem' | 'npc' | 'adversario';
        id: string;
        name: string;
        imageUrl?: string;
      };
      if (!['personagem', 'npc', 'adversario'].includes(payload.kind)) return;

      const box = viewport.current.getBoundingClientRect();
      const canvasX = (event.clientX - box.left - pan.x) / zoom;
      const canvasY = (event.clientY - box.top - pan.y) / zoom;
      const x = Math.max(2, Math.min(98, (canvasX / box.width) * 100));
      const y = Math.max(2, Math.min(98, (canvasY / box.height) * 100));

      onAdicionarToken({
        campanhaId,
        mapaId: mapaAtual.id,
        tipo: payload.kind,
        nome: payload.name,
        imagemUrl: payload.imageUrl || undefined,
        characterId: payload.kind === 'personagem' ? payload.id : undefined,
        npcId: payload.kind === 'npc' ? payload.id : undefined,
        adversaryId: payload.kind === 'adversario' ? payload.id : undefined,
        cor: cores[payload.kind],
        x,
        y,
        oculto: false
      });
      onActorUsed?.(payload.kind, payload.id);
    } catch {
      // Payload externo ou inválido: simplesmente ignore.
    }
  };

  const startActorDrag = (
    event: React.DragEvent,
    payload: { kind: 'personagem' | 'npc' | 'adversario'; id: string; name: string; imageUrl?: string }
  ) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-ro-actor', JSON.stringify(payload));
  };

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
        onDragOver={(event) => { if (mestre && mapaAtual) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
        onDrop={dropActor}
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
                  {token.imagemUrl
                    ? <AssetImage src={token.imagemUrl} alt="" />
                    : token.nome.slice(0, 2).toUpperCase()}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="map-stage__empty">{mestre ? 'Crie ou selecione um mapa para a cena.' : 'O mapa desta cena ainda não foi revelado.'}</p>
        )}
      </div>

      {mestre && mapaAtual && (
        <div className="map-stage__actor-shelf">
          <div className="map-stage__actor-shelf-label">
            <strong>Tokens</strong>
            <small>Arraste uma ficha para o mapa</small>
          </div>
          <div className="map-stage__actor-shelf-list">
            {personagens.map(personagem => (
              <button
                type="button"
                key={`pc-${personagem.id}`}
                draggable
                onDragStart={event => startActorDrag(event, { kind: 'personagem', id: personagem.id, name: personagem.nome, imageUrl: personagem.imagemUrl })}
                title={`Arrastar ${personagem.nome}`}
              >
                <span>{personagem.imagemUrl ? <AssetImage src={personagem.imagemUrl} alt="" /> : personagem.nome.slice(0,2).toUpperCase()}</span>
                <em>{personagem.nome}</em>
              </button>
            ))}
            {npcs.map(npc => (
              <button
                type="button"
                key={`npc-${npc.id}`}
                draggable
                onDragStart={event => startActorDrag(event, { kind: 'npc', id: npc.id, name: npc.nome, imageUrl: npc.imagemUrl })}
                title={`Arrastar ${npc.nome}`}
              >
                <span>{npc.imagemUrl ? <AssetImage src={npc.imagemUrl} alt="" /> : npc.nome.slice(0,2).toUpperCase()}</span>
                <em>{npc.nome}</em>
              </button>
            ))}
            {adversarios.map(adversario => (
              <button
                type="button"
                key={`adv-${adversario.id}`}
                draggable
                onDragStart={event => startActorDrag(event, { kind: 'adversario', id: adversario.id, name: adversario.nome, imageUrl: adversario.imagemUrl })}
                title={`Arrastar ${adversario.nome}`}
              >
                <span>{adversario.imagemUrl ? <AssetImage src={adversario.imagemUrl} alt="" /> : adversario.nome.slice(0,2).toUpperCase()}</span>
                <em>{adversario.nome}</em>
              </button>
            ))}
          </div>
        </div>
      )}

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
                  <select value={tokenSource} onChange={(e) => setTokenSource(e.target.value)} aria-label="Origem do token">
                    <option value="manual">Marcador manual</option>
                    {personagens.length > 0 && (
                      <optgroup label="Desvelados dos jogadores">
                        {personagens.map(personagem => <option key={personagem.id} value={`personagem:${personagem.id}`}>{personagem.nome} · {personagem.jogador || 'Jogador'}</option>)}
                      </optgroup>
                    )}
                    {npcs.length > 0 && (
                      <optgroup label="NPCs">
                        {npcs.map(npc => <option key={npc.id} value={`npc:${npc.id}`}>{npc.nome}</option>)}
                      </optgroup>
                    )}
                    {adversarios.length > 0 && (
                      <optgroup label="Adversários / monstros">
                        {adversarios.map(adversario => <option key={adversario.id} value={`adversario:${adversario.id}`}>{adversario.nome}</option>)}
                      </optgroup>
                    )}
                  </select>
                  {tokenSource === 'manual' && (
                    <>
                      <input value={novoToken} onChange={(e) => setNovoToken(e.target.value)} placeholder="Nome do marcador" />
                      <select value={tipoToken} onChange={(e) => setTipoToken(e.target.value as TipoTokenMapa)}>
                        <option value="marcador">Marcador</option>
                        <option value="personagem">Personagem manual</option>
                        <option value="npc">NPC manual</option>
                        <option value="adversario">Adversário manual</option>
                      </select>
                    </>
                  )}
                  <button className="ro-button" disabled={tokenSource === 'manual' && !novoToken.trim()}>
                    {tokenSource === 'manual' ? 'Adicionar marcador' : 'Colocar ficha no mapa'}
                  </button>
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