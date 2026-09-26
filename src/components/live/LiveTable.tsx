import React, { useEffect, useMemo, useState } from 'react';
import { Personagem } from '../../types/character';
import { Campanha, Contador, ConteudoDeCena, MapaNarrativo, TokenMapa } from '../../types/campaign';
import { UserRole } from '../../types/auth';
import { DiceRoller } from '../DiceRoller';
import { DreamGuide } from '../DreamGuide';
import { RulesReference } from '../RulesReference';
import { CounterPanel } from './CounterPanel';
import { LiveDock, LiveTool } from './LiveDock';
import { PartyPanel } from './PartyPanel';
import { SceneStage } from './SceneStage';
import { SessionPanel } from './SessionPanel';
import { useSessionEvents } from '../../services/session-events/useSessionEvents';
import { sessionEventFactories } from '../../services/session-events/sessionEventFactories';

interface LiveTableProps {
  campanha: Campanha; personagens: Personagem[]; role: UserRole; personagemJogadorId?: string; userId?: string; registroOnline: boolean; onVoltar: () => void;
  onAtualizarPersonagem: (personagem: Personagem) => void; onAbrirRuptura: (personagem: Personagem, delta: number, motivo: string) => void; onAbrirFicha: (personagem: Personagem) => void;
  contadores: Contador[]; onAdicionarContador: (contador: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarContador: (id: string, parcial: Partial<Contador>) => void; onRemoverContador: (id: string) => void; onDuplicarContador: (id: string) => void;
  mapas: MapaNarrativo[]; onAdicionarMapa: (mapa: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarMapa: (id: string, parcial: Partial<MapaNarrativo>) => void; onRemoverMapa: (id: string) => void;
  tokensMapa: TokenMapa[]; onAdicionarTokenMapa: (token: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarTokenMapa: (id: string, parcial: Partial<TokenMapa>) => void; onRemoverTokenMapa: (id: string) => void;
}

export const LiveTable: React.FC<LiveTableProps> = (props) => {
  const { campanha, personagens, role, personagemJogadorId, userId, registroOnline, onVoltar, onAtualizarPersonagem, onAbrirRuptura, onAbrirFicha, contadores, onAdicionarContador, onAtualizarContador, onRemoverContador, onDuplicarContador, mapas, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, tokensMapa, onAdicionarTokenMapa, onAtualizarTokenMapa, onRemoverTokenMapa } = props;
  const mestre = role === 'mestre';
  const personagensVisiveis = useMemo(() => mestre ? personagens : personagens.filter(p => p.id === personagemJogadorId), [mestre, personagemJogadorId, personagens]);
  const [selecionadoId, setSelecionadoId] = useState(personagensVisiveis[0]?.id || personagens[0]?.id || '');
  const [ferramenta, setFerramenta] = useState<LiveTool>('nenhuma');
  const [conteudo, setConteudo] = useState<ConteudoDeCena>('ambientacao');
  const [mapaAtualId, setMapaAtualId] = useState<string | undefined>();
  const selecionado = personagens.find(p => p.id === selecionadoId) || personagensVisiveis[0] || null;
  const contadoresDaCampanha = contadores.filter(contador => contador.campanhaId === campanha.id);
  const mapasDaCampanha = mapas.filter(mapa => mapa.campanhaId === campanha.id);
  const tokensDaCampanha = tokensMapa.filter(token => token.campanhaId === campanha.id);
  const registro = useSessionEvents({ campaignId: campanha.id, userId, role, enabled: registroOnline, characterId: personagemJogadorId });
  const registrarSemFalhar = (event: Parameters<typeof registro.registrar>[0]) => { void registro.registrar(event).catch(() => undefined); };

  useEffect(() => { if (!mapaAtualId && mapasDaCampanha[0]) setMapaAtualId(mapasDaCampanha[0].id); }, [mapaAtualId, mapasDaCampanha]);
  const selecionarFerramenta = (proxima: LiveTool) => setFerramenta(atual => atual === proxima ? 'nenhuma' : proxima);
  const ajustar = (personagem: Personagem, campo: 'vidaAtual' | 'focoAtual', delta: number) => { const maximo = campo === 'vidaAtual' ? personagem.vidaMaxima : personagem.focoMaximo; onAtualizarPersonagem({ ...personagem, [campo]: Math.max(0, Math.min(maximo, personagem[campo] + delta)), atualizadoEm: new Date().toISOString() }); if (campo === 'vidaAtual') registrarSemFalhar(sessionEventFactories.damage(personagem.id, personagem.nome, delta)); };

  return <section className="live-table">
    <header className="live-table__bar"><button onClick={onVoltar} className="live-table__back">← Campanha</button><div className="min-w-0 text-center"><p className="ro-eyebrow">{campanha.nome}</p><h1>Sessão {String(campanha.sessaoAtual).padStart(2, '0')}</h1></div><span className="live-table__live"><i /> Ao vivo</span></header>
    <div className="live-table__grid">
      <PartyPanel personagens={personagensVisiveis} selecionadoId={selecionado?.id || ''} mestre={mestre} onSelecionar={setSelecionadoId} onAjustar={ajustar} onRuptura={(personagem) => onAbrirRuptura(personagem, 1, 'Ajuste na Mesa Ao Vivo')} />
      <SceneStage campanha={campanha} mestre={mestre} conteudo={conteudo} onMudarConteudo={setConteudo} mapas={mapasDaCampanha} tokensMapa={tokensDaCampanha} mapaAtualId={mapaAtualId} onSelecionarMapa={setMapaAtualId} onAdicionarMapa={(mapa) => { onAdicionarMapa(mapa); setConteudo('mapa'); }} onAtualizarMapa={onAtualizarMapa} onRemoverMapa={(id) => { onRemoverMapa(id); if (mapaAtualId === id) setMapaAtualId(undefined); }} onAdicionarToken={onAdicionarTokenMapa} onAtualizarToken={onAtualizarTokenMapa} onRemoverToken={onRemoverTokenMapa} onRegistrarEvento={registrarSemFalhar} />
      <SessionPanel contadores={contadoresDaCampanha} mestre={mestre} role={role} enabled={registroOnline} events={registro.events} loading={registro.loading} error={registro.error} onSend={registro.registrar} />
    </div>
    <LiveDock ferramenta={ferramenta} onSelecionar={selecionarFerramenta} />
    {ferramenta !== 'nenhuma' && <section className="live-table__tool">
      {ferramenta === 'dados' && <DiceRoller personagemAtivo={selecionado} onSalvarPersonagem={onAtualizarPersonagem} onAbrirModalRuptura={(delta, motivo) => selecionado && onAbrirRuptura(selecionado, delta, motivo)} onRegistrarRolagem={registrarSemFalhar} />}
      {ferramenta === 'sonhar' && <DreamGuide personagemAtivo={selecionado} onIrParaRoladorOnirico={() => setFerramenta('dados')} />}
      {ferramenta === 'ficha' && (selecionado ? <div className="live-table__quick-sheet"><p className="ro-eyebrow">Ficha rápida</p><h2>{selecionado.nome}</h2><p>Defesa {selecionado.defesa} · Resistência {selecionado.resistencia}</p><button onClick={() => onAbrirFicha(selecionado)} className="ro-button mt-4">Abrir ficha completa</button></div> : <p className="live-table__empty">Selecione um personagem.</p>)}
      {ferramenta === 'contadores' && <CounterPanel campanhaId={campanha.id} contadores={contadoresDaCampanha} mestre={mestre} onAdicionar={onAdicionarContador} onAtualizar={onAtualizarContador} onRemover={onRemoverContador} onDuplicar={onDuplicarContador} onRegistrarEvento={registrarSemFalhar} />}
      {ferramenta === 'mapa' && conteudo !== 'mapa' && <SceneStage campanha={campanha} mestre={mestre} conteudo="mapa" onMudarConteudo={setConteudo} mapas={mapasDaCampanha} tokensMapa={tokensDaCampanha} mapaAtualId={mapaAtualId} onSelecionarMapa={setMapaAtualId} onAdicionarMapa={(mapa) => { onAdicionarMapa(mapa); setConteudo('mapa'); }} onAtualizarMapa={onAtualizarMapa} onRemoverMapa={onRemoverMapa} onAdicionarToken={onAdicionarTokenMapa} onAtualizarToken={onAtualizarTokenMapa} onRemoverToken={onRemoverTokenMapa} onRegistrarEvento={registrarSemFalhar} />}
      {ferramenta === 'regras' && <RulesReference />}
    </section>}
  </section>;
};
