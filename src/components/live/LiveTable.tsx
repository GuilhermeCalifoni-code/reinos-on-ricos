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
import { useCampaignRealtime } from '../../features/realtime/useCampaignRealtime';

interface LiveTableProps {
  campanha: Campanha; personagens: Personagem[]; role: UserRole; personagemJogadorId?: string; userId?: string; userName?: string; registroOnline: boolean; onVoltar: () => void;
  onAtualizarPersonagem: (personagem: Personagem) => void; onAbrirRuptura: (personagem: Personagem, delta: number, motivo: string) => void; onAbrirFicha: (personagem: Personagem) => void;
  contadores: Contador[]; onAdicionarContador: (contador: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarContador: (id: string, parcial: Partial<Contador>) => void; onRemoverContador: (id: string) => void; onDuplicarContador: (id: string) => void;
  mapas: MapaNarrativo[]; onAdicionarMapa: (mapa: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarMapa: (id: string, parcial: Partial<MapaNarrativo>) => void; onRemoverMapa: (id: string) => void;
  tokensMapa: TokenMapa[]; onAdicionarTokenMapa: (token: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarTokenMapa: (id: string, parcial: Partial<TokenMapa>) => void; onRemoverTokenMapa: (id: string) => void;
}

export const LiveTable: React.FC<LiveTableProps> = (props) => {
  const { campanha, personagens, role, personagemJogadorId, userId, userName, registroOnline, onVoltar, onAtualizarPersonagem, onAbrirRuptura, onAbrirFicha, contadores, onAdicionarContador, onAtualizarContador, onRemoverContador, onDuplicarContador, mapas, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, tokensMapa, onAdicionarTokenMapa, onAtualizarTokenMapa, onRemoverTokenMapa } = props;
  const mestre = role === 'mestre';
  const personagensVisiveis = useMemo(() => mestre ? personagens : personagens.filter(p => p.id === personagemJogadorId), [mestre, personagemJogadorId, personagens]);
  const [selecionadoId, setSelecionadoId] = useState(personagensVisiveis[0]?.id || personagens[0]?.id || '');
  const [ferramenta, setFerramenta] = useState<LiveTool>('nenhuma');
  const [conteudoLocal, setConteudoLocal] = useState<ConteudoDeCena>('ambientacao');
  const [mapaLocalId, setMapaLocalId] = useState<string | undefined>();
  const contadoresDaCampanha = useMemo(() => contadores.filter(item => item.campanhaId === campanha.id), [campanha.id, contadores]);
  const mapasDaCampanha = useMemo(() => mapas.filter(item => item.campanhaId === campanha.id), [campanha.id, mapas]);
  const tokensDaCampanha = useMemo(() => tokensMapa.filter(item => item.campanhaId === campanha.id), [campanha.id, tokensMapa]);
  const realtime = useCampaignRealtime({ campaignId: campanha.id, userId, userName, role, enabled: registroOnline, fallback: { counters: contadoresDaCampanha, maps: mapasDaCampanha, tokens: tokensDaCampanha }, onCharacterUpdate: update => { const personagem = personagens.find(item => item.id === update.id); if (personagem) onAtualizarPersonagem({ ...personagem, vidaAtual: update.vidaAtual, focoAtual: update.focoAtual, ruptura: update.ruptura, protecaoOniricaAtual: update.protecaoOniricaAtual, atualizadoEm: update.updatedAt }); } });
  const compartilhando = registroOnline && realtime.ready;
  const contadoresAtuais = compartilhando ? realtime.counters : contadoresDaCampanha;
  const mapasAtuais = compartilhando ? realtime.maps : mapasDaCampanha;
  const tokensAtuais = compartilhando ? realtime.tokens : tokensDaCampanha;
  const conteudo = compartilhando && realtime.state ? realtime.state.contentType : conteudoLocal;
  const mapaAtualId = compartilhando && realtime.state?.activeMapId ? realtime.state.activeMapId : mapaLocalId;
  const selecionado = personagens.find(p => p.id === selecionadoId) || personagensVisiveis[0] || null;
  const registro = useSessionEvents({ campaignId: campanha.id, userId, role, enabled: registroOnline, characterId: personagemJogadorId });
  const registrarSemFalhar = (event: Parameters<typeof registro.registrar>[0]) => { void registro.registrar(event).catch(() => undefined); };

  useEffect(() => { if (!mapaAtualId && mapasAtuais[0]) setMapaLocalId(mapasAtuais[0].id); }, [mapaAtualId, mapasAtuais]);
  const selecionarFerramenta = (proxima: LiveTool) => setFerramenta(atual => atual === proxima ? 'nenhuma' : proxima);
  const salvarEstado = (patch: { contentType?: ConteudoDeCena; activeMapId?: string }) => { if (compartilhando && mestre) void realtime.saveState({ ...realtime.state, ...patch, ruptureGeneral: campanha.rupturaGeral }).catch(() => undefined); };
  const mudarConteudo = (proximo: ConteudoDeCena) => { setConteudoLocal(proximo); salvarEstado({ contentType: proximo }); };
  const selecionarMapa = (id: string) => { setMapaLocalId(id); salvarEstado({ activeMapId: id, contentType: 'mapa' }); };
  const atualizarPersonagemMesa = (personagem: Personagem) => { onAtualizarPersonagem(personagem); if (compartilhando && personagem.campaignId === campanha.id) void realtime.patchCharacterResources(personagem.id, { vidaAtual: personagem.vidaAtual, focoAtual: personagem.focoAtual, ruptura: personagem.ruptura, protecaoOniricaAtual: personagem.protecaoOniricaAtual }).catch(() => undefined); };
  const ajustar = (personagem: Personagem, campo: 'vidaAtual' | 'focoAtual', delta: number) => { const maximo = campo === 'vidaAtual' ? personagem.vidaMaxima : personagem.focoMaximo; atualizarPersonagemMesa({ ...personagem, [campo]: Math.max(0, Math.min(maximo, personagem[campo] + delta)), atualizadoEm: new Date().toISOString() }); if (campo === 'vidaAtual') registrarSemFalhar(sessionEventFactories.damage(personagem.id, personagem.nome, delta)); };
  const adicionarContador = (item: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => { if (compartilhando) void realtime.addCounter(item).catch(() => undefined); else onAdicionarContador(item); };
  const atualizarContador = (id: string, patch: Partial<Contador>) => { if (compartilhando) void realtime.patchCounter(id, patch).catch(() => undefined); else onAtualizarContador(id, patch); };
  const removerContador = (id: string) => { if (compartilhando) void realtime.removeCounter(id).catch(() => undefined); else onRemoverContador(id); };
  const duplicarContador = (id: string) => { if (!compartilhando) return onDuplicarContador(id); const original = contadoresAtuais.find(item => item.id === id); if (original) { const { id: _id, criadoEm: _criado, atualizadoEm: _atualizado, ...draft } = original; void realtime.addCounter({ ...draft, nome: `${draft.nome} (cópia)` }).catch(() => undefined); } };
  const adicionarMapa = (item: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => { if (compartilhando) void realtime.addMap(item).then(mapa => { setMapaLocalId(mapa.id); salvarEstado({ activeMapId: mapa.id, contentType: 'mapa' }); registrarSemFalhar(sessionEventFactories.map(`Mapa criado: ${mapa.titulo}.`)); }).catch(() => undefined); else { onAdicionarMapa(item); setConteudoLocal('mapa'); registrarSemFalhar(sessionEventFactories.map(`Mapa criado: ${item.titulo}.`)); } };
  const atualizarMapa = (id: string, patch: Partial<MapaNarrativo>) => { if (compartilhando) void realtime.patchMap(id, patch).catch(() => undefined); else onAtualizarMapa(id, patch); };
  const removerMapa = (id: string) => { const mapa = mapasAtuais.find(item => item.id === id); if (compartilhando) void realtime.removeMap(id).then(() => { if (mapaAtualId === id) salvarEstado({ activeMapId: undefined }); if (mapa) registrarSemFalhar(sessionEventFactories.map(`Mapa removido: ${mapa.titulo}.`)); }).catch(() => undefined); else { onRemoverMapa(id); if (mapaAtualId === id) setMapaLocalId(undefined); if (mapa) registrarSemFalhar(sessionEventFactories.map(`Mapa removido: ${mapa.titulo}.`)); } };
  const adicionarToken = (item: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => { if (compartilhando) void realtime.addToken(item).catch(() => undefined); else onAdicionarTokenMapa(item); };
  const atualizarToken = (id: string, patch: Partial<TokenMapa>) => { if (compartilhando) void realtime.patchToken(id, patch).catch(() => undefined); else onAtualizarTokenMapa(id, patch); };
  const removerToken = (id: string) => { if (compartilhando) void realtime.removeToken(id).catch(() => undefined); else onRemoverTokenMapa(id); };
  const statusTexto = !registroOnline ? 'Local' : realtime.status === 'connected' ? 'Sincronizado' : realtime.status === 'connecting' ? 'Conectando' : 'Offline';
  const cena = <SceneStage campanha={campanha} mestre={mestre} conteudo={conteudo} onMudarConteudo={mudarConteudo} mapas={mapasAtuais} tokensMapa={tokensAtuais} mapaAtualId={mapaAtualId} onSelecionarMapa={selecionarMapa} onAdicionarMapa={adicionarMapa} onAtualizarMapa={atualizarMapa} onRemoverMapa={removerMapa} onAdicionarToken={adicionarToken} onAtualizarToken={atualizarToken} onRemoverToken={removerToken} onRegistrarEvento={registrarSemFalhar} />;
  return <section className="live-table">
    <header className="live-table__bar"><button onClick={onVoltar} className="live-table__back">← Campanha</button><div className="min-w-0 text-center"><p className="ro-eyebrow">{campanha.nome}</p><h1>Sessão {String(campanha.sessaoAtual).padStart(2, '0')}</h1>{registroOnline && <small className="live-table__presence">{realtime.presence.length ? realtime.presence.map(item => `● ${item.name}`).join(' · ') : 'Conectando participantes…'}</small>}</div><span className={`live-table__live is-${realtime.status}`}><i /> {statusTexto}</span></header>
    {realtime.error && <p className="live-table__sync-error">Mesa remota indisponível: {realtime.error}</p>}
    <div className="live-table__grid"><PartyPanel personagens={personagensVisiveis} selecionadoId={selecionado?.id || ''} mestre={mestre} onSelecionar={setSelecionadoId} onAjustar={ajustar} onRuptura={(personagem) => onAbrirRuptura(personagem, 1, 'Ajuste na Mesa Ao Vivo')} />{cena}<SessionPanel contadores={contadoresAtuais} mestre={mestre} role={role} enabled={registroOnline} events={registro.events} loading={registro.loading} error={registro.error} onSend={registro.registrar} /></div>
    <LiveDock ferramenta={ferramenta} onSelecionar={selecionarFerramenta} />
    {ferramenta !== 'nenhuma' && <section className="live-table__tool">
      {ferramenta === 'dados' && <DiceRoller personagemAtivo={selecionado} onSalvarPersonagem={atualizarPersonagemMesa} onAbrirModalRuptura={(delta, motivo) => selecionado && onAbrirRuptura(selecionado, delta, motivo)} onRegistrarRolagem={registrarSemFalhar} />}
      {ferramenta === 'sonhar' && <DreamGuide personagemAtivo={selecionado} onIrParaRoladorOnirico={() => setFerramenta('dados')} />}
      {ferramenta === 'ficha' && (selecionado ? <div className="live-table__quick-sheet"><p className="ro-eyebrow">Ficha rápida</p><h2>{selecionado.nome}</h2><p>Defesa {selecionado.defesa} · Resistência {selecionado.resistencia}</p><button onClick={() => onAbrirFicha(selecionado)} className="ro-button mt-4">Abrir ficha completa</button></div> : <p className="live-table__empty">Selecione um personagem.</p>)}
      {ferramenta === 'contadores' && <CounterPanel campanhaId={campanha.id} contadores={contadoresAtuais} mestre={mestre} onAdicionar={adicionarContador} onAtualizar={atualizarContador} onRemover={removerContador} onDuplicar={duplicarContador} onRegistrarEvento={registrarSemFalhar} />}
      {ferramenta === 'mapa' && conteudo !== 'mapa' && cena}
      {ferramenta === 'regras' && <RulesReference />}
    </section>}
  </section>;
};
