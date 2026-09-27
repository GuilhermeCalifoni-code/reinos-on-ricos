import React, { useRef, useState } from 'react';
import { MapaNarrativo, TipoTokenMapa, TokenMapa } from '../../types/campaign';

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
  const [novoToken, setNovoToken] = useState('');
  const [tipoToken, setTipoToken] = useState<TipoTokenMapa>('marcador');
  const criarMapa = (event: React.FormEvent) => { event.preventDefault(); if (!novoMapa.trim()) return; onAdicionarMapa({ campanhaId, titulo: novoMapa.trim(), imagemUrl: novaImagem.trim() || undefined, visibilidade: 'revelado_jogadores', gradeVisivel: false }); setNovoMapa(''); setNovaImagem(''); };
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
  const selecionarArquivo = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setNovaImagem(String(reader.result)); reader.readAsDataURL(file); };
  const fullscreen = () => viewport.current?.requestFullscreen?.();
  return (
    <section className="map-stage">
      <header className="map-stage__head"><div><p className="ro-eyebrow">Mapa narrativo</p><h2>{mapaAtual?.titulo || 'Nenhum mapa selecionado'}</h2></div>{mestre && <div className="map-stage__tools"><button onClick={() => setZoom(valor => Math.max(.6, valor - .1))}>−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(valor => Math.min(2, valor + .1))}>+</button><button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Resetar</button><button onClick={fullscreen}>Tela cheia</button></div>}</header>
      {mestre && <div className="map-stage__library"><label>Mapa</label><select value={mapaAtual?.id || ''} onChange={(e) => onSelecionarMapa(e.target.value)}><option value="">Selecionar mapa</option>{mapas.map(mapa => <option key={mapa.id} value={mapa.id}>{mapa.titulo}</option>)}</select>{mapaAtual && <button onClick={() => onAtualizarMapa(mapaAtual.id, { gradeVisivel: !mapaAtual.gradeVisivel })}>{mapaAtual.gradeVisivel ? 'Ocultar grade' : 'Exibir grade'}</button>}{mapaAtual && <button onClick={() => onAtualizarMapa(mapaAtual.id, { visibilidade: mapaAtual.visibilidade === 'mestre_privado' ? 'revelado_jogadores' : 'mestre_privado' })}>{mapaAtual.visibilidade === 'mestre_privado' ? 'Revelar mapa' : 'Ocultar mapa'}</button>}{mapaAtual && <button onClick={() => onRemoverMapa(mapaAtual.id)} className="is-danger">Excluir mapa</button>}</div>}
      {mestre && <form onSubmit={criarMapa} className="map-stage__create"><input value={novoMapa} onChange={(e) => setNovoMapa(e.target.value)} placeholder="Nome do novo mapa" /><input value={novaImagem} onChange={(e) => setNovaImagem(e.target.value)} placeholder="URL da imagem, opcional" /><label className="map-stage__file">Imagem<input type="file" accept="image/*" onChange={(e) => selecionarArquivo(e.target.files?.[0])} /></label><button className="ro-button">Criar mapa</button></form>}
      <div ref={viewport} className={`map-stage__viewport ${mapaAtual?.gradeVisivel ? 'has-grid' : ''}`} onPointerMove={mover} onPointerUp={finalizarArrasto} onPointerLeave={finalizarArrasto} onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('.map-stage__token')) setMovendoCamera({ x: e.clientX, y: e.clientY }); }} onWheel={(e) => { e.preventDefault(); setZoom(valor => Math.max(.6, Math.min(2, valor + (e.deltaY < 0 ? .1 : -.1)))); }}>
        {mapaVisivel && mapaAtual ? <div className="map-stage__canvas" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, backgroundImage: mapaAtual.imagemUrl ? `url(${mapaAtual.imagemUrl})` : undefined }}>
          {!mapaAtual.imagemUrl && <span className="map-stage__placeholder">Imagem opcional · use este espaço como mapa abstrato ou cenário</span>}
          {tokensAtuais.map(token => { const posicao = posicoesLocais[token.id] || token; return <button key={token.id} className={`map-stage__token token--${token.tipo} ${token.oculto ? 'is-hidden' : ''}`} style={{ left: `${posicao.x}%`, top: `${posicao.y}%`, '--token-color': token.cor } as React.CSSProperties} onPointerDown={(e) => { if (!mestre) return; e.stopPropagation(); setArrastando(token.id); (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId); }} onDoubleClick={() => mestre && onAtualizarToken(token.id, { nome: window.prompt('Nome do token', token.nome) || token.nome })} title={mestre ? `${token.nome} · arraste para mover · duplo clique para renomear` : token.nome}>{token.nome.slice(0, 2).toUpperCase()}</button>; })}
        </div> : <p className="map-stage__empty">{mestre ? 'O Mestre pode criar um mapa e escolher uma imagem para a cena.' : 'O mapa desta cena ainda não foi revelado.'}</p>}
      </div>
      {mestre && mapaAtual && <><form onSubmit={criarToken} className="map-stage__create map-stage__create--token"><input value={novoToken} onChange={(e) => setNovoToken(e.target.value)} placeholder="Nome do token" /><select value={tipoToken} onChange={(e) => setTipoToken(e.target.value as TipoTokenMapa)}><option value="personagem">Personagem</option><option value="npc">NPC</option><option value="adversario">Adversário</option><option value="marcador">Marcador</option></select><button className="ro-button">Adicionar token</button></form><div className="map-stage__tokens">{tokens.filter(token => token.mapaId === mapaAtual.id).map(token => <div key={token.id}><span style={{ background: token.cor }} /> <strong>{token.nome}</strong><button onClick={() => onAtualizarToken(token.id, { oculto: !token.oculto })}>{token.oculto ? 'Revelar' : 'Ocultar'}</button><button onClick={() => onRemoverToken(token.id)} className="is-danger">Remover</button></div>)}</div></>}
    </section>
  );
};
