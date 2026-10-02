import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, BookOpenText, Crosshair, Crown, Eye, Grid3X3, Map, MessageSquare,
  Minus, Plus, Radio, Send, Sparkles, Swords, Users, X
} from 'lucide-react';
import { Campanha } from '../types/campaign';
import { Personagem } from '../types/character';
import { MasterPanel } from './MasterPanel';
import { SceneStudio } from './SceneStudio';
import { CinematicTable } from './CinematicTable';

type MasterTab = 'sessao' | 'conduzir' | 'cenas' | 'mapa' | 'mesa' | 'desvelados';
type JournalKind = 'anuncio' | 'rolagem' | 'narracao' | 'sistema';

interface MapToken {
  id: string;
  nome: string;
  tipo: 'desvelado' | 'ameaca';
  x: number;
  y: number;
  cor: string;
}

interface JournalEntry {
  id: string;
  tipo: JournalKind;
  texto: string;
  criadoEm: string;
}

interface MasterCommandCenterProps {
  campanha: Campanha;
  personagens: Personagem[];
  onAtualizarPersonagem: (personagem: Personagem) => void;
  onAbrirModalRupturaPara: (personagem: Personagem, delta: number, motivo: string) => void;
  onAbrirFichaPersonagem: (personagem: Personagem) => void;
}

const GRID_SIZE = 10;
const JOURNAL_STORAGE_PREFIX = 'reinos_oniricos_mestre_journal_v1_';
const MAP_STORAGE_PREFIX = 'reinos_oniricos_mestre_map_v1_';

const timeNow = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const MasterCommandCenter: React.FC<MasterCommandCenterProps> = ({
  campanha,
  personagens,
  onAtualizarPersonagem,
  onAbrirModalRupturaPara,
  onAbrirFichaPersonagem
}) => {
  const [tabAtiva, setTabAtiva] = useState<MasterTab>('sessao');
  const [personagemEmFocoId, setPersonagemEmFocoId] = useState<string>(personagens[0]?.id || '');
  const [mensagem, setMensagem] = useState('');
  const [novoToken, setNovoToken] = useState('');
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [tokens, setTokens] = useState<MapToken[]>([]);

  const personagemEmFoco = personagens.find(p => p.id === personagemEmFocoId) || personagens[0] || null;

  useEffect(() => {
    setPersonagemEmFocoId(atual => personagens.some(p => p.id === atual) ? atual : (personagens[0]?.id || ''));
  }, [personagens]);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(JOURNAL_STORAGE_PREFIX + campanha.id);
      setJournal(salvo ? JSON.parse(salvo) : [{
        id: 'inicio-' + campanha.id,
        tipo: 'sistema',
        texto: 'Mesa aberta. O Mestre está no comando da cena.',
        criadoEm: timeNow()
      }]);
    } catch {
      setJournal([]);
    }

    try {
      const salvo = localStorage.getItem(MAP_STORAGE_PREFIX + campanha.id);
      if (salvo) {
        setTokens(JSON.parse(salvo));
      } else {
        setTokens(personagens.map((p, index) => ({
          id: 'pj-' + p.id,
          nome: p.nome,
          tipo: 'desvelado' as const,
          x: 1 + (index % 4) * 2,
          y: 7 + Math.floor(index / 4),
          cor: ['#A88952', '#76B7C5', '#B77B98', '#8EAD72'][index % 4]
        })));
      }
    } catch {
      setTokens([]);
    }
  }, [campanha.id]);

  useEffect(() => {
    localStorage.setItem(JOURNAL_STORAGE_PREFIX + campanha.id, JSON.stringify(journal));
  }, [journal, campanha.id]);

  useEffect(() => {
    localStorage.setItem(MAP_STORAGE_PREFIX + campanha.id, JSON.stringify(tokens));
  }, [tokens, campanha.id]);

  const adicionarJournal = (texto: string, tipo: JournalKind = 'narracao') => {
    const limpo = texto.trim();
    if (!limpo) return;
    setJournal(prev => [{ id: 'j-' + Date.now(), tipo, texto: limpo, criadoEm: timeNow() }, ...prev].slice(0, 80));
  };

  const enviarMensagem = (e: React.FormEvent) => {
    e.preventDefault();
    adicionarJournal(mensagem, 'anuncio');
    setMensagem('');
  };

  const moverToken = (id: string, dx: number, dy: number) => {
    setTokens(prev => prev.map(token => token.id === id ? {
      ...token,
      x: Math.max(0, Math.min(GRID_SIZE - 1, token.x + dx)),
      y: Math.max(0, Math.min(GRID_SIZE - 1, token.y + dy))
    } : token));
  };

  const adicionarAmeaca = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = novoToken.trim();
    if (!nome) return;
    setTokens(prev => [...prev, {
      id: 'ameaca-' + Date.now(),
      nome,
      tipo: 'ameaca',
      x: 5,
      y: 2,
      cor: '#C75B5B'
    }]);
    adicionarJournal(`${nome} entrou na cena.`, 'sistema');
    setNovoToken('');
  };

  const removerToken = (token: MapToken) => {
    setTokens(prev => prev.filter(item => item.id !== token.id));
    adicionarJournal(`${token.nome} saiu do mapa tático.`, 'sistema');
  };

  const cells = useMemo(() => Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
    x: index % GRID_SIZE,
    y: Math.floor(index / GRID_SIZE)
  })), []);

  const abas: { id: MasterTab; label: string; icon: React.ElementType; descricao: string }[] = [
    { id: 'sessao', label: 'Sessão', icon: Radio, descricao: 'Mesa cinematográfica' },
    { id: 'conduzir', label: 'Conduzir', icon: Crown, descricao: 'Cena e decisões' },
    { id: 'cenas', label: 'Cenas', icon: Sparkles, descricao: 'Mapa e revelação' },
    { id: 'mapa', label: 'Mapa', icon: Map, descricao: 'Posição e ameaça' },
    { id: 'mesa', label: 'Mesa', icon: MessageSquare, descricao: 'Diário da sessão' },
    { id: 'desvelados', label: 'Desvelados', icon: Users, descricao: 'Fichas rápidas' }
  ];

  return (
    <div className="ro-master-shell space-y-5 pb-16">
      <section className="ro-hero border border-[var(--ro-line-strong)] bg-[radial-gradient(ellipse_at_top_left,_rgba(168,137,82,0.14),_transparent_40%),#11110f] rounded-sm overflow-hidden">
        <div className="px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[var(--ro-line)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[var(--ro-copper)] text-[var(--ro-on-accent)] grid place-items-center"><Crown className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ro-copper)]">Central do Mestre</div>
              <h1 className="font-serif text-2xl text-[var(--ro-paper)]">{campanha.nome}</h1>
              <p className="text-[11px] text-[var(--ro-ash)] font-mono">Operação de mesa · sem documentação pesada</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="ro-stat px-2.5 py-1.5 border border-[var(--ro-line-strong)] bg-black/30 text-[var(--ro-paper-muted)]">Sessão {String(campanha.sessaoAtual).padStart(2, '0')}</span>
            <span className="ro-stat px-2.5 py-1.5 border border-[var(--ro-line-strong)] bg-black/30 text-[var(--ro-paper-muted)]">{personagens.length} Desvelados</span>
            <span className="ro-stat ro-stat--rupture px-2.5 py-1.5 border border-[#5e332d] bg-rose-950/20 text-rose-300">Ruptura da crônica: {campanha.rupturaGeral}/6</span>
          </div>
        </div>
        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
          {abas.map(({ id, label, descricao, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTabAtiva(id)} className={`ro-nav-tab flex items-center gap-2.5 px-3 py-2.5 text-left rounded-sm transition-colors ${tabAtiva === id ? 'bg-[var(--ro-copper)] text-[var(--ro-on-accent)]' : 'text-[#AFAAA0] hover:bg-[#24231f]'}`}>
              <Icon className="w-4 h-4" />
              <span><span className="block text-xs font-semibold">{label}</span><span className="block text-[10px] opacity-70">{descricao}</span></span>
            </button>
          ))}
        </div>
      </section>

      {tabAtiva === 'sessao' && <CinematicTable campanha={campanha} personagens={personagens} onAbrirFicha={onAbrirFichaPersonagem} onAbrirRuptura={onAbrirModalRupturaPara} onAbrirDirecao={() => setTabAtiva('conduzir')} onAtualizarPersonagem={onAtualizarPersonagem} />}

      {tabAtiva === 'conduzir' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <button type="button" onClick={() => { setTabAtiva('mapa'); adicionarJournal('Mapa tático aberto pelo Mestre.', 'sistema'); }} className="text-left bg-[var(--ro-surface)] border border-[var(--ro-line)] hover:border-[var(--ro-line-strong)]/70 p-4 rounded-sm transition-colors">
              <Grid3X3 className="w-4 h-4 text-[var(--ro-copper)] mb-2" /><div className="text-sm text-[var(--ro-paper)] font-semibold">Abrir mapa</div><p className="text-[11px] text-[var(--ro-ash)] mt-1">Posicione Desvelados e ameaças sem poluir a cena.</p>
            </button>
            <button type="button" onClick={() => setTabAtiva('desvelados')} className="text-left bg-[var(--ro-surface)] border border-[var(--ro-line)] hover:border-[var(--ro-line-strong)]/70 p-4 rounded-sm transition-colors">
              <Eye className="w-4 h-4 text-[#76B7C5] mb-2" /><div className="text-sm text-[var(--ro-paper)] font-semibold">Consultar fichas</div><p className="text-[11px] text-[var(--ro-ash)] mt-1">Vida, Defesa, Ruptura, Foco e Domínios à vista.</p>
            </button>
            <button type="button" onClick={() => setTabAtiva('mesa')} className="text-left bg-[var(--ro-surface)] border border-[var(--ro-line)] hover:border-[var(--ro-line-strong)]/70 p-4 rounded-sm transition-colors">
              <Radio className="w-4 h-4 text-rose-300 mb-2" /><div className="text-sm text-[var(--ro-paper)] font-semibold">Falar com a mesa</div><p className="text-[11px] text-[var(--ro-ash)] mt-1">Anúncios e registro de acontecimentos da sessão.</p>
            </button>
          </div>
          <MasterPanel personagens={personagens} onAtualizarPersonagem={onAtualizarPersonagem} onAbrirModalRupturaPara={onAbrirModalRupturaPara} />
        </>
      )}

      {tabAtiva === 'cenas' && <SceneStudio campanha={campanha} personagens={personagens} />}

      {tabAtiva === 'mapa' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
          <section className="bg-[#11110f] border border-[var(--ro-line)] rounded-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div><h2 className="font-serif text-xl text-[var(--ro-paper)]">Mapa tático da cena</h2><p className="text-[11px] text-[var(--ro-ash)]">Quadro visual leve para distância, movimento e presença.</p></div>
              <span className="text-[10px] font-mono px-2 py-1 border border-[var(--ro-line-strong)] text-[var(--ro-copper)]">10 × 10 · local nesta mesa</span>
            </div>
            <div className="relative aspect-square max-w-[680px] mx-auto bg-[var(--ro-bg)] border border-[var(--ro-line-strong)] overflow-hidden" style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
              {cells.map(cell => <button key={`${cell.x}-${cell.y}`} type="button" onClick={() => {
                const selecionado = tokens.find(token => token.id === `pj-${personagemEmFoco?.id}`) || tokens[0];
                if (selecionado) setTokens(prev => prev.map(token => token.id === selecionado.id ? { ...token, x: cell.x, y: cell.y } : token));
              }} className="border-r border-b border-[#27241f] hover:bg-[var(--ro-copper)]/10 transition-colors" aria-label={`Posição ${cell.x + 1}, ${cell.y + 1}`} />)}
              {tokens.map(token => <div key={token.id} title={`${token.nome} · ${token.tipo}`} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${((token.x + .5) / GRID_SIZE) * 100}%`, top: `${((token.y + .5) / GRID_SIZE) * 100}%` }}>
                <div className="w-8 h-8 rounded-full border-2 border-[#F5F3EE] shadow-lg grid place-items-center text-[9px] font-bold text-[var(--ro-on-accent)]" style={{ backgroundColor: token.cor }}>{token.tipo === 'ameaca' ? <Crosshair className="w-3.5 h-3.5" /> : token.nome.slice(0, 2).toUpperCase()}</div>
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[9px] bg-black/85 px-1.5 py-0.5 text-[var(--ro-paper-muted)] opacity-0 group-hover:opacity-100">{token.nome}</span>
              </div>)}
            </div>
            <p className="mt-3 text-[10px] text-[#666] text-center">Clique em uma célula para mover o Desvelado selecionado. Use as setas ao lado para ajuste preciso.</p>
          </section>
          <aside className="space-y-4">
            <section className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-4 rounded-sm">
              <h3 className="text-xs uppercase tracking-widest font-mono text-[var(--ro-copper)] mb-3">Entidades no mapa</h3>
              <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                {tokens.map(token => <div key={token.id} className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-2.5">
                  <div className="flex justify-between gap-2"><span className="text-xs text-[var(--ro-paper)] font-semibold">{token.nome}</span><button onClick={() => removerToken(token)} className="text-[#666] hover:text-rose-300"><X className="w-3.5 h-3.5" /></button></div>
                  <div className="flex items-center gap-1.5 mt-2"><button onClick={() => moverToken(token.id, -1, 0)} className="map-control">←</button><button onClick={() => moverToken(token.id, 0, -1)} className="map-control">↑</button><button onClick={() => moverToken(token.id, 0, 1)} className="map-control">↓</button><button onClick={() => moverToken(token.id, 1, 0)} className="map-control">→</button><span className="ml-auto text-[10px] font-mono text-[var(--ro-ash)]">{token.x + 1}:{token.y + 1}</span></div>
                </div>)}
              </div>
              <form onSubmit={adicionarAmeaca} className="flex gap-2 mt-3"><input value={novoToken} onChange={e => setNovoToken(e.target.value)} placeholder="Nova ameaça..." className="min-w-0 flex-1 bg-[var(--ro-bg)] border border-[var(--ro-line)] px-2 py-1.5 text-xs text-[var(--ro-paper)]" /><button className="px-2 bg-[var(--ro-copper)] text-[var(--ro-on-accent)]"><Plus className="w-4 h-4" /></button></form>
            </section>
          </aside>
        </div>
      )}

      {tabAtiva === 'mesa' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_310px] gap-5">
          <section className="bg-[var(--ro-surface)] border border-[var(--ro-line)] rounded-sm p-5 min-h-[520px] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--ro-line)] pb-3"><div><h2 className="font-serif text-xl text-[var(--ro-paper)]">Diário da mesa</h2><p className="text-[11px] text-[var(--ro-ash)]">Anúncios do Mestre e acontecimentos essenciais. Sem virar um documento de campanha.</p></div><BookOpenText className="w-5 h-5 text-[var(--ro-copper)]" /></div>
            <div className="flex-1 space-y-2 overflow-y-auto py-4 max-h-[440px]">{journal.length === 0 ? <p className="text-[#666] text-xs text-center pt-12">Nenhum registro nesta sessão.</p> : journal.map(item => <article key={item.id} className={`p-3 border-l-2 ${item.tipo === 'anuncio' ? 'bg-[var(--ro-copper)]/10 border-[var(--ro-line-strong)]' : item.tipo === 'sistema' ? 'bg-slate-950 border-slate-600' : 'bg-[var(--ro-bg)] border-[var(--ro-line-strong)]'}`}><div className="flex justify-between gap-3 text-[10px] font-mono uppercase tracking-wider text-[var(--ro-ash)]"><span>{item.tipo === 'anuncio' ? 'Mestre para a mesa' : item.tipo}</span><time>{item.criadoEm}</time></div><p className="text-sm text-[var(--ro-paper-muted)] mt-1.5 leading-relaxed">{item.texto}</p></article>)}</div>
            <form onSubmit={enviarMensagem} className="pt-3 border-t border-[var(--ro-line)] flex gap-2"><input value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Narrar, avisar ou registrar algo para a mesa..." className="min-w-0 flex-1 bg-[var(--ro-bg)] border border-[var(--ro-line-strong)] px-3 py-2 text-sm text-[var(--ro-paper)] focus:outline-none focus:border-[var(--ro-line-strong)]" /><button className="bg-[var(--ro-copper)] text-[var(--ro-on-accent)] px-3" title="Enviar anúncio"><Send className="w-4 h-4" /></button></form>
          </section>
          <aside className="space-y-3"><section className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-4"><h3 className="text-xs font-mono uppercase tracking-widest text-[var(--ro-copper)] mb-3">Atalhos de direção</h3><div className="space-y-2"><button onClick={() => adicionarJournal('A cena muda. Observem o que a Realidade deixou escapar.', 'narracao')} className="quick-journal">Mover a ficção</button><button onClick={() => adicionarJournal('Um sinal de Ruptura atravessa a cena.', 'narracao')} className="quick-journal">Sinal de Ruptura</button><button onClick={() => adicionarJournal('O relógio avança. Uma consequência se aproxima.', 'sistema')} className="quick-journal">Avançar pressão</button></div></section><section className="bg-amber-950/20 border border-[#5d4930] p-4 text-[11px] text-[#CFC4AD]"><Bell className="w-4 h-4 text-[var(--ro-copper)] mb-2" />Este diário é local no protótipo atual. Ao conectar a mesa em tempo real, anúncios e rolagens podem ser exibidos para todos automaticamente.</section></aside>
        </div>
      )}

      {tabAtiva === 'desvelados' && (
        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5">
          <aside className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-3 rounded-sm space-y-2">{personagens.map(p => <button key={p.id} onClick={() => setPersonagemEmFocoId(p.id)} className={`w-full text-left p-3 border transition-colors ${personagemEmFoco?.id === p.id ? 'bg-[var(--ro-copper)]/15 border-[var(--ro-line-strong)] text-[var(--ro-paper)]' : 'bg-[var(--ro-bg)] border-[var(--ro-line)] text-[#AFAAA0] hover:border-[#555]'}`}><span className="block text-sm font-semibold">{p.nome}</span><span className="text-[10px] font-mono">{p.conceito} · Nv. {p.nivel} · V {p.vidaAtual}/{p.vidaMaxima}</span></button>)}</aside>
          {personagemEmFoco && <section className="bg-[var(--ro-surface)] border border-[var(--ro-line)] rounded-sm overflow-hidden"><header className="p-5 border-b border-[var(--ro-line)] flex flex-wrap justify-between gap-3"><div><div className="text-[10px] font-mono uppercase tracking-widest text-[var(--ro-copper)]">Ficha de mesa</div><h2 className="font-serif text-3xl text-[var(--ro-paper)]">{personagemEmFoco.nome}</h2><p className="text-sm text-[#888]">{personagemEmFoco.conceito} · Nível {personagemEmFoco.nivel}</p></div><button onClick={() => onAbrirFichaPersonagem(personagemEmFoco)} className="px-3 py-2 border border-[var(--ro-line-strong)] text-[var(--ro-copper)] text-xs hover:bg-[var(--ro-copper)] hover:text-[var(--ro-on-accent)]">Abrir ficha completa</button></header><div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">{[['Vida', `${personagemEmFoco.vidaAtual}/${personagemEmFoco.vidaMaxima}`, 'rose'], ['Defesa', personagemEmFoco.defesa, 'cyan'], ['Foco', `${personagemEmFoco.focoAtual}/${personagemEmFoco.focoMaximo}`, 'amber'], ['Ruptura', `${personagemEmFoco.ruptura}/6`, 'purple']].map(([label, value, cor]) => <div key={String(label)} className="p-3 bg-[var(--ro-bg)] border border-[var(--ro-line)]"><span className="text-[10px] uppercase font-mono text-[var(--ro-ash)]">{label}</span><strong className={`block text-2xl mt-1 text-${cor}-300`}>{value}</strong></div>)}</div><div className="px-5 pb-5 grid lg:grid-cols-2 gap-4"><div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-4"><h3 className="text-xs font-mono uppercase tracking-widest text-[var(--ro-copper)] mb-3">Atributos</h3><div className="grid grid-cols-2 gap-2">{Object.entries(personagemEmFoco.atributos).map(([nome, valor]) => <div key={nome} className="flex justify-between text-sm text-[var(--ro-paper-muted)]"><span className="capitalize">{nome}</span><strong>{valor >= 0 ? '+' : ''}{valor}</strong></div>)}</div></div><div className="bg-[var(--ro-bg)] border border-[var(--ro-line)] p-4"><h3 className="text-xs font-mono uppercase tracking-widest text-[var(--ro-copper)] mb-3">Domínios</h3><div className="grid grid-cols-2 gap-2">{Object.entries(personagemEmFoco.dominios).map(([nome, nivel]) => <div key={nome} className="flex justify-between text-sm text-[var(--ro-paper-muted)]"><span className="capitalize">{nome}</span><strong>Nível {nivel}</strong></div>)}</div></div></div><footer className="px-5 pb-5 flex flex-wrap gap-2"><button onClick={() => onAbrirModalRupturaPara(personagemEmFoco, 1, 'Ajuste pelo Mestre')} className="px-3 py-2 text-xs bg-rose-950/40 border border-rose-900 text-rose-200 hover:bg-rose-900/60">Ajustar Ruptura</button><button onClick={() => onAtualizarPersonagem({ ...personagemEmFoco, vidaAtual: Math.min(personagemEmFoco.vidaMaxima, personagemEmFoco.vidaAtual + 1) })} className="px-3 py-2 text-xs border border-[var(--ro-line)] text-[var(--ro-paper-muted)] hover:bg-[var(--ro-surface-raised)]">+1 Vida</button><button onClick={() => onAtualizarPersonagem({ ...personagemEmFoco, vidaAtual: Math.max(0, personagemEmFoco.vidaAtual - 1) })} className="px-3 py-2 text-xs border border-[var(--ro-line)] text-[var(--ro-paper-muted)] hover:bg-[var(--ro-surface-raised)]">−1 Vida</button></footer></section>}
        </div>
      )}
    </div>
  );
};
