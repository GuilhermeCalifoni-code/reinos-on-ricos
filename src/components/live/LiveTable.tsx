import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Personagem } from '../../types/character';
import { Adversario, Campanha, Cena, Contador, ConteudoDeCena, Handout, MapaNarrativo, MembroCampanha, NPC, Pista, Sessao, TokenMapa } from '../../types/campaign';
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
import type { CharacterResourceUpdate } from '../../features/realtime/liveTableRepository';
import { AssetImage } from '../system/AssetImage';
import { LiveActorsPanel } from './LiveActorsPanel';
import { LiveDirectorPanel } from './LiveDirectorPanel';
import { campaignAssetService } from '../../services/storage/campaignAssetService';
import { ArrowLeft, FileText, Image as ImageIcon, Layers3, Map as MapIcon, MessageSquareText, Moon, Radio, Users } from 'lucide-react';

interface LiveTableProps {
  campanha: Campanha; personagens: Personagem[]; npcs: NPC[]; adversarios: Adversario[]; role: UserRole;
  onAtualizarNPC: (id: string, patch: Partial<NPC>) => Promise<unknown>;
  onAtualizarAdversario: (id: string, patch: Partial<Adversario>) => Promise<unknown>; personagemJogadorId?: string; userId?: string; userName?: string; sessionId?: string; sessionTitle?: string; sessionDescription?: string; sessao?: Sessao; cenas: Cena[]; pistas: Pista[]; handouts: Handout[]; members?: MembroCampanha[]; registroOnline: boolean; onVoltar: () => void;
  onAtualizarPersonagem: (personagem: Personagem) => void;
  onReceberRecursosPersonagem: (update: CharacterResourceUpdate) => void; onAbrirRuptura: (personagem: Personagem, delta: number, motivo: string) => void; onAbrirFicha: (personagem: Personagem) => void;
  contadores: Contador[]; onAdicionarContador: (contador: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarContador: (id: string, parcial: Partial<Contador>) => void; onRemoverContador: (id: string) => void; onDuplicarContador: (id: string) => void;
  mapas: MapaNarrativo[]; onAdicionarMapa: (mapa: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarMapa: (id: string, parcial: Partial<MapaNarrativo>) => void; onRemoverMapa: (id: string) => void; onAtualizarSessao?: (id: string, patch: Partial<Sessao>) => Promise<unknown> | unknown;
  tokensMapa: TokenMapa[]; onAdicionarTokenMapa: (token: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void; onAtualizarTokenMapa: (id: string, parcial: Partial<TokenMapa>) => void; onRemoverTokenMapa: (id: string) => void;
}

export const LiveTable: React.FC<LiveTableProps> = (props) => {
  const { campanha, personagens, npcs, adversarios, role, personagemJogadorId, userId, userName, sessionId, sessionTitle, sessionDescription, sessao, cenas, pistas, handouts, members = [], registroOnline, onVoltar, onAtualizarPersonagem, onReceberRecursosPersonagem, onAbrirRuptura, onAbrirFicha, contadores, onAdicionarContador, onAtualizarContador, onRemoverContador, onDuplicarContador, mapas, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, onAtualizarSessao, tokensMapa, onAdicionarTokenMapa, onAtualizarTokenMapa, onRemoverTokenMapa } = props;
  const mestre = role === 'mestre';
  const writesRecursosRef = useRef(new Map<string, Promise<void>>());
  const [erroRecursos, setErroRecursos] = useState('');
  const personagensVisiveis = useMemo(() => mestre ? personagens : personagens.filter(p => p.id === personagemJogadorId), [mestre, personagemJogadorId, personagens]);
  const [selecionadoId, setSelecionadoId] = useState(personagensVisiveis[0]?.id || personagens[0]?.id || '');
  const [ferramenta, setFerramenta] = useState<LiveTool>('nenhuma');
  const [conteudoLocal, setConteudoLocal] = useState<ConteudoDeCena>('ambientacao');
  const [mapaLocalId, setMapaLocalId] = useState<string | undefined>();
  const [sceneCopyLocal, setSceneCopyLocal] = useState({
    title: sessionTitle || 'A cidade contém a respiração',
    description: sessionDescription || 'Ambientação da cena. O Mestre pode preparar imagem, mapa ou handout para esta área.'
  });
  const [partyOpen, setPartyOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [directorOpen, setDirectorOpen] = useState(mestre);
  const [activeSceneLocalId, setActiveSceneLocalId] = useState<string | undefined>();
  const [cinematic, setCinematic] = useState(false);
  const contadoresDaCampanha = useMemo(() => mestre ? contadores.filter(item => item.campanhaId === campanha.id) : [], [campanha.id, contadores, mestre]);
  const mapasDaCampanha = useMemo(() => mapas.filter(item => item.campanhaId === campanha.id), [campanha.id, mapas]);
  const tokensDaCampanha = useMemo(() => tokensMapa.filter(item => item.campanhaId === campanha.id), [campanha.id, tokensMapa]);
  const realtime = useCampaignRealtime({ campaignId: campanha.id, userId, userName, role, enabled: registroOnline, fallback: { counters: contadoresDaCampanha, maps: mapasDaCampanha, tokens: tokensDaCampanha }, onCharacterUpdate: onReceberRecursosPersonagem });
  const compartilhando = registroOnline && realtime.ready;
  const contadoresAtuais = mestre ? (compartilhando ? realtime.counters : contadoresDaCampanha) : [];
  const mapasAtuais = useMemo(() => {
    if (!compartilhando) return mapasDaCampanha;
    const merged = new Map<string, MapaNarrativo>();
    [...mapasDaCampanha, ...realtime.maps].forEach(item => merged.set(item.id, item));
    return Array.from(merged.values());
  }, [compartilhando, mapasDaCampanha, realtime.maps]);
  const tokensAtuais = compartilhando ? realtime.tokens : tokensDaCampanha;
  const conteudo = compartilhando && realtime.state ? realtime.state.contentType : conteudoLocal;
  const mapaAtualId = compartilhando && realtime.state?.activeMapId ? realtime.state.activeMapId : mapaLocalId;
  const activeSceneId = compartilhando && realtime.state?.activeSceneId ? realtime.state.activeSceneId : activeSceneLocalId;
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
  const selecionarFerramenta = (proxima: LiveTool) => {
    if (proxima === 'contadores' && !mestre) return;
    setFerramenta(atual => atual === proxima ? 'nenhuma' : proxima);
  };
  useEffect(() => { if (!mestre) setFerramenta(atual => atual === 'contadores' ? 'nenhuma' : atual); }, [mestre]);
  // Escape fecha qualquer ferramenta aberta, inclusive Regras, sem sair da Mesa.
  useEffect(() => {
    if (ferramenta === 'nenhuma' || cinematic) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setFerramenta('nenhuma');
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [ferramenta, cinematic]);
  const salvarEstado = (patch: { contentType?: ConteudoDeCena; activeSceneId?: string; activeMapId?: string; metadata?: Record<string, unknown> }) => { if (compartilhando && mestre) void realtime.saveState({ ...realtime.state, ...patch, sessionId: effectiveSessionId, ruptureGeneral: campanha.rupturaGeral }).catch(() => undefined); };
  const mudarConteudo = (proximo: ConteudoDeCena) => { if (!compartilhando) return; setConteudoLocal(proximo); salvarEstado({ contentType: proximo }); };
  const selecionarMapa = (id: string) => { if (!compartilhando) return; setMapaLocalId(id); salvarEstado({ activeMapId: id, contentType: 'mapa' }); };

  const ensureSessionLink = async (field: 'cenaIds' | 'mapaIds' | 'pistaIds' | 'handoutIds' | 'npcIds' | 'adversarioIds', id: string) => {
    if (!mestre || !sessao || !onAtualizarSessao) return;
    const current = Array.isArray(sessao[field]) ? (sessao[field] as string[]) : [];
    if (current.includes(id)) return;
    await onAtualizarSessao(sessao.id, { [field]: [...current, id] } as Partial<Sessao>);
  };

  const ativarCena = async (scene: Cena) => {
    if (!compartilhando) return;
    setActiveSceneLocalId(scene.id);
    const contentType: ConteudoDeCena = scene.tipoDeConteudo === 'mapa' ? 'ambientacao' : scene.tipoDeConteudo;
    setConteudoLocal(contentType);
    setSceneCopyLocal({
      title: scene.titulo,
      description: scene.descricao || 'Cena preparada pelo Mestre.'
    });
    salvarEstado({
      activeSceneId: scene.id,
      contentType,
      metadata: {
        ...(realtime.state?.metadata || {}),
        sceneTitle: scene.titulo,
        sceneDescription: scene.descricao || '',
        sceneImageUrl: scene.imagemUrl || ''
      }
    });
    await ensureSessionLink('cenaIds', scene.id);
    registrarSemFalhar({ type: 'scene_change', content: `Cena ativada: ${scene.titulo}.`, metadata: { sceneId: scene.id } });
  };

  const ativarMapa = async (mapa: MapaNarrativo) => {
    if (!compartilhando) return;
    selecionarMapa(mapa.id);
    await ensureSessionLink('mapaIds', mapa.id);
    registrarSemFalhar(sessionEventFactories.map(`Mapa ativado: ${mapa.titulo}.`));
  };

  const apresentarPista = async (pista: Pista) => {
    if (!compartilhando) return;
    const contentType: ConteudoDeCena = pista.imagemUrl ? 'imagem' : 'handout';
    setConteudoLocal(contentType);
    setSceneCopyLocal({ title: pista.titulo, description: pista.descricao });
    salvarEstado({
      contentType,
      metadata: {
        ...(realtime.state?.metadata || {}),
        sceneTitle: pista.titulo,
        sceneDescription: pista.descricao,
        sceneImageUrl: pista.imagemUrl || '',
        presentedKind: 'pista',
        presentedId: pista.id
      }
    });
    await ensureSessionLink('pistaIds', pista.id);
    registrarSemFalhar({ type: 'clue_reveal', content: `Pista revelada: ${pista.titulo}.`, metadata: { pistaId: pista.id } });
  };

  const apresentarHandout = async (handout: Handout) => {
    if (!compartilhando) return;
    let url = handout.arquivoUrl || '';
    if (!url && handout.storagePath) {
      try { url = await campaignAssetService.signedUrl(handout.storagePath); } catch { url = ''; }
    }
    setConteudoLocal('handout');
    setSceneCopyLocal({ title: handout.titulo, description: handout.descricao || 'Handout apresentado pelo Mestre.' });
    salvarEstado({
      contentType: 'handout',
      metadata: {
        ...(realtime.state?.metadata || {}),
        sceneTitle: handout.titulo,
        sceneDescription: handout.descricao || '',
        sceneImageUrl: url,
        presentedKind: 'handout',
        presentedId: handout.id,
        handoutUrl: url
      }
    });
    await ensureSessionLink('handoutIds', handout.id);
    registrarSemFalhar({ type: 'system', content: `Handout apresentado: ${handout.titulo}.`, metadata: { handoutId: handout.id, kind: 'handout_reveal' } });
  };

  const atualizarTextoCena = (title: string, description: string) => {
    if (!compartilhando) return;
    setSceneCopyLocal({ title, description });
    salvarEstado({ metadata: { ...(realtime.state?.metadata || {}), sceneTitle: title, sceneDescription: description } });
    registrarSemFalhar({ type: 'scene_change', content: `Cena atualizada: ${title}.`, metadata: { sceneTitle: title } });
  };
  const atualizarPersonagemMesa = (personagem: Personagem) => {
    if (!compartilhando || personagem.campaignId !== campanha.id) {
      onAtualizarPersonagem(personagem);
      return;
    }

    // Um único write ao Supabase. A UI atualiza imediatamente sem recarregar
    // nem salvar a ficha inteira novamente a cada evento recebido.
    const novoEstado: CharacterResourceUpdate = {
      id: personagem.id,
      vidaAtual: personagem.vidaAtual,
      focoAtual: personagem.focoAtual,
      ruptura: personagem.ruptura,
      protecaoOniricaAtual: personagem.protecaoOniricaAtual,
      updatedAt: personagem.atualizadoEm || new Date().toISOString()
    };
    const anterior = personagens.find(item => item.id === personagem.id);
    onReceberRecursosPersonagem(novoEstado);
    setErroRecursos('');

    // Serializar alterações rápidas de PV/Foco do mesmo personagem evita
    // que respostas fora de ordem sobreponham o valor mais recente.
    const anteriorPendente = writesRecursosRef.current.get(personagem.id) || Promise.resolve();
    const pendente = anteriorPendente.catch(() => undefined)
      .then(() => realtime.patchCharacterResources(personagem.id, novoEstado).then(() => undefined));
    writesRecursosRef.current.set(personagem.id, pendente);
    void pendente.catch(reason => {
      // Reverter apenas quando não há outra alteração mais recente na fila.
      if (writesRecursosRef.current.get(personagem.id) === pendente && anterior) {
        onReceberRecursosPersonagem({
          id: anterior.id, vidaAtual: anterior.vidaAtual, focoAtual: anterior.focoAtual,
          ruptura: anterior.ruptura, protecaoOniricaAtual: anterior.protecaoOniricaAtual,
          updatedAt: anterior.atualizadoEm || new Date().toISOString()
        });
      }
      setErroRecursos(reason instanceof Error ? reason.message : 'Não foi possível sincronizar os recursos.');
    }).finally(() => {
      if (writesRecursosRef.current.get(personagem.id) === pendente) {
        writesRecursosRef.current.delete(personagem.id);
      }
    });
  };
  const ajustar = (personagem: Personagem, campo: 'vidaAtual' | 'focoAtual', delta: number) => { const maximo = campo === 'vidaAtual' ? personagem.vidaMaxima : personagem.focoMaximo; atualizarPersonagemMesa({ ...personagem, [campo]: Math.max(0, Math.min(maximo, personagem[campo] + delta)), atualizadoEm: new Date().toISOString() }); if (campo === 'vidaAtual') registrarSemFalhar(sessionEventFactories.damage(personagem.id, personagem.nome, delta)); };
  const adicionarContador = (item: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => { if (compartilhando && mestre) void realtime.addCounter({ ...item, visibilidade: 'mestre_privado' }).catch(() => undefined); };
  const atualizarContador = (id: string, patch: Partial<Contador>) => { if (compartilhando && mestre) void realtime.patchCounter(id, patch).catch(() => undefined); };
  const removerContador = (id: string) => { if (compartilhando && mestre) void realtime.removeCounter(id).catch(() => undefined); };
  const duplicarContador = (id: string) => { if (!compartilhando || !mestre) return; const original = contadoresAtuais.find(item => item.id === id); if (original) { const { id: _id, criadoEm: _criado, atualizadoEm: _atualizado, ...draft } = original; void realtime.addCounter({ ...draft, nome: `${draft.nome} (cópia)` }).catch(() => undefined); } };
  const adicionarMapa = (item: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => { if (!compartilhando) return; void realtime.addMap(item).then(mapa => { setMapaLocalId(mapa.id); salvarEstado({ activeMapId: mapa.id, contentType: 'mapa' }); registrarSemFalhar(sessionEventFactories.map(`Mapa criado: ${mapa.titulo}.`)); }).catch(() => undefined); };
  const atualizarMapa = (id: string, patch: Partial<MapaNarrativo>) => { if (compartilhando) void realtime.patchMap(id, patch).catch(() => undefined); };
  const removerMapa = (id: string) => { const mapa = mapasAtuais.find(item => item.id === id); if (compartilhando) void realtime.removeMap(id).then(() => { if (mapaAtualId === id) salvarEstado({ activeMapId: undefined }); if (mapa) registrarSemFalhar(sessionEventFactories.map(`Mapa removido: ${mapa.titulo}.`)); }).catch(() => undefined); };
  const adicionarToken = (item: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => { if (compartilhando) void realtime.addToken(item).catch(() => undefined); };
  const atualizarToken = (id: string, patch: Partial<TokenMapa>): Promise<unknown> => compartilhando ? realtime.patchToken(id, patch) : Promise.reject(new Error('Mesa não sincronizada.'));
  const removerToken = (id: string) => { if (compartilhando) void realtime.removeToken(id).catch(() => undefined); };
  const statusTexto = realtime.status === 'connected' ? 'Sincronizado' : realtime.status === 'connecting' ? 'Conectando' : 'Offline';
  const avisoRecursos = erroRecursos ? <p role="alert" className="live-vtt__sync-error">Não foi possível atualizar PV/Foco: {erroRecursos}</p> : null;
  const stageConteudo: ConteudoDeCena = conteudo === 'mapa' ? 'ambientacao' : conteudo;
  const cena = <SceneStage campanha={campanha} mestre={mestre} conteudo={stageConteudo} title={sceneTitle} description={sceneDescription} imageUrl={sceneImageUrl} onAtualizarTexto={atualizarTextoCena} onMudarConteudo={mudarConteudo} mapas={mapasAtuais} tokensMapa={tokensAtuais} mapaAtualId={mapaAtualId} onSelecionarMapa={selecionarMapa} onAdicionarMapa={adicionarMapa} onAtualizarMapa={atualizarMapa} onRemoverMapa={removerMapa} onAdicionarToken={adicionarToken} onAtualizarToken={atualizarToken} onRemoverToken={removerToken} onRegistrarEvento={registrarSemFalhar} />;
  const mapaCena = <MapStage campanhaId={campanha.id} mapas={mapasAtuais} tokens={tokensAtuais} mestre={mestre} personagemJogadorId={personagemJogadorId} personagens={personagens} npcs={npcs} adversarios={adversarios} onActorUsed={(kind, id) => { if (kind === 'npc') void ensureSessionLink('npcIds', id); if (kind === 'adversario') void ensureSessionLink('adversarioIds', id); }} mapaAtualId={mapaAtualId} onSelecionarMapa={selecionarMapa} onAdicionarMapa={adicionarMapa} onAtualizarMapa={atualizarMapa} onRemoverMapa={removerMapa} onAdicionarToken={adicionarToken} onAtualizarToken={atualizarToken} onRemoverToken={removerToken} />;
  const closeTool = () => setFerramenta('nenhuma');
  const toggleCinematic = () => {
    setCinematic(value => {
      const next = !value;
      if (next) { setPartyOpen(false); setSessionOpen(false); setDirectorOpen(false); closeTool(); }
      else if (mestre) { setDirectorOpen(true); }
      return next;
    });
  };

  return (
    <section className={`live-table live-table--v5 ${sessionOpen || directorOpen ? 'has-left-drawer' : ''} ${partyOpen ? 'has-right-drawer' : ''} ${cinematic ? 'is-cinematic' : ''}`}>
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
      {avisoRecursos}

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
                draggable={mestre}
                onDragStart={(event) => {
                  if (!mestre) return;
                  event.dataTransfer.effectAllowed = 'copy';
                  event.dataTransfer.setData('application/x-ro-actor', JSON.stringify({
                    kind: 'personagem',
                    id: personagem.id,
                    name: personagem.nome,
                    imageUrl: personagem.imagemUrl || ''
                  }));
                }}
                title={mestre ? `${personagem.nome} · arraste para o mapa` : personagem.nome}
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
      <div className="live-vtt__shell">
        {!cinematic && (
          <nav className="live-vtt__rail" aria-label="Painéis da mesa">
            {mestre && (
              <button
                type="button"
                className={directorOpen ? 'is-active' : ''}
                onClick={() => { setDirectorOpen(value => !value); setSessionOpen(false); }}
                aria-label="Direção da sessão"
                title="Direção da sessão"
              >
                <Layers3 size={19} />
                <span>Sessão</span>
              </button>
            )}
            <button
              type="button"
              className={sessionOpen ? 'is-active' : ''}
              onClick={() => { setSessionOpen(value => !value); setDirectorOpen(false); }}
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

        <main className={`live-vtt__stage-shell ${conteudo === 'mapa' ? 'is-map' : 'is-scene'}`}>
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


        </main>

        {!cinematic && mestre && directorOpen && (
          <aside className="live-vtt__drawer live-vtt__drawer--left live-vtt__drawer--director">
            <LiveDirectorPanel
              sessao={sessao}
              cenas={cenas}
              mapas={mapasAtuais}
              pistas={pistas}
              handouts={handouts}
              activeSceneId={activeSceneId}
              activeMapId={mapaAtualId}
              onActivateScene={ativarCena}
              onActivateMap={ativarMapa}
              onPresentClue={apresentarPista}
              onPresentHandout={apresentarHandout}
              onClose={() => setDirectorOpen(false)}
            />
          </aside>
        )}

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
              tokens={tokensAtuais.filter(t=>t.mapaId===mapaAtualId)}
              onTokenHpChange={(tokenId,hp,hpMax)=>atualizarToken(tokenId,{hpCurrent:hp,hpMax})}
              selecionadoId={selecionado?.id || ''}
              mestre={mestre}
              onSelecionar={setSelecionadoId}
              onAbrirFicha={onAbrirFicha}
              onAjustar={ajustar}
              onRuptura={(personagem) => onAbrirRuptura(personagem, 1, 'Ajuste na Mesa Ao Vivo')}
              onActorRoll={async (content,details) => {
                if (!mestre) throw new Error('Somente o Mestre pode rolar por NPCs e adversários.');
                await registro.registrar({
                  type:'roll', visibility:'mestre', content,
                  metadata:{...details,kind:'actor_combat'}
                });
              }}
              onClose={() => setPartyOpen(false)}
            />
          </aside>
        )}
      </div>

      {!cinematic && <LiveDock ferramenta={ferramenta} onSelecionar={selecionarFerramenta} mestre={mestre} />}

      {ferramenta !== 'nenhuma' && !cinematic && (
        <div className="live-vtt__tool-backdrop" onMouseDown={closeTool}>
          <section
            className={`live-vtt__tool live-vtt__tool--${ferramenta}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-vtt-active-tool"
            onMouseDown={event => event.stopPropagation()}
          >
            <header className="live-vtt__tool-head">
              <div><span>Ferramenta de mesa</span><strong id="live-vtt-active-tool">{ferramenta}</strong></div>
              <button type="button" onClick={closeTool} aria-label={`Fechar ${ferramenta}`} title="Fechar ferramenta">×</button>
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
              {mestre && ferramenta === 'contadores' && <CounterPanel campanhaId={campanha.id} contadores={contadoresAtuais} mestre={mestre} onAdicionar={adicionarContador} onAtualizar={atualizarContador} onRemover={removerContador} onDuplicar={duplicarContador} onRegistrarEvento={registrarSemFalhar} />}
              {ferramenta === 'regras' && <RulesReference />}
            </div>
          </section>
        </div>
      )}
    </section>
  );
};