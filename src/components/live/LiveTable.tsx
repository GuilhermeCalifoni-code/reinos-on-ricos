import React, { useEffect, useMemo, useState } from 'react';
import { Personagem } from '../../types/character';
import { Adversario, Campanha, Contador, ConteudoDeCena, MapaNarrativo, MembroCampanha, NPC, TokenMapa } from '../../types/campaign';
import { UserRole } from '../../types/auth';
import { DiceRoller } from '../DiceRoller';
import { DreamGuide } from '../DreamGuide';
import { RulesReference } from '../RulesReference';
import { CounterPanel } from './CounterPanel';
import { LiveDock, LiveTool } from './LiveDock';
import { SceneStage } from './SceneStage';
import { SessionPanel } from './SessionPanel';
import { MapStage } from './MapStage';
import { useSessionEvents } from '../../services/session-events/useSessionEvents';
import { sessionEventFactories } from '../../services/session-events/sessionEventFactories';
import { useCampaignRealtime } from '../../features/realtime/useCampaignRealtime';
import { AssetImage } from '../system/AssetImage';
import { LiveActorsPanel } from './LiveActorsPanel';
import { ArrowLeft, FileText, Image as ImageIcon, Map as MapIcon, MessageSquareText, Moon, Radio, Users } from 'lucide-react';

interface LiveTableProps {
  campanha: Campanha; personagens: Personagem[]; npcs: NPC[]; adversarios: Adversario[]; role: UserRole; personagemJogadorId?: string; userId?: string; userName?: string; sessionId?: string; sessionTitle?: string; sessionDescription?: string; members?: MembroCampanha[]; registroOnline: boolean; onVoltar: () => void;
  onAtualizarPersonagem: (personagem: Personagem) => void; onAbrirRuptura: (personagem: Personagem, delta: number, motivo: string) => void; onAbrirFicha: (personagem: Personagem) => void;
  contadores: Contador[]; onAdicionarContador: (contador: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarContador: (id: string, parcial: Partial<Contador>) => void; onRemoverContador: (id: string) => void; onDuplicarContador: (id: string) => void;
  mapas: MapaNarrativo[]; onAdicionarMapa: (mapa: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarMapa: (id: string, parcial: Partial<MapaNarrativo>) => void; onRemoverMapa: (id: string) => void;
  tokensMapa: TokenMapa[]; onAdicionarTokenMapa: (token: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarTokenMapa: (id: string, parcial: Partial<TokenMapa>) => void; onRemoverTokenMapa: (id: string) => void;
}

export const LiveTable: React.FC<LiveTableProps> = (props) => {
  const { campanha, personagens, npcs, adversarios, role, personagemJogadorId, userId, userName, sessionId, sessionTitle, sessionDescription, members = [], registroOnline, onVoltar, onAtualizarPersonagem, onAbrirRuptura, onAbrirFicha, contadores, onAdicionarContador, onAtualizarContador, onRemoverContador, onDuplicarContador, mapas, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, tokensMapa, onAdicionarTokenMapa, onAtualizarTokenMapa, onRemoverTokenMapa } = props;
  const mestre = role === 'mestre';
  const personagensVisiveis = useMemo(() => mestre ? personagens : personagens.filter(p => p.id === personagemJogadorId), [mestre, personagemJogadorId, personagens]);
  const [selecionadoId, setSelecionadoId] = useState(personagensVisiveis[0]?.id || personagens[0]?.id || '');
  const [ferramenta, setFerramenta] = useState<LiveTool>('nenhuma');
  const [conteudoLocal, setConteudoLocal] = useState<ConteudoDeCena>('ambientacao');
  const [mapaLocalId, setMapaLocalId] = useState<string | undefined>();
  const [sceneCopyLocal, setSceneCopyLocal] = useState({
    title: sessionTitle || 'A cidade contém a respiração',
    description: sessionDescription || 'Ambientação da cena. O Mestre pode preparar imagem, mapa ou handout para esta área.'
  });
  const [partyOpen, setPartyOpen] = useState(true);
  const [sessionOpen, setSessionOpen] = useState(true);
  const [cinematic, setCinematic] = useState(false);
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
  const sceneTitle = compartilhando && typeof realtime.state?.metadata?.sceneTitle === 'string'
    ? realtime.state.metadata.sceneTitle
    : sceneCopyLocal.title;
  const sceneDescription = compartilhando && typeof realtime.state?.metadata?.sceneDescription === 'string'
    ? realtime.state.metadata.sceneDescription
    : sceneCopyLocal.description;
  const sceneImageUrl = compartilhando && typeof realtime.state?.metadata?.sceneImageUrl === 'string'
    ? realtime.state.metadata.sceneImageUrl
    : '';
  const effectiveSessionId = sessionId || realtime.state?.sessionId;
  const selecionado = personagens.find(p => p.id === selecionadoId) || personagensVisiveis[0] || null;
  const registro = useSessionEvents({ campaignId: campanha.id, sessionId: effectiveSessionId, userId, enabled: registroOnline, characterId: personagemJogadorId });
  const registrarSemFalhar = (event: Parameters<typeof registro.registrar>[0]) => { void registro.registrar(event).catch(() => undefined); };

  useEffect(() => { if (!mapaAtualId && mapasAtuais[0]) setMapaLocalId(mapasAtuais[0].id); }, [mapaAtualId, mapasAtuais]);
  useEffect(() => {
    if (!compartilhando || !mestre || !sessionId || realtime.state?.sessionId === sessionId) return;
    void realtime.saveState({
      ...realtime.state,
      sessionId,
      contentType: realtime.state?.contentType || conteudoLocal,
      ruptureGeneral: realtime.state?.ruptureGeneral ?? campanha.rupturaGeral,
      metadata: realtime.state?.metadata || {}
    }).catch(() => undefined);
  }, [campanha.rupturaGeral, compartilhando, conteudoLocal, mestre, realtime.state, sessionId]);
  useEffect(() => {
    if (compartilhando && realtime.state?.sessionId === effectiveSessionId) return;
    setSceneCopyLocal({
      title: sessionTitle || 'A cidade contém a respiração',
      description: sessionDescription || 'Ambientação da cena. O Mestre pode preparar imagem, mapa ou handout para esta área.'
    });
  }, [compartilhando, effectiveSessionId, realtime.state?.sessionId, sessionDescription, sessionTitle]);
  const selecionarFerramenta = (proxima: LiveTool) => setFerramenta(atual => atual === proxima ? 'nenhuma' : proxima);
  const salvarEstado = (patch: { contentType?: ConteudoDeCena; activeMapId?: string; metadata?: Record<string, unknown> }) => { if (compartilhando && mestre) void realtime.saveState({ ...realtime.state, ...patch, sessionId: effectiveSessionId, ruptureGeneral: campanha.rupturaGeral }).catch(() => undefined); };
  const mudarConteudo = (proximo: ConteudoDeCena) => { setConteudoLocal(proximo); salvarEstado({ contentType: proximo }); };
  const selecionarMapa = (id: string) => { setMapaLocalId(id); salvarEstado({ activeMapId: id, contentType: 'mapa' }); };
  const atualizarTextoCena = (title: string, description: string) => {
    setSceneCopyLocal({ title, description });
    salvarEstado({ metadata: { ...(realtime.state?.metadata || {}), sceneTitle: title, sceneDescription: description } });
    registrarSemFalhar({ type: 'scene_change', content: `Cena atualizada: ${title}.`, metadata: { sceneTitle: title } });
  };
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
  const stageConteudo: ConteudoDeCena = conteudo === 'mapa' ? 'ambientacao' : conteudo;
  const cena = <SceneStage campanha={campanha} mestre={mestre} conteudo={stageConteudo} title={sceneTitle} description={sceneDescription} imageUrl={sceneImageUrl} onAtualizarTexto={atualizarTextoCena} onMudarConteudo={mudarConteudo} mapas={mapasAtuais} tokensMapa={tokensAtuais} mapaAtualId={mapaAtualId} onSelecionarMapa={selecionarMapa} onAdicionarMapa={adicionarMapa} onAtualizarMapa={atualizarMapa} onRemoverMapa={removerMapa} onAdicionarToken={adicionarToken} onAtualizarToken={atualizarToken} onRemoverToken={removerToken} onRegistrarEvento={registrarSemFalhar} />;
  const mapaCena = <MapStage campanhaId={campanha.id} mapas={mapasAtuais} tokens={tokensAtuais} mestre={mestre} personagens={personagens} npcs={npcs} adversarios={adversarios} mapaAtualId={mapaAtualId} onSelecionarMapa={selecionarMapa} onAdicionarMapa={adicionarMapa} onAtualizarMapa={atualizarMapa} onRemoverMapa={removerMapa} onAdicionarToken={adicionarToken} onAtualizarToken={atualizarToken} onRemoverToken={removerToken} />;
  const closeTool = () => setFerramenta('nenhuma');
  const toggleCinematic = () => {
    setCinematic(value => {
      const next = !value;
      if (next) { setPartyOpen(false); setSessionOpen(false); closeTool(); }
      else { setPartyOpen(true); setSessionOpen(true); }
      return next;
    });
  };

  return (
    <section className={`live-table live-table--v5 ${sessionOpen ? 'has-left-drawer' : ''} ${partyOpen ? 'has-right-drawer' : ''} ${cinematic ? 'is-cinematic' : ''}`}>
      <header className="live-vtt__topbar">
        <div className="live-vtt__brand">
          <img src="/ro-mark.svg" alt="" />
          <div>
            <strong>REINOS ONÍRICOS</strong>
            <small>Mesa Ao Vivo</small>
          </div>
        </div>

        <div className="live-vtt__campaign">
          <span>{campanha.tipo}</span>
          <strong>{campanha.nome}</strong>
          <small>{sessionTitle || `Sessão ${String(campanha.sessaoAtual).padStart(2, '0')}`}</small>
        </div>

        <div className="live-vtt__status">
          <span className={`live-vtt__status-pill is-${realtime.status}`}>
            <i />
            <Radio size={12} />
            {statusTexto}
          </span>
          <span>{campanha.jogadoresCount || personagens.length} na crônica</span>
        </div>

        <div className="live-vtt__top-actions">
          {mestre && (
            <div className="live-vtt__mode-switch" aria-label="Conteúdo apresentado à mesa">
              <button type="button" className={conteudo === 'ambientacao' ? 'is-active' : ''} onClick={() => mudarConteudo('ambientacao')} title="Cena">
                <Moon size={15} /><span>Cena</span>
              </button>
              <button type="button" className={conteudo === 'imagem' ? 'is-active' : ''} onClick={() => mudarConteudo('imagem')} title="Imagem">
                <ImageIcon size={15} /><span>Imagem</span>
              </button>
              <button type="button" className={conteudo === 'mapa' ? 'is-active' : ''} onClick={() => mudarConteudo('mapa')} title="Mapa">
                <MapIcon size={15} /><span>Mapa</span>
              </button>
              <button type="button" className={conteudo === 'handout' ? 'is-active' : ''} onClick={() => mudarConteudo('handout')} title="Handout">
                <FileText size={15} /><span>Handout</span>
              </button>
            </div>
          )}

          <button type="button" className={`live-vtt__presentation ${cinematic ? 'is-active' : ''}`} onClick={toggleCinematic}>
            <Moon size={15} />
            <span>{cinematic ? 'Voltar à mesa' : 'Apresentar'}</span>
          </button>

          <div className="live-vtt__user">
            <span>{userName?.slice(0, 2).toUpperCase() || 'RO'}</span>
            <div><strong>{userName || 'Participante'}</strong><small>{role}</small></div>
          </div>

          <button type="button" className="live-vtt__leave" onClick={onVoltar}>
            <ArrowLeft size={15} />
            <span>Campanha</span>
          </button>
        </div>
      </header>

      {realtime.error && <p className="live-vtt__sync-error">Sincronização indisponível: {realtime.error}</p>}

      <div className="live-vtt__shell">
        {!cinematic && (
          <nav className="live-vtt__rail" aria-label="Painéis da mesa">
            <button
              type="button"
              className={sessionOpen ? 'is-active' : ''}
              onClick={() => setSessionOpen(value => !value)}
              aria-label="Registro Vivo"
              title="Registro Vivo"
            >
              <MessageSquareText size={19} />
              <span>Registro</span>
            </button>
            <button
              type="button"
              className={partyOpen ? 'is-active' : ''}
              onClick={() => setPartyOpen(value => !value)}
              aria-label="Elenco"
              title="Elenco"
            >
              <Users size={19} />
              <span>Elenco</span>
            </button>
          </nav>
        )}

        <main className="live-vtt__stage-shell">
          <div className="live-vtt__stage-meta">
            <div>
              <span>{conteudo === 'mapa' ? 'Mapa tático' : 'Cena atual'}</span>
              <strong>{conteudo === 'mapa' ? (mapasAtuais.find(item => item.id === mapaAtualId)?.titulo || 'Mapa da cena') : sceneTitle}</strong>
            </div>
            <small>{conteudo === 'mapa' ? 'Movimente tokens, controle a grade e revele apenas o necessário.' : sceneDescription}</small>
          </div>

          <div className={`live-vtt__stage ${conteudo === 'mapa' ? 'is-map' : 'is-scene'}`}>
            {conteudo === 'mapa' ? mapaCena : cena}
          </div>

          {!cinematic && (
            <div className="live-vtt__player-bar" aria-label="Personagens presentes">
              <div className="live-vtt__player-bar-label">
                <span>Presentes</span>
                <small>{personagensVisiveis.length}</small>
              </div>

              <div className="live-vtt__player-strip">
                {personagensVisiveis.length === 0 && (
                  <span className="live-vtt__player-empty">Nenhuma ficha vinculada à mesa.</span>
                )}
                {personagensVisiveis.map(personagem => (
                  <button
                    type="button"
                    key={personagem.id}
                    className={`live-vtt__player ${selecionado?.id === personagem.id ? 'is-selected' : ''}`}
                    onClick={() => setSelecionadoId(personagem.id)}
                    title={personagem.nome}
                  >
                    <span className={`live-vtt__player-avatar ${personagem.imagemUrl ? 'has-image' : ''}`}>
                      {personagem.imagemUrl
                        ? <AssetImage src={personagem.imagemUrl} alt="" />
                        : personagem.nome.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="live-vtt__player-copy">
                      <strong>{personagem.nome}</strong>
                      <small>PV {personagem.vidaAtual}/{personagem.vidaMaxima} · FO {personagem.focoAtual}/{personagem.focoMaximo} · R {personagem.ruptura}/6</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {!cinematic && sessionOpen && (
          <aside className="live-vtt__drawer live-vtt__drawer--left">
            <header className="live-vtt__drawer-head">
              <div>
                <span>Registro Vivo</span>
                <strong>Sessão em tempo real</strong>
              </div>
              <button type="button" onClick={() => setSessionOpen(false)} aria-label="Fechar Registro Vivo">×</button>
            </header>
            <SessionPanel
              contadores={contadoresAtuais}
              mestre={mestre}
              role={role}
              userId={userId}
              members={members}
              enabled={registroOnline}
              events={registro.events}
              loading={registro.loading}
              error={registro.error}
              onSend={registro.registrar}
            />
          </aside>
        )}

        {!cinematic && partyOpen && (
          <aside className="live-vtt__drawer live-vtt__drawer--right">
            <LiveActorsPanel
              personagens={personagensVisiveis}
              npcs={npcs}
              adversarios={adversarios}
              selecionadoId={selecionado?.id || ''}
              mestre={mestre}
              onSelecionar={setSelecionadoId}
              onAbrirFicha={onAbrirFicha}
              onAjustar={ajustar}
              onRuptura={(personagem) => onAbrirRuptura(personagem, 1, 'Ajuste na Mesa Ao Vivo')}
              onClose={() => setPartyOpen(false)}
            />
          </aside>
        )}
      </div>

      {!cinematic && <LiveDock ferramenta={ferramenta} onSelecionar={selecionarFerramenta} />}

      {ferramenta !== 'nenhuma' && !cinematic && (
        <div className="live-vtt__tool-backdrop" onMouseDown={closeTool}>
          <section className="live-vtt__tool" onMouseDown={event => event.stopPropagation()}>
            <header className="live-vtt__tool-head">
              <div><span>Ferramenta de mesa</span><strong>{ferramenta}</strong></div>
              <button type="button" onClick={closeTool} aria-label="Fechar ferramenta">×</button>
            </header>
            <div className="live-vtt__tool-body">
              {ferramenta === 'dados' && <DiceRoller personagemAtivo={selecionado} onSalvarPersonagem={atualizarPersonagemMesa} onAbrirModalRuptura={(delta, motivo) => selecionado && onAbrirRuptura(selecionado, delta, motivo)} onRegistrarRolagem={registrarSemFalhar} />}
              {ferramenta === 'sonhar' && <DreamGuide personagemAtivo={selecionado} onIrParaRoladorOnirico={() => setFerramenta('dados')} />}
              {ferramenta === 'ficha' && (selecionado
                ? <div className="live-vtt__quick-sheet">
                    <div className="live-vtt__quick-sheet-head">
                      <span className={`live-vtt__player-avatar ${selecionado.imagemUrl ? 'has-image' : ''}`}>
                        {selecionado.imagemUrl ? <AssetImage src={selecionado.imagemUrl} alt="" /> : selecionado.nome.slice(0, 2).toUpperCase()}
                      </span>
                      <div><span>Ficha rápida</span><h2>{selecionado.nome}</h2></div>
                    </div>
                    <p>Defesa {selecionado.defesa} · Resistência {selecionado.resistencia}</p>
                    <button type="button" onClick={() => onAbrirFicha(selecionado)} className="ro-button mt-4">Abrir ficha completa</button>
                  </div>
                : <p className="live-table__empty">Selecione um personagem.</p>)}
              {ferramenta === 'contadores' && <CounterPanel campanhaId={campanha.id} contadores={contadoresAtuais} mestre={mestre} onAdicionar={adicionarContador} onAtualizar={atualizarContador} onRemover={removerContador} onDuplicar={duplicarContador} onRegistrarEvento={registrarSemFalhar} />}
              {ferramenta === 'regras' && <RulesReference />}
            </div>
          </section>
        </div>
      )}
    </section>
  );
};