import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Campanha } from '../types/campaign';
import { Personagem } from '../types/character';
import { Eye, EyeOff, ImagePlus, MapPinned, Minus, Plus, Radio, Save, Sparkles, Trash2, Users } from 'lucide-react';

type GridType = 'quadrada' | 'livre';
type StudioToken = { id: string; nome: string; tipo: 'desvelado' | 'ameaca'; x: number; y: number; cor: string; oculto?: boolean };
type MasterScene = {
  id: string;
  nome: string;
  local: string;
  atmosfera: string;
  direcaoPrivada: string;
  ativa: boolean;
  playersVeem: boolean;
  grid: GridType;
  neblinaAtiva: boolean;
  reveladas: string[];
  imagem?: string;
  tokens: StudioToken[];
};

interface SceneStudioProps { campanha: Campanha; personagens: Personagem[]; }

const KEY_PREFIX = 'reinos_oniricos_scene_studio_v1_';
const GRID = 12;
const cellKey = (x: number, y: number) => `${x}:${y}`;

const initialScene = (personagens: Personagem[]): MasterScene => ({
  id: 'cena-inicial',
  nome: 'Cena sem título',
  local: 'A Vigília',
  atmosfera: 'A realidade parece comum até alguém prestar atenção demais.',
  direcaoPrivada: '',
  ativa: true,
  playersVeem: true,
  grid: 'quadrada',
  neblinaAtiva: false,
  reveladas: [],
  tokens: personagens.map((p, index) => ({
    id: `pj-${p.id}`,
    nome: p.nome,
    tipo: 'desvelado' as const,
    x: 2 + (index % 4) * 2,
    y: 8 + Math.floor(index / 4),
    cor: ['#A88952', '#76B7C5', '#B77B98', '#8EAD72'][index % 4]
  }))
});

export const SceneStudio: React.FC<SceneStudioProps> = ({ campanha, personagens }) => {
  const [cenas, setCenas] = useState<MasterScene[]>([]);
  const [cenaId, setCenaId] = useState('');
  const [tokenSelecionadoId, setTokenSelecionadoId] = useState('');
  const [novaAmeaca, setNovaAmeaca] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY_PREFIX + campanha.id);
      const parsed = stored ? JSON.parse(stored) as MasterScene[] : [initialScene(personagens)];
      setCenas(parsed);
      setCenaId(parsed.find(scene => scene.ativa)?.id || parsed[0]?.id || '');
    } catch {
      const base = [initialScene(personagens)];
      setCenas(base);
      setCenaId(base[0].id);
    }
  }, [campanha.id]);

  useEffect(() => {
    if (cenas.length) localStorage.setItem(KEY_PREFIX + campanha.id, JSON.stringify(cenas));
  }, [cenas, campanha.id]);

  const cena = cenas.find(item => item.id === cenaId) || cenas[0];
  const tokenSelecionado = cena?.tokens.find(token => token.id === tokenSelecionadoId) || cena?.tokens[0];
  const cells = useMemo(() => Array.from({ length: GRID * GRID }, (_, index) => ({ x: index % GRID, y: Math.floor(index / GRID) })), []);

  const updateCena = (partial: Partial<MasterScene>) => setCenas(prev => prev.map(item => item.id === cena.id ? { ...item, ...partial } : item));
  const updateTokens = (fn: (tokens: StudioToken[]) => StudioToken[]) => updateCena({ tokens: fn(cena.tokens) });

  const criarCena = () => {
    const id = `cena-${Date.now()}`;
    const nova: MasterScene = {
      ...initialScene(personagens), id, nome: `Nova Cena ${cenas.length + 1}`, local: 'Local não revelado', ativa: false,
      tokens: personagens.map((p, index) => ({ id: `pj-${p.id}`, nome: p.nome, tipo: 'desvelado' as const, x: 2 + index, y: 8, cor: '#A88952' }))
    };
    setCenas(prev => [...prev, nova]);
    setCenaId(id);
  };

  const ativarCena = () => {
    setCenas(prev => prev.map(item => ({ ...item, ativa: item.id === cena.id })));
  };

  const excluirCena = () => {
    if (cenas.length <= 1) return;
    const remaining = cenas.filter(item => item.id !== cena.id);
    setCenas(remaining);
    setCenaId(remaining.find(item => item.ativa)?.id || remaining[0].id);
  };

  const uploadImagem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => updateCena({ imagem: String(reader.result) });
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const posicionarToken = (x: number, y: number) => {
    if (!tokenSelecionado) return;
    updateTokens(tokens => tokens.map(token => token.id === tokenSelecionado.id ? { ...token, x, y } : token));
  };

  const alternarNeblina = (x: number, y: number) => {
    if (!cena.neblinaAtiva) return;
    const key = cellKey(x, y);
    updateCena({ reveladas: cena.reveladas.includes(key) ? cena.reveladas.filter(item => item !== key) : [...cena.reveladas, key] });
  };

  const adicionarAmeaca = (event: React.FormEvent) => {
    event.preventDefault();
    if (!novaAmeaca.trim()) return;
    const token: StudioToken = { id: `ameaca-${Date.now()}`, nome: novaAmeaca.trim(), tipo: 'ameaca', x: 6, y: 2, cor: '#C75B5B', oculto: false };
    updateTokens(tokens => [...tokens, token]);
    setTokenSelecionadoId(token.id);
    setNovaAmeaca('');
  };

  if (!cena) return null;

  return <div className="grid grid-cols-1 xl:grid-cols-[255px_minmax(0,1fr)_285px] gap-4">
    <aside className="bg-[#171717] border border-[#292929] rounded-sm p-3 space-y-3">
      <div className="flex items-center justify-between"><span className="text-xs font-mono uppercase tracking-widest text-[#A88952]">Cenas</span><button onClick={criarCena} title="Criar cena" className="scene-icon-button"><Plus className="w-4 h-4" /></button></div>
      <div className="space-y-2 max-h-[575px] overflow-y-auto pr-1">
        {cenas.map(item => <button key={item.id} onClick={() => setCenaId(item.id)} className={`w-full text-left p-3 border transition-colors ${item.id === cena.id ? 'bg-[#A88952]/15 border-[#A88952]' : 'bg-[#0B0B0B] border-[#292929] hover:border-[#555]'}`}>
          <span className="text-xs text-[#F5F3EE] font-semibold block truncate">{item.nome}</span>
          <span className="text-[10px] text-[#777] font-mono block truncate mt-0.5">{item.local}</span>
          <span className={`text-[9px] font-mono uppercase mt-2 inline-block ${item.ativa ? 'text-emerald-400' : 'text-[#666]'}`}>{item.ativa ? '● Ao vivo' : '○ Preparada'}</span>
        </button>)}
      </div>
      <button onClick={excluirCena} disabled={cenas.length <= 1} className="w-full text-[11px] text-rose-300 border border-rose-900/60 py-2 disabled:opacity-30 hover:bg-rose-950/20"><Trash2 className="w-3.5 h-3.5 inline mr-1.5" />Excluir cena</button>
    </aside>

    <section className="bg-[#11110f] border border-[#292929] rounded-sm overflow-hidden">
      <header className="p-4 border-b border-[#292929] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><div className="text-[10px] font-mono uppercase tracking-[.18em] text-[#A88952]">Cena ativa da mesa</div><h2 className="font-serif text-2xl text-[#F5F3EE]">{cena.nome}</h2><p className="text-xs text-[#888]">{cena.local} · {cena.atmosfera || 'Sem atmosfera definida'}</p></div>
        <div className="flex gap-2"><button onClick={ativarCena} className="scene-action-primary"><Radio className="w-3.5 h-3.5" />{cena.ativa ? 'Ao vivo' : 'Colocar ao vivo'}</button><button onClick={() => updateCena({ playersVeem: !cena.playersVeem })} title="Visibilidade dos jogadores" className="scene-icon-button">{cena.playersVeem ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button></div>
      </header>
      <div className="p-4">
        <div className="relative aspect-[4/3] bg-[#090909] border border-[#3a3226] overflow-hidden" style={{ backgroundImage: cena.imagem ? `url(${cena.imagem})` : 'radial-gradient(ellipse at 30% 30%, #28231b, #090909 70%)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {cena.grid === 'quadrada' && <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}>{cells.map(cell => {
            const revealed = cena.reveladas.includes(cellKey(cell.x, cell.y));
            return <button key={cellKey(cell.x, cell.y)} onClick={() => cena.neblinaAtiva ? alternarNeblina(cell.x, cell.y) : posicionarToken(cell.x, cell.y)} className={`relative border-r border-b border-black/25 ${cena.neblinaAtiva && !revealed ? 'bg-[#070707]/95 hover:bg-[#1e1915]/90' : 'hover:bg-[#A88952]/10'}`} aria-label={`Célula ${cell.x + 1}, ${cell.y + 1}`} />;
          })}</div>}
          {cena.neblinaAtiva && cena.grid === 'livre' && <div className="absolute inset-0 bg-black/75 grid place-items-center"><span className="text-xs text-[#D9D7D2] bg-black/70 px-3 py-2">Neblina livre ativa — revele áreas usando uma grade.</span></div>}
          {cena.tokens.filter(token => !token.oculto).map(token => <button key={token.id} onClick={() => setTokenSelecionadoId(token.id)} title={token.nome} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 grid place-items-center text-[9px] font-bold shadow-lg ${tokenSelecionado?.id === token.id ? 'border-[#F5F3EE] ring-2 ring-[#A88952]' : 'border-black/70'}`} style={{ left: `${((token.x + .5) / GRID) * 100}%`, top: `${((token.y + .5) / GRID) * 100}%`, background: token.cor, color: '#0B0B0B' }}>{token.tipo === 'ameaca' ? '!' : token.nome.slice(0, 2).toUpperCase()}</button>)}
          {!cena.imagem && <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none"><span className="text-[10px] font-mono text-[#A88952] bg-black/70 px-2 py-1">MAPA NARRATIVO · Adicione uma imagem quando quiser</span></div>}
        </div>
        <p className="mt-3 text-[10px] text-[#777] text-center">{cena.neblinaAtiva ? 'Clique nas células para revelar ou ocultar a área.' : 'Selecione um token e clique na grade para movê-lo.'}</p>
      </div>
    </section>

    <aside className="space-y-4">
      <section className="bg-[#171717] border border-[#292929] rounded-sm p-4 space-y-3"><div className="flex items-center gap-2"><MapPinned className="w-4 h-4 text-[#A88952]" /><h3 className="text-xs font-mono uppercase tracking-widest text-[#F5F3EE]">Configurar cena</h3></div>
        <label className="scene-field"><span>Nome</span><input value={cena.nome} onChange={e => updateCena({ nome: e.target.value })} /></label>
        <label className="scene-field"><span>Local</span><input value={cena.local} onChange={e => updateCena({ local: e.target.value })} /></label>
        <label className="scene-field"><span>Atmosfera pública</span><input value={cena.atmosfera} onChange={e => updateCena({ atmosfera: e.target.value })} placeholder="Chuva, tensão, distorção..." /></label>
        <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={uploadImagem} />
        <button onClick={() => fileInputRef.current?.click()} className="scene-control w-full"><ImagePlus className="w-3.5 h-3.5" />{cena.imagem ? 'Trocar imagem do mapa' : 'Adicionar imagem local'}</button>
        {cena.imagem && <button onClick={() => updateCena({ imagem: undefined })} className="scene-control w-full"><Minus className="w-3.5 h-3.5" />Remover imagem</button>}
      </section>
      <section className="bg-[#171717] border border-[#292929] rounded-sm p-4 space-y-3"><h3 className="text-xs font-mono uppercase tracking-widest text-[#F5F3EE]">Camadas e revelação</h3>
        <button onClick={() => updateCena({ grid: cena.grid === 'quadrada' ? 'livre' : 'quadrada' })} className="scene-control w-full">Grid: {cena.grid === 'quadrada' ? 'quadrada' : 'livre'}</button>
        <button onClick={() => updateCena({ neblinaAtiva: !cena.neblinaAtiva })} className={`scene-control w-full ${cena.neblinaAtiva ? 'border-[#A88952] text-[#A88952]' : ''}`}>{cena.neblinaAtiva ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}Neblina {cena.neblinaAtiva ? 'ativa' : 'desligada'}</button>
        {cena.neblinaAtiva && <button onClick={() => updateCena({ reveladas: cells.map(c => cellKey(c.x, c.y)) })} className="scene-control w-full">Revelar tudo</button>}
        <button onClick={() => updateCena({ reveladas: [] })} className="scene-control w-full">Cobrir tudo</button>
      </section>
      <section className="bg-[#171717] border border-[#292929] rounded-sm p-4 space-y-3"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-[#76B7C5]" /><h3 className="text-xs font-mono uppercase tracking-widest text-[#F5F3EE]">Tokens</h3></div>
        <select value={tokenSelecionado?.id || ''} onChange={e => setTokenSelecionadoId(e.target.value)} className="scene-select">{cena.tokens.map(token => <option key={token.id} value={token.id}>{token.nome} · {token.tipo}</option>)}</select>
        {tokenSelecionado && <button onClick={() => updateTokens(tokens => tokens.map(token => token.id === tokenSelecionado.id ? { ...token, oculto: !token.oculto } : token))} className="scene-control w-full">{tokenSelecionado.oculto ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}{tokenSelecionado.oculto ? 'Revelar token' : 'Ocultar do mapa'}</button>}
        <form onSubmit={adicionarAmeaca} className="flex gap-2"><input className="scene-token-input" value={novaAmeaca} onChange={e => setNovaAmeaca(e.target.value)} placeholder="Nova ameaça..." /><button className="scene-icon-button" title="Adicionar ameaça"><Plus className="w-4 h-4" /></button></form>
      </section>
      <section className="bg-amber-950/20 border border-[#5d4930] rounded-sm p-4"><div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-[#A88952]" /><span className="text-[10px] font-mono uppercase tracking-widest text-[#A88952]">Direção privada</span></div><textarea value={cena.direcaoPrivada} onChange={e => updateCena({ direcaoPrivada: e.target.value })} rows={3} placeholder="Gatilho, consequência ou detalhe que só o Mestre vê..." className="w-full bg-black/35 border border-[#5d4930] p-2 text-xs text-[#D9D7D2] resize-none" /><p className="text-[10px] text-[#988] mt-1">Campo curto de condução, não documentação de campanha.</p></section>
    </aside>
  </div>;
};
