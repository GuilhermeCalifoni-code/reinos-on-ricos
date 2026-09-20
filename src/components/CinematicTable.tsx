import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpenText, ChevronRight, CircleDot, Crosshair, Eye, EyeOff, MapPinned, Maximize2, MessageCircle, Minus, MousePointer2, Plus, Radio, Send, Sparkles, Swords, Users, Zap } from 'lucide-react';
import { Campanha } from '../types/campaign';
import { Personagem } from '../types/character';

type SceneMode = 'tensao' | 'investigacao' | 'exploracao' | 'transicao';
type LogType = 'mestre' | 'narracao' | 'sistema';
type TableLog = { id: string; type: LogType; text: string; time: string; };
type StageToken = { id: string; name: string; kind: 'player' | 'threat'; x: number; y: number; color: string; hidden?: boolean; vida?: number; vidaMaxima?: number; defesa?: number; }; 
type SceneCounter = { id: string; label: string; current: number; max: number; consequence: string; }; 

interface CinematicTableProps {
  campanha: Campanha;
  personagens: Personagem[];
  onAbrirFicha: (personagem: Personagem) => void;
  onAbrirRuptura: (personagem: Personagem, delta: number, motivo: string) => void;
  onAbrirDirecao: () => void;
  onAtualizarPersonagem: (personagem: Personagem) => void;
}

const STORAGE = 'reinos_oniricos_cinematic_table_v1_';
const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const labels: Record<SceneMode, { label: string; hint: string; color: string }> = {
  tensao: { label: 'Cena de Tensão', hint: 'Tempo importa. Ação alternada.', color: 'rose' },
  investigacao: { label: 'Investigação', hint: 'Pistas, perguntas e descobertas.', color: 'cyan' },
  exploracao: { label: 'Exploração', hint: 'O ambiente revela seus sinais.', color: 'gold' },
  transicao: { label: 'Transição', hint: 'A história respira antes da próxima pressão.', color: 'indigo' }
};

export const CinematicTable: React.FC<CinematicTableProps> = ({ campanha, personagens, onAbrirFicha, onAbrirRuptura, onAbrirDirecao, onAtualizarPersonagem }) => {
  const [mode, setMode] = useState<SceneMode>('tensao');
  const [sceneName, setSceneName] = useState('A Vigília está rachando');
  const [location, setLocation] = useState('Local não revelado');
  const [fog, setFog] = useState(false);
  const [logs, setLogs] = useState<TableLog[]>([]);
  const [message, setMessage] = useState('');
  const [tokens, setTokens] = useState<StageToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<'move' | 'ping'>('move');
  const [showMasterLayer, setShowMasterLayer] = useState(true);
  const [pings, setPings] = useState<{ id: string; x: number; y: number; }[]>([]);
  const [projectionOpen, setProjectionOpen] = useState(false);
  const [counters, setCounters] = useState<SceneCounter[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE + campanha.id);
      if (saved) {
        const data = JSON.parse(saved);
        setMode(data.mode || 'tensao'); setSceneName(data.sceneName || sceneName); setLocation(data.location || location);
        setFog(Boolean(data.fog)); setLogs(data.logs || []); setTokens(data.tokens || []); setPings(data.pings || []); setCounters(data.counters || []); return;
      }
    } catch { /* inicia com a cena padrão */ }
    setTokens(personagens.map((p, index) => ({ id: `p-${p.id}`, name: p.nome, kind: 'player' as const, x: 13 + index * 16, y: 76, color: ['#A88952', '#76B7C5', '#B77B98', '#8EAD72'][index % 4] })));
    setLogs([{ id: 'start', type: 'sistema', text: 'Mesa iniciada. O Mestre define o que a Realidade permite mostrar.', time: now() }]);
    setCounters([{ id: 'pressao', label: 'Pressão da Cena', current: 0, max: 4, consequence: 'A Cena reage e a situação se torna mais perigosa.' }]);
  }, [campanha.id]);

  useEffect(() => {
    if (tokens.length || logs.length) localStorage.setItem(STORAGE + campanha.id, JSON.stringify({ mode, sceneName, location, fog, logs, tokens, pings, counters }));
  }, [campanha.id, mode, sceneName, location, fog, logs, tokens, pings, counters]);

  const pendingPlayers = useMemo(() => personagens.filter(p => p.vidaAtual > 0), [personagens]);
  const addLog = (text: string, type: LogType = 'narracao') => {
    if (!text.trim()) return;
    setLogs(previous => [{ id: `${Date.now()}-${Math.random()}`, type, text: text.trim(), time: now() }, ...previous].slice(0, 60));
  };
  const send = (event: React.FormEvent) => { event.preventDefault(); addLog(message, 'mestre'); setMessage(''); };
  const addThreat = () => {
    const id = `t-${Date.now()}`;
    setTokens(current => [...current, { id, name: 'Ameaça desconhecida', kind: 'threat', x: 52, y: 20, color: '#C75B5B', hidden: true, vida: 8, vidaMaxima: 8, defesa: 12 }]);
    setSelectedToken(id); addLog('Uma presença entrou na cena — ainda oculta.', 'sistema');
  };
  const moveSelected = (event: React.MouseEvent<HTMLDivElement>) => {
    const selected = selectedToken || tokens[0]?.id;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((event.clientX - box.left) / box.width) * 100));
    const y = Math.max(6, Math.min(94, ((event.clientY - box.top) / box.height) * 100));
    if (tool === 'ping') {
      const ping = { id: `ping-${Date.now()}`, x, y };
      setPings(current => [...current, ping]);
      window.setTimeout(() => setPings(current => current.filter(item => item.id !== ping.id)), 2500);
      return;
    }
    if (!selected) return;
    setTokens(current => current.map(token => token.id === selected ? { ...token, x, y } : token));
  };
  const selected = tokens.find(token => token.id === selectedToken) || tokens[0];
  const state = labels[mode];
  const ajustarPersonagem = (personagem: Personagem, campo: 'vidaAtual' | 'focoAtual', delta: number) => {
    const max = campo === 'vidaAtual' ? personagem.vidaMaxima : personagem.focoMaximo;
    onAtualizarPersonagem({ ...personagem, [campo]: Math.max(0, Math.min(max, personagem[campo] + delta)), atualizadoEm: new Date().toISOString() });
  };
  const ajustarAmeaca = (delta: number) => {
    if (!selected || selected.kind !== 'threat') return;
    setTokens(current => current.map(token => token.id === selected.id ? { ...token, vida: Math.max(0, Math.min(token.vidaMaxima || 8, (token.vida || 0) + delta)) } : token));
  };
  const ajustarContador = (id: string, delta: number) => setCounters(current => current.map(counter => counter.id === id ? { ...counter, current: Math.max(0, Math.min(counter.max, counter.current + delta)) } : counter));

  const ruptureLevel = Math.max(0, Math.min(6, campanha.rupturaGeral));

  return <div className={`cinematic-table cinematic-table--rupture-${ruptureLevel}`}>
    <header className={`cinematic-header cinematic-header--${state.color}`}>
      <div className="cinematic-header__title"><span className="cinematic-kicker"><Radio className="w-3.5 h-3.5" /> Ao vivo · Sessão {String(campanha.sessaoAtual).padStart(2, '0')}</span><h1>{sceneName}</h1><p><MapPinned className="w-3.5 h-3.5" /> {location}</p></div>
      <div className="cinematic-header__controls"><select value={mode} onChange={event => { const next = event.target.value as SceneMode; setMode(next); addLog(`Estado alterado para ${labels[next].label}.`, 'sistema'); }}><option value="tensao">Cena de Tensão</option><option value="investigacao">Investigação</option><option value="exploracao">Exploração</option><option value="transicao">Transição</option></select><div className={`cinematic-rupture-meter cinematic-rupture-meter--${ruptureLevel}`} title={`Ruptura da Crônica: ${ruptureLevel}/6`}><span>Ruptura</span><div>{Array.from({ length: 6 }, (_, index) => <i key={index} className={index < ruptureLevel ? 'is-filled' : ''} />)}</div></div><button onClick={onAbrirDirecao} className="cinematic-primary"><Swords className="w-3.5 h-3.5" /> Direção completa</button></div>
    </header>

    <div className="cinematic-grid">
      <aside className="cinematic-panel cinematic-journal">
        <div className="cinematic-panel__head"><div><span className="cinematic-label">Mesa</span><h2><MessageCircle className="w-4 h-4" /> Diário vivo</h2></div><span>{logs.length}</span></div>
        <div className="cinematic-journal__feed">{logs.map(log => <article key={log.id} className={`cinematic-log cinematic-log--${log.type}`}><div><span>{log.type === 'mestre' ? 'Mestre' : log.type === 'sistema' ? 'Sistema' : 'Narrativa'}</span><time>{log.time}</time></div><p>{log.text}</p></article>)}</div>
        <form onSubmit={send} className="cinematic-journal__form"><input value={message} onChange={event => setMessage(event.target.value)} placeholder="Narrar, avisar ou registrar..." /><button title="Enviar anúncio"><Send className="w-4 h-4" /></button></form>
      </aside>

      <main className="cinematic-stage-wrap">
        <div className="cinematic-stage-meta"><div><span className={`cinematic-mode cinematic-mode--${state.color}`}>{state.label}</span><p>{state.hint}</p></div><div className="cinematic-map-tools"><button onClick={() => setTool(tool === 'move' ? 'ping' : 'move')} className={tool === 'ping' ? 'is-active' : ''} title="Alternar entre mover token e marcar ponto">{tool === 'ping' ? <CircleDot className="w-3.5 h-3.5" /> : <MousePointer2 className="w-3.5 h-3.5" />}{tool === 'ping' ? 'Ping' : 'Mover'}</button><button onClick={() => setShowMasterLayer(!showMasterLayer)} className={showMasterLayer ? 'is-active' : ''} title="Exibir camada privada do Mestre">{showMasterLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}Mestre</button><button onClick={() => setFog(!fog)} className={fog ? 'is-active' : ''}>{fog ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}{fog ? 'Neblina' : 'Visível'}</button><button onClick={() => setProjectionOpen(true)} title="Abrir modo de projeção"><Maximize2 className="w-3.5 h-3.5" /> Projetar</button></div></div>
        <div className={`cinematic-stage cinematic-stage--${state.color} ${fog ? 'cinematic-stage--fog' : ''}`} onClick={moveSelected}>
          <div className="cinematic-stage__world" style={{ transform: `scale(${zoom})` }}><div className="cinematic-stage__rings" /><div className="cinematic-stage__grid" />
          {tokens.filter(token => (!token.hidden || showMasterLayer) && (token.kind === 'player' || showMasterLayer)).map(token => <button key={token.id} onClick={event => { event.stopPropagation(); setSelectedToken(token.id); }} className={`cinematic-token cinematic-token--${token.kind} ${token.hidden ? 'is-private' : ''} ${selected?.id === token.id ? 'is-selected' : ''}`} style={{ left: `${token.x}%`, top: `${token.y}%`, '--token-color': token.color } as React.CSSProperties}>{token.kind === 'threat' ? <Crosshair className="w-3.5 h-3.5" /> : token.name.slice(0, 2).toUpperCase()}<span>{token.name}</span></button>)}
          {pings.map(ping => <span key={ping.id} className="cinematic-ping" style={{ left: `${ping.x}%`, top: `${ping.y}%` }} />)}</div>
          <div className="cinematic-stage__caption"><Sparkles className="w-3.5 h-3.5" /> {tool === 'ping' ? 'Clique para chamar atenção da mesa' : 'Clique para posicionar o token selecionado'}</div><div className="cinematic-zoom"><button onClick={() => setZoom(value => Math.max(.75, Number((value - .1).toFixed(2))))}><Minus className="w-3.5 h-3.5" /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(value => Math.min(1.35, Number((value + .1).toFixed(2))))}><Plus className="w-3.5 h-3.5" /></button></div>
        </div>
        <div className="cinematic-quickbar"><button onClick={() => addLog('A pressão avança. Algo reage às escolhas dos Desvelados.', 'narracao')}><Zap className="w-3.5 h-3.5" /> Avançar pressão</button><button onClick={() => addLog('Um detalhe impossível se torna perceptível.', 'narracao')}><Sparkles className="w-3.5 h-3.5" /> Revelar sinal</button><button onClick={addThreat}><Crosshair className="w-3.5 h-3.5" /> Adicionar ameaça</button></div>
      </main>

      <aside className="cinematic-panel cinematic-command">
        <div className="cinematic-panel__head"><div><span className="cinematic-label">Comando</span><h2><Users className="w-4 h-4" /> Desvelados</h2></div><span>{pendingPlayers.length}</span></div>
        <div className="cinematic-party">{personagens.map(personagem => <article key={personagem.id} className="cinematic-party-card"><button onClick={() => onAbrirFicha(personagem)} className="cinematic-party-card__main"><span className="cinematic-avatar">{personagem.nome.slice(0, 2).toUpperCase()}</span><span><strong>{personagem.nome}</strong><small>V {personagem.vidaAtual}/{personagem.vidaMaxima} · F {personagem.focoAtual}/{personagem.focoMaximo}</small></span><ChevronRight className="w-3.5 h-3.5" /></button><div className="cinematic-party-card__actions"><span className={personagem.ruptura >= 4 ? 'is-critical' : ''}>Ruptura {personagem.ruptura}/6</span><div className="cinematic-resource-adjust"><span>V</span><button onClick={() => ajustarPersonagem(personagem, 'vidaAtual', -1)}>−</button><strong>{personagem.vidaAtual}</strong><button onClick={() => ajustarPersonagem(personagem, 'vidaAtual', 1)}>+</button><span>F</span><button onClick={() => ajustarPersonagem(personagem, 'focoAtual', -1)}>−</button><strong>{personagem.focoAtual}</strong><button onClick={() => ajustarPersonagem(personagem, 'focoAtual', 1)}>+</button><button onClick={() => onAbrirRuptura(personagem, 1, 'Ajuste durante a Cena de Tensão')} title="Ajustar Ruptura"><Bell className="w-3.5 h-3.5" /></button></div></div></article>)}</div>
        <div className="cinematic-token-control"><span className="cinematic-label">Token selecionado</span>{selected ? <><strong>{selected.name}</strong>{selected.kind === 'threat' && <div className="cinematic-threat-state"><span>Vida</span><button onClick={() => ajustarAmeaca(-1)}>−</button><strong>{selected.vida}/{selected.vidaMaxima}</strong><button onClick={() => ajustarAmeaca(1)}>+</button><span>DEF {selected.defesa || 12}</span></div>}<div><button onClick={() => setTokens(current => current.map(token => token.id === selected.id ? { ...token, hidden: !token.hidden } : token))}>{selected.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}{selected.hidden ? 'Revelar' : 'Ocultar'}</button><button onClick={() => setTokens(current => current.filter(token => token.id !== selected.id))}>Remover</button></div></> : <p>Selecione um token no palco.</p>}</div>
        <section className="cinematic-counters"><div className="cinematic-counters__head"><span className="cinematic-label">Pressão</span><Zap className="w-3.5 h-3.5" /></div>{counters.map(counter => <div key={counter.id} className="cinematic-counter"><div><strong>{counter.label}</strong><small>{counter.consequence}</small></div><div className="cinematic-counter__dial" style={{ '--counter-progress': `${(counter.current / counter.max) * 360}deg` } as React.CSSProperties}><span>{counter.current}/{counter.max}</span></div><div className="cinematic-counter__actions"><button onClick={() => ajustarContador(counter.id, -1)}>−</button><button onClick={() => ajustarContador(counter.id, 1)}>+1</button></div></div>)}</section>
        <button onClick={onAbrirDirecao} className="cinematic-director-link"><BookOpenText className="w-4 h-4" /> Abrir ações, contadores e antagonistas</button>
      </aside>
    </div>
    {projectionOpen && <div className={`projection-mode projection-mode--${state.color}`}><div className="projection-mode__top"><div><span>REINOS ONÍRICOS · AO VIVO</span><h1>{sceneName}</h1><p><MapPinned className="w-4 h-4" /> {location} · {state.label}</p></div><button onClick={() => setProjectionOpen(false)}>Sair da projeção</button></div><div className={`projection-mode__stage ${fog ? 'is-fogged' : ''}`}><div className="projection-mode__grid" />{tokens.filter(token => !token.hidden && token.kind === 'player').map(token => <div key={token.id} className="projection-mode__token" style={{ left: `${token.x}%`, top: `${token.y}%`, '--token-color': token.color } as React.CSSProperties}>{token.name.slice(0, 2).toUpperCase()}<span>{token.name}</span></div>)}{pings.map(ping => <span key={ping.id} className="cinematic-ping" style={{ left: `${ping.x}%`, top: `${ping.y}%` }} />)}</div><p className="projection-mode__hint">{state.hint}</p></div>}
  </div>;
};
