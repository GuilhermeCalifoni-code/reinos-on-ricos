import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Eye, EyeOff, Grid3X3, Maximize2, Minus, Plus, Ruler, Trash2, Upload } from 'lucide-react';
import { Adversario, MapaNarrativo, NPC, TipoTokenMapa, TokenMapa } from '../../types/campaign';
import { Personagem } from '../../types/character';
import { campaignAssetService } from '../../services/storage/campaignAssetService';
import { AssetImage } from '../system/AssetImage';
import { calculatePinchCamera, centerBetween, distanceBetween, Point2D } from '../../features/realtime/mapTouchGeometry';
import { addTokenHp, nextInstanceName, resolvedTokenHp } from '../../features/realtime/mapTokenInstances';

interface MapStageProps {
  campanhaId: string;
  mapas: MapaNarrativo[];
  tokens: TokenMapa[];
  mestre: boolean;
  personagemJogadorId?: string;
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
  onAtualizarToken: (id: string, parcial: Partial<TokenMapa>) => Promise<unknown> | void;
  onRemoverToken: (id: string) => void;
}

const cores: Record<TipoTokenMapa, string> = {
  personagem: '#c8a568',
  npc: '#8ea1bb',
  adversario: '#bd6570',
  marcador: '#a99c83'
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const MapStage: React.FC<MapStageProps> = ({
  campanhaId,
  mapas,
  tokens,
  mestre,
  personagemJogadorId,
  personagens = [],
  npcs = [],
  adversarios = [],
  onActorUsed,
  mapaAtualId,
  onSelecionarMapa,
  onAdicionarMapa,
  onAtualizarMapa,
  onRemoverMapa,
  onAdicionarToken,
  onAtualizarToken,
  onRemoverToken
}) => {
  // Nunca exiba outro mapa como substituto quando o mapa ativo não é visível ao jogador.
  const mapaAtual = mapaAtualId ? mapas.find(mapa => mapa.id === mapaAtualId) : mapas[0];
  const mapaVisivel = Boolean(mapaAtual && (mestre || mapaAtual.visibilidade !== 'mestre_privado'));
  const tokensAtuais = useMemo(
    () => mapaAtual ? tokens.filter(token => token.mapaId === mapaAtual.id && (mestre || !token.oculto)) : [],
    [mapaAtual, mestre, tokens]
  );

  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [posicoesLocais, setPosicoesLocais] = useState<Record<string, { x: number; y: number }>>({});
  const [movendoCamera, setMovendoCamera] = useState<{ x: number; y: number } | null>(null);
  const pointerPositions = useRef(new Map<number, Point2D>());
  const pinchGesture = useRef<{
    distance: number;
    center: Point2D;
    zoom: number;
    pan: Point2D;
  } | null>(null);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

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
  const [quantidade, setQuantidade] = useState(1);
  const [hpAmount, setHpAmount] = useState(1);
  const [marcandoArea, setMarcandoArea] = useState(false);
  const [areaRadius, setAreaRadius] = useState(3);
  const [areaColor, setAreaColor] = useState('#dc884c');
  const [tokenError, setTokenError] = useState('');
  const pendingNames = useRef(new Set<string>());

  const gridSize = clamp(mapaAtual?.gridSize ?? 64, 24, 160);
  const tokenSelecionado = tokensAtuais.find(token => token.id === selecionadoId) || null;
  const npcDoToken = tokenSelecionado?.npcId ? npcs.find(npc => npc.id === tokenSelecionado.npcId) : undefined;
  const adversarioDoToken = tokenSelecionado?.adversaryId ? adversarios.find(a => a.id === tokenSelecionado.adversaryId) : undefined;
  const tokenLife = tokenSelecionado
    ? resolvedTokenHp(tokenSelecionado,
        npcDoToken?.vida ?? adversarioDoToken?.vida,
        npcDoToken?.vidaMaxima ?? adversarioDoToken?.vidaMaxima)
    : null;

  const podeControlarToken = (token: TokenMapa) =>
    mestre || Boolean(personagemJogadorId && token.characterId === personagemJogadorId);

  const criarMapa = (event: React.FormEvent) => {
    event.preventDefault();
    if (!novoMapa.trim() || uploading) return;
    onAdicionarMapa({
      campanhaId,
      titulo: novoMapa.trim(),
      imagemUrl: novoStoragePath ? undefined : (novaImagem.trim() || undefined),
      storagePath: novoStoragePath || undefined,
      visibilidade: 'revelado_jogadores',
      gradeVisivel: true,
      gridSize: 64
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
      const prevNames = tokensAtuais.filter(t => t.tipo === tipo
        && (tipo === 'npc' ? t.npcId === id : tipo === 'adversario' ? t.adversaryId === id : t.characterId === id))
        .map(t => t.nome);
      const usedNames = [...prevNames, ...pendingNames.current];
      for (let i = 0; i < quantidade; i++) {
        const name = tipo === 'personagem' ? actor.nome : nextInstanceName(actor.nome, usedNames);
        usedNames.push(name);
        pendingNames.current.add(name);
        onAdicionarToken({
          campanhaId, mapaId: mapaAtual.id, tipo, nome: name, imagemUrl: actor.imagemUrl,
          characterId: kind === 'personagem' ? id : undefined,
          npcId: kind === 'npc' ? id : undefined,
          adversaryId: kind === 'adversario' ? id : undefined,
          hpCurrent: npc?.vida ?? adversario?.vida,
          hpMax: npc ? Math.max(1,npc.vidaMaxima ?? npc.vida ?? 1) : adversario?.vidaMaxima,
          tokenSize: 1, rangeCells: 0, areaRadiusCells: 0,
          cor: cores[tipo], x: clamp(45 + i * 4, 0, 100), y: clamp(45 + i * 4, 0, 100),
          oculto: false
        });
      }
      onActorUsed?.(kind as 'personagem' | 'npc' | 'adversario', id);
      setTokenSource('manual');
      setQuantidade(1);
      return;
    }

    if (!novoToken.trim()) return;
    onAdicionarToken({
      campanhaId,
      mapaId: mapaAtual.id,
      tipo: tipoToken,
      nome: novoToken.trim(),
      tokenSize: 1,
      rangeCells: 0,
      areaRadiusCells: 0,
      cor: cores[tipoToken],
      x: 50,
      y: 50,
      oculto: false
    });
    setNovoToken('');
  };

  const pontoNoCanvas = (clientX: number, clientY: number) => {
    const node = canvas.current;
    if (!node) return null;
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    return {
      x: clamp(((clientX - box.left) / box.width) * 100, 0, 100),
      y: clamp(((clientY - box.top) / box.height) * 100, 0, 100)
    };
  };

  const registrarToque = (pointerId: number, point: Point2D) => {
    pointerPositions.current.set(pointerId, point);
    if (pointerPositions.current.size !== 2) return;
    const [first, second] = [...pointerPositions.current.values()];
    pinchGesture.current = {
      distance: distanceBetween(first, second),
      center: centerBetween(first, second),
      zoom,
      pan
    };
    // Segundo dedo cancela o arrasto do token antes de alterar a câmera.
    setArrastando(null);
    setPosicoesLocais({});
    setMovendoCamera(null);
  };

  const mover = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerPositions.current.has(event.pointerId)) {
      pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    const pinch = pinchGesture.current;
    if (pinch && pointerPositions.current.size === 2 && viewport.current) {
      const [first, second] = [...pointerPositions.current.values()];
      const bounds = viewport.current.getBoundingClientRect();
      const camera = calculatePinchCamera({
        zoom: pinch.zoom,
        pan: pinch.pan,
        startDistance: pinch.distance,
        currentDistance: distanceBetween(first, second),
        initialCenter: pinch.center,
        currentCenter: centerBetween(first, second),
        viewportOrigin: { x: bounds.left, y: bounds.top }
      });
      setZoom(camera.zoom);
      setPan(camera.pan);
      return;
    }
    if (pinch) return;
    if (arrastando) {
      const ponto = pontoNoCanvas(event.clientX, event.clientY);
      if (!ponto) return;
      setPosicoesLocais(atual => ({ ...atual, [arrastando]: ponto }));
      return;
    }

    if (movendoCamera) {
      setPan(atual => ({
        x: atual.x + event.clientX - movendoCamera.x,
        y: atual.y + event.clientY - movendoCamera.y
      }));
      setMovendoCamera({ x: event.clientX, y: event.clientY });
    }
  };

  const finalizarArrasto = () => {
    if (arrastando && posicoesLocais[arrastando]) {
      onAtualizarToken(arrastando, posicoesLocais[arrastando]);
    }
    if (arrastando) {
      setPosicoesLocais(atual => {
        const { [arrastando]: _removida, ...restante } = atual;
        return restante;
      });
    }
    setArrastando(null);
    setMovendoCamera(null);
  };

  const liberarPonteiro = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    pointerPositions.current.delete(event.pointerId);
    if (pinchGesture.current) {
      if (pointerPositions.current.size < 2) pinchGesture.current = null;
      setMovendoCamera(null);
      setArrastando(null);
      return;
    }
    if (cancelled) {
      setArrastando(null);
      setPosicoesLocais({});
      setMovendoCamera(null);
    } else {
      finalizarArrasto();
    }
  };

  const dropActor = (event: React.DragEvent<HTMLDivElement>) => {
    if (!mestre || !mapaAtual) return;
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
      const ponto = pontoNoCanvas(event.clientX, event.clientY);
      if (!ponto) return;

      onAdicionarToken({
        campanhaId,
        mapaId: mapaAtual.id,
        tipo: payload.kind,
        nome: payload.kind === 'personagem' ? payload.name : nextInstanceName(payload.name,
          [...tokensAtuais.filter(t => t.tipo === payload.kind && (t.npcId === payload.id || t.adversaryId === payload.id)).map(t=>t.nome), ...pendingNames.current]),
        imagemUrl: payload.imageUrl || undefined,
        characterId: payload.kind === 'personagem' ? payload.id : undefined,
        npcId: payload.kind === 'npc' ? payload.id : undefined,
        adversaryId: payload.kind === 'adversario' ? payload.id : undefined,
        tokenSize: 1,
        rangeCells: 0,
        hpCurrent: payload.kind === 'npc' ? npcs.find(n=>n.id===payload.id)?.vida : payload.kind === 'adversario' ? adversarios.find(a=>a.id===payload.id)?.vida : undefined,
        hpMax: payload.kind === 'npc' ? Math.max(1,npcs.find(n=>n.id===payload.id)?.vidaMaxima ?? npcs.find(n=>n.id===payload.id)?.vida ?? 1) : payload.kind === 'adversario' ? adversarios.find(a=>a.id===payload.id)?.vidaMaxima : undefined,
        areaRadiusCells: 0,
        cor: cores[payload.kind],
        x: ponto.x,
        y: ponto.y,
        oculto: false
      });
      onActorUsed?.(payload.kind, payload.id);
    } catch {
      // Payload externo/inválido.
    }
  };

  const startActorDrag = (
    event: React.DragEvent,
    payload: { kind: 'personagem' | 'npc' | 'adversario'; id: string; name: string; imageUrl?: string }
  ) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-ro-actor', JSON.stringify(payload));
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
        setAssetError(error.message || 'Não foi possível enviar a imagem.');
      } finally {
        setUploading(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNovaImagem(String(reader.result));
      setNovoStoragePath('');
    };
    reader.readAsDataURL(file);
  };

  const centralizar = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const ajustarToken = (patch: Partial<TokenMapa>) => {
    if (!tokenSelecionado || !podeControlarToken(tokenSelecionado)) return;
    setTokenError('');
    void Promise.resolve(onAtualizarToken(tokenSelecionado.id, patch))
      .catch(err => setTokenError(err instanceof Error ? err.message : 'Não foi possível salvar a alteração.'));
  };

  const mudarPvDaCopia = (delta: number) => {
    if (!mestre || !tokenSelecionado || !tokenLife) return;
    ajustarToken({hpCurrent:addTokenHp(tokenLife.current,tokenLife.max,delta),hpMax:tokenLife.max});
  };

  const duplicarToken = () => {
    if (!mestre || !tokenSelecionado) return;
    const {id: _id, criadoEm: _created, atualizadoEm: _updated, criadoPor: _author, ...draft} = tokenSelecionado;
    const used = tokensAtuais.filter(t => t.tipo === draft.tipo
      && (draft.npcId ? t.npcId === draft.npcId : draft.adversaryId ? t.adversaryId === draft.adversaryId : t.nome.startsWith(draft.nome)))
      .map(t=>t.nome);
    const name = nextInstanceName(draft.nome,[...used,...pendingNames.current]);
    pendingNames.current.add(name);
    onAdicionarToken({...draft,nome:name,
      hpCurrent: draft.tipo === 'npc' || draft.tipo === 'adversario' ? tokenLife?.current : undefined,
      hpMax: draft.tipo === 'npc' || draft.tipo === 'adversario' ? tokenLife?.max : undefined,
      x:clamp(draft.x+4,0,100),y:clamp(draft.y+4,0,100)});
  };

  const criarCirculoNoMapa = (x:number,y:number) => {
    if (!mestre || !mapaAtual) return;
    const name = `Área de efeito ${tokensAtuais.filter(t => (t.areaRadiusCells ?? 0)>0).length+1}`;
    onAdicionarToken({campanhaId,mapaId:mapaAtual.id,tipo:'marcador',nome:name,
      tokenSize:.5,rangeCells:0,areaRadiusCells:areaRadius,cor:areaColor,x,y,oculto:false});
  };

  useEffect(() => {
    setSelecionadoId(null);
    setMarcandoArea(false);
    pendingNames.current.clear();
    centralizar();
  }, [mapaAtual?.id]);

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
      {mestre && (
        <div className="map-stage__library map-stage__library--v4">
          <select value={mapaAtual?.id || ''} onChange={event => onSelecionarMapa(event.target.value)} aria-label="Selecionar mapa">
            <option value="">Selecionar mapa</option>
            {mapas.map(mapa => <option key={mapa.id} value={mapa.id}>{mapa.titulo}</option>)}
          </select>

          {mapaAtual && (
            <>
              <button type="button" onClick={() => onAtualizarMapa(mapaAtual.id, { gradeVisivel: !mapaAtual.gradeVisivel })}>
                <Grid3X3 size={13} /> {mapaAtual.gradeVisivel ? 'Grade ativa' : 'Sem grade'}
              </button>
              <button type="button" title="Diminuir células" onClick={() => onAtualizarMapa(mapaAtual.id, { gridSize: clamp(gridSize - 8, 24, 160) })}><Minus size={13} /></button>
              <span className="map-stage__grid-size">{gridSize}px</span>
              <button type="button" title="Aumentar células" onClick={() => onAtualizarMapa(mapaAtual.id, { gridSize: clamp(gridSize + 8, 24, 160) })}><Plus size={13} /></button>
              <button type="button" onClick={() => onAtualizarMapa(mapaAtual.id, { visibilidade: mapaAtual.visibilidade === 'mestre_privado' ? 'revelado_jogadores' : 'mestre_privado' })}>
                {mapaAtual.visibilidade === 'mestre_privado' ? <Eye size={13} /> : <EyeOff size={13} />}
                {mapaAtual.visibilidade === 'mestre_privado' ? 'Revelar' : 'Ocultar'}
              </button>
            </>
          )}

          {mapaAtual && <div className="map-stage__area-tools">
            <label title="Raio do círculo em células">Raio <input aria-label="Raio da área em casas" type="number" min={1} max={30} value={areaRadius}
              onChange={event=>setAreaRadius(clamp(Math.round(Number(event.target.value)||1),1,30))}/></label>
            <input type="color" aria-label="Cor do círculo de efeito" value={areaColor} onChange={event=>setAreaColor(event.target.value)}/>
            <button type="button" className={marcandoArea?'is-active':''} aria-pressed={marcandoArea}
              onClick={()=>setMarcandoArea(v=>!v)}>{marcandoArea?'Concluir áreas':'Marcar círculo'}</button>
          </div>}
          <button type="button" onClick={centralizar}><Crosshair size={13} /> Centralizar</button>
          <button type="button" onClick={() => viewport.current?.requestFullscreen?.()}><Maximize2 size={13} /></button>
        </div>
      )}

      {mestre && mapaAtual?.visibilidade === 'mestre_privado' && (
        <p className="map-stage__privacy-note" role="status">
          Este mapa está privado. Os jogadores não podem ver seus tokens nem os movimentos até você clicar em Revelar.
        </p>
      )}

      {marcandoArea && mestre && <div className="map-stage__area-hint" role="status">
        Clique ou toque no mapa para marcar círculos de área de efeito. Use “Concluir áreas” para voltar a mover tokens.
      </div>}
      <div
        ref={viewport}
        className={`map-stage__viewport ${marcandoArea ? 'is-placing-area' : ''}`}
        onDragOver={event => {
          if (mestre && mapaAtual) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={dropActor}
        onPointerMove={mover}
        onPointerUp={event => liberarPonteiro(event)}
        onPointerCancel={event => liberarPonteiro(event, true)}
        onPointerLeave={event => {
          if (event.pointerType === 'mouse') finalizarArrasto();
        }}
        onPointerDown={event => {
          if (!(event.target as HTMLElement).closest('.map-stage__token')) {
            if (marcandoArea && mestre && mapaAtual) {
              const pos = pontoNoCanvas(event.clientX,event.clientY);
              if (pos) criarCirculoNoMapa(pos.x,pos.y);
              event.preventDefault();
              return;
            }
            if (event.pointerType === 'touch') {
              registrarToque(event.pointerId, { x: event.clientX, y: event.clientY });
            }
            if (!pinchGesture.current) {
              setSelecionadoId(null);
              setMovendoCamera({ x: event.clientX, y: event.clientY });
            }
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onWheel={event => {
          event.preventDefault();
          setZoom(valor => clamp(valor + (event.deltaY < 0 ? .1 : -.1), .5, 3));
        }}
      >
        {mapaVisivel && mapaAtual ? (
          <div
            ref={canvas}
            className="map-stage__canvas"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <div
              className="map-stage__map-image"
              style={{ backgroundImage: imagemResolvida ? `url("${imagemResolvida}")` : undefined }}
            />
            {mapaAtual.gradeVisivel && (
              <div
                className="map-stage__grid-overlay"
                style={{ backgroundSize: `${gridSize}px ${gridSize}px` }}
              />
            )}
            {!imagemResolvida && <span className="map-stage__placeholder">Adicione uma imagem para transformar este espaço no mapa da cena.</span>}

            {tokensAtuais.map(token => {
              const posicao = posicoesLocais[token.id] || token;
              const tokenSize = clamp(token.tokenSize ?? 1, .5, 4);
              const rangeCells = clamp(token.rangeCells ?? 0, 0, 30);
              const areaRadiusCells = clamp(token.areaRadiusCells ?? 0,0,30);
              const sizePx = gridSize * tokenSize;
              const canControl = podeControlarToken(token);
              const selected = selecionadoId === token.id;

              return (
                <button
                  type="button"
                  key={token.id}
                  className={`map-stage__token token--${token.tipo} ${token.oculto ? 'is-hidden' : ''} ${selected ? 'is-selected' : ''} ${canControl ? 'is-controllable' : ''}`}
                  style={{
                    left: `${posicao.x}%`,
                    top: `${posicao.y}%`,
                    '--token-color': token.cor,
                    '--token-size': `${sizePx}px`,
                    '--range-size': `${Math.max(0, rangeCells * gridSize * 2)}px`,
                    '--area-size': `${areaRadiusCells * gridSize * 2}px`
                  } as React.CSSProperties}
                  onClick={event => {
                    event.stopPropagation();
                    setSelecionadoId(token.id);
                  }}
                  onPointerDown={event => {
                    event.stopPropagation();
                    setSelecionadoId(token.id);
                    if (event.pointerType === 'touch') {
                      registrarToque(event.pointerId, { x: event.clientX, y: event.clientY });
                    }
                    if (!canControl || pinchGesture.current) return;
                    setArrastando(token.id);
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  title={canControl ? `${token.nome} · arraste para mover` : token.nome}
                >
                  {areaRadiusCells > 0 && <span className="map-stage__area-circle"><em>{areaRadiusCells} casas</em></span>}
                  {selected && rangeCells > 0 && <span className="map-stage__range-ring"><em>{rangeCells} casas</em></span>}
                  <span className="map-stage__token-face">
                    {token.imagemUrl
                      ? <AssetImage src={token.imagemUrl} alt="" />
                      : token.nome.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="map-stage__token-name">{token.nome}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="map-stage__empty" role="status">
            {mestre
              ? 'Crie ou selecione um mapa para a cena.'
              : mapaAtualId
                ? 'O Mestre ainda não revelou o mapa ativo. Aguarde para ver e mover seu token.'
                : 'O Mestre ainda não selecionou um mapa para esta cena.'}
          </p>
        )}
      </div>

      {tokenSelecionado && podeControlarToken(tokenSelecionado) && (
        <aside className="map-stage__token-inspector">
          <div className="map-stage__token-inspector-head">
            <div>
              <small>{tokenSelecionado.tipo}</small>
              <strong>{tokenSelecionado.nome}</strong>
            </div>
            <button type="button" onClick={() => setSelecionadoId(null)}>×</button>
          </div>

          {mestre && (tokenSelecionado.tipo === 'npc' || tokenSelecionado.tipo === 'adversario') && tokenLife && (
            <div className="map-stage__token-health">
              <strong>PV desta cópia: {tokenLife.current}/{tokenLife.max}</strong>
              <div>
                <label>Quantidade <input type="number" min={1} max={999} value={hpAmount}
                  onChange={e=>setHpAmount(clamp(Math.round(Number(e.target.value)||1),1,999))}/></label>
                <button type="button" onClick={()=>mudarPvDaCopia(-hpAmount)}>− PV</button>
                <button type="button" onClick={()=>mudarPvDaCopia(hpAmount)}>+ PV</button>
              </div>
              <label>PV máximo <input type="number" min={1} max={99999} value={tokenLife.max}
                onChange={e=>{
                  const hpMax=clamp(Math.round(Number(e.target.value)||1),1,99999);
                  ajustarToken({hpMax,hpCurrent:Math.min(hpMax,tokenLife.current)});
                }}/></label>
              <small>Altera apenas este token; a ficha-base e outras cópias permanecem intactas.</small>
            </div>
          )}
          {mestre && (tokenSelecionado.areaRadiusCells ?? 0) > 0 && (
            <div className="map-stage__token-health">
              <strong>Marcação de área de efeito</strong>
              <label>Nome <input value={tokenSelecionado.nome} maxLength={120}
                onChange={e=>ajustarToken({nome:e.target.value})}/></label>
              <label>Raio (casas) <input type="number" min={1} max={30} value={tokenSelecionado.areaRadiusCells}
                onChange={e=>ajustarToken({areaRadiusCells:clamp(Math.round(Number(e.target.value)||1),1,30)})}/></label>
              <label>Cor <input type="color" value={tokenSelecionado.cor} onChange={e=>ajustarToken({cor:e.target.value})}/></label>
            </div>
          )}
          {tokenError && <p className="map-stage__token-error" role="alert">{tokenError}</p>}
          <div className="map-stage__token-control">
            <span>Tamanho</span>
            <div>
              <button type="button" onClick={() => ajustarToken({ tokenSize: clamp((tokenSelecionado.tokenSize ?? 1) - .25, .5, 4) })}><Minus size={13} /></button>
              <b>{(tokenSelecionado.tokenSize ?? 1).toFixed(2)}×</b>
              <button type="button" onClick={() => ajustarToken({ tokenSize: clamp((tokenSelecionado.tokenSize ?? 1) + .25, .5, 4) })}><Plus size={13} /></button>
            </div>
          </div>

          <div className="map-stage__token-control map-stage__token-control--range">
            <span><Ruler size={13} /> Raio de movimento</span>
            <div className="map-stage__range-presets">
              {[0, 2, 4, 6, 8, 12].map(value => (
                <button
                  type="button"
                  key={value}
                  className={(tokenSelecionado.rangeCells ?? 0) === value ? 'is-active' : ''}
                  onClick={() => ajustarToken({ rangeCells: value })}
                >
                  {value === 0 ? 'Off' : value}
                </button>
              ))}
            </div>
            <label>
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                value={tokenSelecionado.rangeCells ?? 0}
                onChange={event => ajustarToken({ rangeCells: clamp(Number(event.target.value) || 0, 0, 30) })}
              />
              <span>casas</span>
            </label>
          </div>

          {mestre && (
            <div className="map-stage__token-inspector-actions">
              <button type="button" onClick={duplicarToken}><Plus size={13}/> Duplicar cópia</button>
              <button type="button" onClick={() => ajustarToken({ oculto: !tokenSelecionado.oculto })}>
                {tokenSelecionado.oculto ? <Eye size={13} /> : <EyeOff size={13} />}
                {tokenSelecionado.oculto ? 'Revelar' : 'Ocultar'}
              </button>
              <button type="button" className="is-danger" onClick={() => { onRemoverToken(tokenSelecionado.id); setSelecionadoId(null); }}>
                <Trash2 size={13} /> Remover
              </button>
            </div>
          )}
        </aside>
      )}

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
                <span>{personagem.imagemUrl ? <AssetImage src={personagem.imagemUrl} alt="" /> : personagem.nome.slice(0, 2).toUpperCase()}</span>
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
                <span>{npc.imagemUrl ? <AssetImage src={npc.imagemUrl} alt="" /> : npc.nome.slice(0, 2).toUpperCase()}</span>
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
                <span>{adversario.imagemUrl ? <AssetImage src={adversario.imagemUrl} alt="" /> : adversario.nome.slice(0, 2).toUpperCase()}</span>
                <em>{adversario.nome}</em>
              </button>
            ))}
          </div>
        </div>
      )}

      {mestre && (
        <details className="map-stage__setup">
          <summary>Biblioteca e criação rápida</summary>
          <div className="map-stage__setup-body">
            <form onSubmit={criarMapa} className="map-stage__create">
              <input value={novoMapa} onChange={event => setNovoMapa(event.target.value)} placeholder="Nome do novo mapa" />
              <input value={novaImagem} onChange={event => { setNovaImagem(event.target.value); setNovoStoragePath(''); setArquivoNome(''); }} placeholder="URL da imagem, opcional" />
              <label className={`map-stage__file ${novoStoragePath || novaImagem ? 'has-file' : ''}`}>
                <Upload size={14} />
                <strong>{uploading ? 'Enviando imagem…' : arquivoNome || (novoStoragePath ? 'Imagem pronta' : 'Anexar imagem')}</strong>
                <small>{novoStoragePath ? 'Upload concluído' : 'PNG, JPG, WEBP ou GIF · até 15 MB'}</small>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={event => void selecionarArquivo(event.target.files?.[0])} />
              </label>
              <button className="ro-button" disabled={uploading || !novoMapa.trim()}>Criar mapa</button>
              {assetError && <span className="map-stage__asset-error">{assetError}</span>}
            </form>

            {mapaAtual && (
              <>
                <form onSubmit={criarToken} className="map-stage__create map-stage__create--token">
                  <select value={tokenSource} onChange={event => setTokenSource(event.target.value)} aria-label="Origem do token">
                    <option value="manual">Marcador manual</option>
                    {personagens.length > 0 && (
                      <optgroup label="Desvelados dos jogadores">
                        {personagens.map(personagem => <option key={personagem.id} value={`personagem:${personagem.id}`}>{personagem.nome}</option>)}
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
                      <input value={novoToken} onChange={event => setNovoToken(event.target.value)} placeholder="Nome do marcador" />
                      <select value={tipoToken} onChange={event => setTipoToken(event.target.value as TipoTokenMapa)}>
                        <option value="marcador">Marcador</option>
                        <option value="personagem">Personagem manual</option>
                        <option value="npc">NPC manual</option>
                        <option value="adversario">Adversário manual</option>
                      </select>
                    </>
                  )}

                  {tokenSource !== 'manual' && !tokenSource.startsWith('personagem:') && (
                    <label className="map-stage__batch-qty">
                      Cópias <input type="number" min={1} max={12} value={quantidade}
                        onChange={e=>setQuantidade(clamp(Math.round(Number(e.target.value)||1),1,12))}/>
                    </label>
                  )}
                  <button className="ro-button" disabled={tokenSource === 'manual' && !novoToken.trim()}>
                    {tokenSource === 'manual' ? 'Adicionar marcador' : `Colocar ${tokenSource.startsWith('personagem:') ? 1 : quantidade} no mapa`}
                  </button>
                </form>
              </>
            )}
          </div>
        </details>
      )}
    </section>
  );
};
