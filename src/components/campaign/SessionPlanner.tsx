import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronRight,
  FileImage,
  FileText,
  ImagePlus,
  Link2,
  Map as MapIcon,
  Play,
  Plus,
  ScrollText,
  Shield,
  Sparkles,
  Upload,
  UserRound,
  Users,
  X
} from 'lucide-react';
import {
  Adversario,
  Cena,
  Handout,
  Local,
  MapaNarrativo,
  NPC,
  Pista,
  Sessao,
  SessaoStatus,
  VisibilidadeConteudo
} from '../../types/campaign';
import { campaignAssetService } from '../../services/storage/campaignAssetService';
import { AssetImage } from '../system/AssetImage';

interface SessionPlannerProps {
  campaignId: string;
  sessoes: Sessao[];
  cenas: Cena[];
  mapas: MapaNarrativo[];
  pistas: Pista[];
  handouts: Handout[];
  npcs: NPC[];
  adversarios: Adversario[];
  locais: Local[];
  canManage: boolean;
  onCreate: () => void;
  onOpen: (sessao: Sessao) => void | Promise<void>;
  onUpdate: (id: string, patch: Partial<Sessao>) => void | Promise<unknown>;
  onAddScene: (scene: Omit<Cena, 'id'>) => Promise<unknown> | unknown;
  onAddMap: (map: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<unknown> | unknown;
  onAddClue: (clue: Omit<Pista, 'id'>) => Promise<unknown> | unknown;
  onAddHandout: (handout: Omit<Handout, 'id'>) => Promise<unknown> | unknown;
}

type ResourceField = 'cenaIds' | 'mapaIds' | 'pistaIds' | 'handoutIds' | 'npcIds' | 'adversarioIds' | 'localIds';
type QuickType = 'scene' | 'map' | 'clue' | 'handout' | null;

const statusLabel: Record<SessaoStatus, string> = {
  planejamento: 'Em preparação',
  pronta: 'Pronta para a mesa',
  ao_vivo: 'Ao vivo',
  concluida: 'Concluída'
};

const statusHint: Record<SessaoStatus, string> = {
  planejamento: 'Ainda há pontos de preparação em aberto.',
  pronta: 'A sessão está pronta para ser levada à Mesa Ao Vivo.',
  ao_vivo: 'Esta sessão está sendo conduzida agora.',
  concluida: 'Sessão encerrada e preservada no arquivo da crônica.'
};

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(file);
});

const asCreated = <T extends { id: string }>(value: unknown): T | null => {
  if (!value || typeof value !== 'object' || !('id' in value)) return null;
  return value as T;
};

const idsOf = (session: Sessao, field: ResourceField): string[] => {
  const value = session[field];
  return Array.isArray(value) ? value : [];
};

const mapVisual = (mapa: MapaNarrativo) =>
  mapa.imagemUrl || (mapa.storagePath ? campaignAssetService.toStorageRef(mapa.storagePath) : '');

const completionFor = (session: Sessao) => {
  const parts = [
    Boolean(session.cenaIds?.length),
    Boolean(session.imagemUrl || session.mapaIds?.length),
    Boolean(session.pistaIds?.length || session.handoutIds?.length),
    Boolean(session.npcIds?.length || session.adversarioIds?.length || session.localIds?.length),
    Boolean(session.anotacoesMestre?.trim())
  ];
  return { done: parts.filter(Boolean).length, total: parts.length };
};

export const SessionPlanner: React.FC<SessionPlannerProps> = ({
  campaignId,
  sessoes,
  cenas,
  mapas,
  pistas,
  handouts,
  npcs,
  adversarios,
  locais,
  canManage,
  onCreate,
  onOpen,
  onUpdate,
  onAddScene,
  onAddMap,
  onAddClue,
  onAddHandout
}) => {
  const orderedSessions = useMemo(
    () => [...sessoes].sort((a, b) => b.numero - a.numero),
    [sessoes]
  );
  const [selectedId, setSelectedId] = useState<string>(orderedSessions[0]?.id || '');
  const selected = orderedSessions.find(item => item.id === selectedId) || orderedSessions[0] || null;

  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [quickType, setQuickType] = useState<QuickType>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickVisibility, setQuickVisibility] = useState<VisibilidadeConteudo>('mestre_privado');
  const [quickBusy, setQuickBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selected && orderedSessions[0]) setSelectedId(orderedSessions[0].id);
  }, [orderedSessions, selected]);

  useEffect(() => {
    if (!selected) return;
    setDraftTitle(selected.titulo || '');
    setDraftDate(selected.data || '');
    setDraftDescription(selected.descricao || '');
    setDraftNotes(selected.anotacoesMestre || '');
    setCoverUrl(selected.imagemUrl || '');
  }, [selected?.id, selected?.titulo, selected?.data, selected?.descricao, selected?.anotacoesMestre, selected?.imagemUrl]);

  const savePatch = async (patch: Partial<Sessao>) => {
    if (!selected || !canManage) return;
    setMessage('');
    try {
      await onUpdate(selected.id, patch);
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível salvar a preparação da sessão.');
    }
  };

  const toggleResource = async (field: ResourceField, id: string) => {
    if (!selected || !canManage) return;
    const current = idsOf(selected, field);
    const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
    await savePatch({ [field]: next } as Partial<Sessao>);
  };

  const moveResource = async (field: ResourceField, id: string, delta: number) => {
    if (!selected || !canManage) return;
    const current = [...idsOf(selected, field)];
    const from = current.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= current.length) return;
    [current[from], current[to]] = [current[to], current[from]];
    await savePatch({ [field]: current } as Partial<Sessao>);
  };

  const uploadSessionCover = async (file?: File) => {
    if (!selected || !file || !canManage) return;
    setMessage('');
    try {
      let url: string;
      if (campaignAssetService.isRemoteCampaignId(campaignId)) {
        const path = await campaignAssetService.uploadPreparationImage(campaignId, 'sessions', file);
        url = campaignAssetService.toStorageRef(path);
      } else {
        url = await fileToDataUrl(file);
      }
      setCoverUrl(url);
      await savePatch({ imagemUrl: url });
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível enviar a imagem da sessão.');
    }
  };

  const resetQuick = () => {
    setQuickType(null);
    setQuickTitle('');
    setQuickDescription('');
    setQuickUrl('');
    setQuickFile(null);
    setQuickVisibility('mestre_privado');
  };

  const createAndLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !quickType || !quickTitle.trim() || quickBusy) return;
    setQuickBusy(true);
    setMessage('');

    try {
      if (quickType === 'scene') {
        let imagemUrl = quickUrl.trim() || undefined;
        if (quickFile) {
          if (campaignAssetService.isRemoteCampaignId(campaignId)) {
            const path = await campaignAssetService.uploadSceneImage(campaignId, quickFile);
            imagemUrl = campaignAssetService.toStorageRef(path);
          } else {
            imagemUrl = await fileToDataUrl(quickFile);
          }
        }
        const created = asCreated<Cena>(await onAddScene({
          campanhaId: campaignId,
          titulo: quickTitle.trim(),
          descricao: quickDescription.trim() || undefined,
          visibilidade: quickVisibility,
          tipoDeConteudo: imagemUrl ? 'imagem' : 'ambientacao',
          imagemUrl
        }));
        if (created) await savePatch({ cenaIds: [...idsOf(selected, 'cenaIds'), created.id] });
      }

      if (quickType === 'map') {
        let imagemUrl = quickUrl.trim() || undefined;
        let storagePath: string | undefined;
        if (quickFile) {
          if (campaignAssetService.isRemoteCampaignId(campaignId)) {
            storagePath = await campaignAssetService.uploadMap(campaignId, quickFile);
            imagemUrl = undefined;
          } else {
            imagemUrl = await fileToDataUrl(quickFile);
          }
        }
        const created = asCreated<MapaNarrativo>(await onAddMap({
          campanhaId: campaignId,
          titulo: quickTitle.trim(),
          imagemUrl,
          storagePath,
          visibilidade: quickVisibility,
          gradeVisivel: false
        }));
        if (created) await savePatch({ mapaIds: [...idsOf(selected, 'mapaIds'), created.id] });
      }

      if (quickType === 'clue') {
        let imagemUrl = quickUrl.trim() || undefined;
        if (quickFile) {
          if (campaignAssetService.isRemoteCampaignId(campaignId)) {
            const path = await campaignAssetService.uploadPreparationImage(campaignId, 'clues', quickFile);
            imagemUrl = campaignAssetService.toStorageRef(path);
          } else {
            imagemUrl = await fileToDataUrl(quickFile);
          }
        }
        const created = asCreated<Pista>(await onAddClue({
          campanhaId: campaignId,
          titulo: quickTitle.trim(),
          descricao: quickDescription.trim(),
          tipo: 'documento',
          status: 'descoberta',
          visibilidade: quickVisibility,
          imagemUrl
        }));
        if (created) await savePatch({ pistaIds: [...idsOf(selected, 'pistaIds'), created.id] });
      }

      if (quickType === 'handout') {
        let arquivoUrl = quickUrl.trim() || undefined;
        let storagePath: string | undefined;
        if (quickFile) {
          if (campaignAssetService.isRemoteCampaignId(campaignId)) {
            storagePath = await campaignAssetService.uploadHandout(campaignId, quickFile);
            arquivoUrl = undefined;
          } else {
            arquivoUrl = await fileToDataUrl(quickFile);
          }
        }
        const created = asCreated<Handout>(await onAddHandout({
          campanhaId: campaignId,
          titulo: quickTitle.trim(),
          descricao: quickDescription.trim() || undefined,
          arquivoUrl,
          storagePath,
          visibilidade: quickVisibility
        }));
        if (created) await savePatch({ handoutIds: [...idsOf(selected, 'handoutIds'), created.id] });
      }

      resetQuick();
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível criar o recurso.');
    } finally {
      setQuickBusy(false);
    }
  };

  if (!selected) {
    return (
      <section className="session-studio session-studio--empty">
        <div className="session-studio__empty-copy">
          <p className="ro-eyebrow">Preparação da crônica</p>
          <h2>Construa a sessão antes de abrir a mesa.</h2>
          <p>Cenas, mapas, pistas, handouts, NPCs e ameaças ficam ligados à sessão certa e reaparecem quando você voltar.</p>
          {canManage && <button type="button" className="ro-button" onClick={onCreate}><Plus size={15} /> Criar primeira sessão</button>}
        </div>
      </section>
    );
  }

  const completion = completionFor(selected);
  const selectedScenes = idsOf(selected, 'cenaIds').map(id => cenas.find(item => item.id === id)).filter(Boolean) as Cena[];
  const selectedMaps = idsOf(selected, 'mapaIds').map(id => mapas.find(item => item.id === id)).filter(Boolean) as MapaNarrativo[];
  const selectedClues = idsOf(selected, 'pistaIds').map(id => pistas.find(item => item.id === id)).filter(Boolean) as Pista[];
  const selectedHandouts = idsOf(selected, 'handoutIds').map(id => handouts.find(item => item.id === id)).filter(Boolean) as Handout[];
  const selectedNpcs = idsOf(selected, 'npcIds').map(id => npcs.find(item => item.id === id)).filter(Boolean) as NPC[];
  const selectedAdversaries = idsOf(selected, 'adversarioIds').map(id => adversarios.find(item => item.id === id)).filter(Boolean) as Adversario[];
  const selectedLocations = idsOf(selected, 'localIds').map(id => locais.find(item => item.id === id)).filter(Boolean) as Local[];

  const resourceCount =
    selectedScenes.length +
    selectedMaps.length +
    selectedClues.length +
    selectedHandouts.length +
    selectedNpcs.length +
    selectedAdversaries.length +
    selectedLocations.length;

  const renderToggleCard = (
    active: boolean,
    id: string,
    field: ResourceField,
    title: string,
    eyebrow: string,
    description?: string,
    image?: string,
    meta?: string
  ) => (
    <button
      type="button"
      key={id}
      className={`session-studio__resource-card ${active ? 'is-linked' : ''}`}
      onClick={() => void toggleResource(field, id)}
      disabled={!canManage}
    >
      <span className="session-studio__resource-media">
        {image ? <AssetImage src={image} alt="" /> : <FileImage size={22} />}
      </span>
      <span className="session-studio__resource-copy">
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
        {meta && <em>{meta}</em>}
      </span>
      <span className="session-studio__resource-state">{active ? <Check size={14} /> : <Plus size={14} />}</span>
    </button>
  );

  return (
    <section className="session-studio">
      <header className="session-studio__top">
        <div>
          <p className="ro-eyebrow">Preparação da mesa</p>
          <h2>Estúdio de Sessão</h2>
          <p>Organize a narrativa como uma sequência jogável: o que abre, o que pode ser revelado e quais recursos estarão à mão.</p>
        </div>
        {canManage && <button type="button" className="ro-button" onClick={onCreate}><Plus size={15} /> Nova sessão</button>}
      </header>

      <div className="session-studio__layout">
        <aside className="session-studio__timeline">
          <div className="session-studio__timeline-head">
            <span>Crônica</span>
            <strong>{orderedSessions.length} sessões</strong>
          </div>
          <div className="session-studio__timeline-list">
            {orderedSessions.map(sessao => {
              const progress = completionFor(sessao);
              const refs =
                (sessao.cenaIds?.length || 0) +
                (sessao.mapaIds?.length || 0) +
                (sessao.pistaIds?.length || 0) +
                (sessao.handoutIds?.length || 0) +
                (sessao.npcIds?.length || 0) +
                (sessao.adversarioIds?.length || 0) +
                (sessao.localIds?.length || 0);
              return (
                <button
                  type="button"
                  key={sessao.id}
                  className={`session-studio__session-tab ${selected.id === sessao.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedId(sessao.id)}
                >
                  <span className="session-studio__session-number">{String(sessao.numero).padStart(2, '0')}</span>
                  <span className="session-studio__session-copy">
                    <strong>{sessao.titulo}</strong>
                    <small>{statusLabel[sessao.status || (sessao.concluida ? 'concluida' : 'planejamento')]}</small>
                    <em>{refs} recursos · {progress.done}/{progress.total} pronto</em>
                  </span>
                  <ChevronRight size={14} />
                </button>
              );
            })}
          </div>
        </aside>

        <main className="session-studio__workspace">
          <section className="session-studio__hero">
            <div className="session-studio__hero-media">
              {coverUrl ? (
                <AssetImage src={coverUrl} fallbackSrc="/ro-login-mist-city.webp" alt="" />
              ) : (
                <div className="session-studio__hero-placeholder"><Sparkles size={28} /><span>Imagem da sessão</span></div>
              )}
              <div className="session-studio__hero-shade" />
              <div className="session-studio__hero-number">SESSÃO {String(selected.numero).padStart(2, '0')}</div>
            </div>

            <div className="session-studio__hero-copy">
              <div className="session-studio__hero-kicker">
                <span className={`session-studio__status is-${selected.status || 'planejamento'}`}>
                  {statusLabel[selected.status || 'planejamento']}
                </span>
                <span>{resourceCount} recursos vinculados</span>
              </div>

              <input
                className="session-studio__title-input"
                value={draftTitle}
                disabled={!canManage}
                onChange={event => setDraftTitle(event.target.value)}
                onBlur={() => draftTitle.trim() && draftTitle !== selected.titulo && void savePatch({ titulo: draftTitle.trim() })}
                aria-label="Título da sessão"
              />

              <textarea
                className="session-studio__description"
                value={draftDescription}
                disabled={!canManage}
                onChange={event => setDraftDescription(event.target.value)}
                onBlur={() => draftDescription !== (selected.descricao || '') && void savePatch({ descricao: draftDescription })}
                placeholder="Gancho, objetivo dramático e direção geral da sessão…"
                rows={3}
              />

              <div className="session-studio__meta-row">
                <label><CalendarDays size={13} /><input type="date" value={draftDate} disabled={!canManage} onChange={event => setDraftDate(event.target.value)} onBlur={() => draftDate !== selected.data && void savePatch({ data: draftDate })} /></label>
                <label>
                  <Shield size={13} />
                  <select
                    value={selected.status || 'planejamento'}
                    disabled={!canManage}
                    onChange={event => void savePatch({ status: event.target.value as SessaoStatus })}
                  >
                    {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>

              <div className="session-studio__readiness">
                <div>
                  <span>Prontidão da sessão</span>
                  <strong>{completion.done}/{completion.total}</strong>
                </div>
                <div className="session-studio__readiness-track">
                  {Array.from({ length: completion.total }).map((_, index) => <i key={index} className={index < completion.done ? 'is-filled' : ''} />)}
                </div>
                <small>{statusHint[selected.status || 'planejamento']}</small>
              </div>

              <div className="session-studio__hero-actions">
                <button type="button" className="ro-button" onClick={() => void onOpen(selected)}><Play size={15} /> Abrir esta sessão na Mesa</button>
                {canManage && (
                  <label className="ro-button--quiet session-studio__cover-upload">
                    <Upload size={14} /> Trocar imagem
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => void uploadSessionCover(event.target.files?.[0])} />
                  </label>
                )}
              </div>

              {canManage && (
                <div className="session-studio__cover-url">
                  <Link2 size={13} />
                  <input
                    value={coverUrl.startsWith('storage:') ? '' : coverUrl}
                    placeholder="ou cole uma URL para a imagem da sessão"
                    onChange={event => setCoverUrl(event.target.value)}
                    onBlur={() => {
                      if (!coverUrl.startsWith('storage:') && coverUrl !== (selected.imagemUrl || '')) void savePatch({ imagemUrl: coverUrl || undefined });
                    }}
                  />
                </div>
              )}
            </div>
          </section>

          <div className="session-studio__columns">
            <div className="session-studio__main-column">
              <section className="session-studio__section">
                <header className="session-studio__section-head">
                  <div><span>01 · Roteiro</span><h3>Cenas da sessão</h3><p>A primeira cena vinculada é tratada como a abertura quando a sessão entra na Mesa.</p></div>
                  {canManage && <button type="button" onClick={() => setQuickType('scene')}><Plus size={14} /> Criar cena</button>}
                </header>

                <div className="session-studio__sequence">
                  {selectedScenes.map((scene, index) => (
                    <article key={scene.id} className="session-studio__sequence-item">
                      <span className="session-studio__sequence-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="session-studio__sequence-thumb">{scene.imagemUrl ? <AssetImage src={scene.imagemUrl} alt="" /> : <Sparkles size={18} />}</span>
                      <div><small>{scene.tipoDeConteudo}{index === 0 ? ' · abertura' : ''}</small><strong>{scene.titulo}</strong><p>{scene.descricao || 'Sem descrição preparada.'}</p></div>
                      {canManage && (
                        <div className="session-studio__sequence-actions">
                          <button type="button" disabled={index === 0} onClick={() => void moveResource('cenaIds', scene.id, -1)}><ArrowUp size={13} /></button>
                          <button type="button" disabled={index === selectedScenes.length - 1} onClick={() => void moveResource('cenaIds', scene.id, 1)}><ArrowDown size={13} /></button>
                          <button type="button" onClick={() => void toggleResource('cenaIds', scene.id)}><X size={13} /></button>
                        </div>
                      )}
                    </article>
                  ))}
                  {selectedScenes.length === 0 && <p className="session-studio__empty">Nenhuma cena vinculada. Escolha uma cena da biblioteca abaixo ou crie a abertura agora.</p>}
                </div>

                <div className="session-studio__library-grid">
                  {cenas.map(scene => renderToggleCard(
                    idsOf(selected, 'cenaIds').includes(scene.id),
                    scene.id,
                    'cenaIds',
                    scene.titulo,
                    scene.tipoDeConteudo,
                    scene.descricao,
                    scene.imagemUrl
                  ))}
                  {cenas.length === 0 && <p className="session-studio__empty">A biblioteca de cenas ainda está vazia.</p>}
                </div>
              </section>

              <section className="session-studio__section">
                <header className="session-studio__section-head">
                  <div><span>02 · Espaço</span><h3>Mapas & cartografia</h3><p>Mapas ficam na biblioteca da campanha, mas podem ser apontados para sessões específicas. O primeiro é o mapa de abertura.</p></div>
                  {canManage && <button type="button" onClick={() => setQuickType('map')}><Plus size={14} /> Novo mapa</button>}
                </header>

                {selectedMaps.length > 0 && (
                  <div className="session-studio__map-strip">
                    {selectedMaps.map((mapa, index) => (
                      <article key={mapa.id} className="session-studio__map-selected">
                        <div>{mapVisual(mapa) ? <AssetImage src={mapVisual(mapa)} alt="" /> : <MapIcon size={24} />}</div>
                        <span>{index === 0 ? 'Mapa de abertura' : `Mapa ${index + 1}`}</span>
                        <strong>{mapa.titulo}</strong>
                        {canManage && (
                          <div>
                            <button type="button" disabled={index === 0} onClick={() => void moveResource('mapaIds', mapa.id, -1)}><ArrowUp size={13} /></button>
                            <button type="button" disabled={index === selectedMaps.length - 1} onClick={() => void moveResource('mapaIds', mapa.id, 1)}><ArrowDown size={13} /></button>
                            <button type="button" onClick={() => void toggleResource('mapaIds', mapa.id)}><X size={13} /></button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                <div className="session-studio__library-grid">
                  {mapas.map(mapa => renderToggleCard(
                    idsOf(selected, 'mapaIds').includes(mapa.id),
                    mapa.id,
                    'mapaIds',
                    mapa.titulo,
                    'mapa',
                    mapa.gradeVisivel ? 'Grade preparada' : 'Mapa narrativo',
                    mapVisual(mapa),
                    mapa.visibilidade === 'mestre_privado' ? 'Privado do Mestre' : 'Disponível para revelar'
                  ))}
                  {mapas.length === 0 && <p className="session-studio__empty">Nenhum mapa criado. Crie aqui sem precisar abrir a Mesa Ao Vivo.</p>}
                </div>
              </section>

              <section className="session-studio__section">
                <header className="session-studio__section-head">
                  <div><span>03 · Revelações</span><h3>Pistas & handouts</h3><p>Prepare o que poderá ser descoberto, entregue ou revelado durante esta sessão.</p></div>
                  {canManage && <div className="session-studio__head-actions"><button type="button" onClick={() => setQuickType('clue')}><Plus size={14} /> Pista</button><button type="button" onClick={() => setQuickType('handout')}><Plus size={14} /> Handout</button></div>}
                </header>

                <div className="session-studio__library-grid">
                  {pistas.map(pista => renderToggleCard(
                    idsOf(selected, 'pistaIds').includes(pista.id),
                    pista.id,
                    'pistaIds',
                    pista.titulo,
                    `pista · ${pista.tipo}`,
                    pista.descricao,
                    pista.imagemUrl,
                    pista.status
                  ))}
                  {handouts.map(handout => renderToggleCard(
                    idsOf(selected, 'handoutIds').includes(handout.id),
                    handout.id,
                    'handoutIds',
                    handout.titulo,
                    'handout',
                    handout.descricao,
                    undefined,
                    handout.storagePath || handout.arquivoUrl ? 'Arquivo anexado' : 'Sem arquivo'
                  ))}
                  {pistas.length === 0 && handouts.length === 0 && <p className="session-studio__empty">Nenhuma pista ou handout no arquivo da campanha.</p>}
                </div>
              </section>

              <section className="session-studio__section">
                <header className="session-studio__section-head">
                  <div><span>04 · Elenco</span><h3>Quem entra em cena</h3><p>Separe NPCs, ameaças e locais que o Mestre precisará consultar durante a sessão.</p></div>
                </header>

                <div className="session-studio__resource-groups">
                  <div>
                    <h4><Users size={14} /> NPCs <span>{selectedNpcs.length}</span></h4>
                    <div className="session-studio__library-grid">
                      {npcs.map(npc => renderToggleCard(idsOf(selected, 'npcIds').includes(npc.id), npc.id, 'npcIds', npc.nome, npc.papel || 'npc', npc.conceito || npc.descricao, npc.imagemUrl, npc.atitude))}
                      {npcs.length === 0 && <p className="session-studio__empty">Nenhum NPC cadastrado.</p>}
                    </div>
                  </div>
                  <div>
                    <h4><Shield size={14} /> Ameaças <span>{selectedAdversaries.length}</span></h4>
                    <div className="session-studio__library-grid">
                      {adversarios.map(adv => renderToggleCard(idsOf(selected, 'adversarioIds').includes(adv.id), adv.id, 'adversarioIds', adv.nome, `${adv.tipo} · nível ${adv.nivel}`, adv.descricao, adv.imagemUrl, `Defesa ${adv.defesa}`))}
                      {adversarios.length === 0 && <p className="session-studio__empty">Nenhuma ameaça cadastrada.</p>}
                    </div>
                  </div>
                  <div>
                    <h4><MapIcon size={14} /> Locais <span>{selectedLocations.length}</span></h4>
                    <div className="session-studio__library-grid">
                      {locais.map(local => renderToggleCard(idsOf(selected, 'localIds').includes(local.id), local.id, 'localIds', local.nome, local.tipo, local.descricao, local.imagemUrl, local.anomaliaDetectada))}
                      {locais.length === 0 && <p className="session-studio__empty">Nenhum local cadastrado.</p>}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="session-studio__side-column">
              <section className="session-studio__notes">
                <header><ScrollText size={15} /><div><span>Privado do Mestre</span><strong>Notas de condução</strong></div></header>
                <textarea
                  value={draftNotes}
                  disabled={!canManage}
                  onChange={event => setDraftNotes(event.target.value)}
                  onBlur={() => draftNotes !== (selected.anotacoesMestre || '') && void savePatch({ anotacoesMestre: draftNotes })}
                  placeholder="Batidas dramáticas, segredos, gatilhos, consequências, lembretes…"
                  rows={14}
                />
                <small>Estas notas não são reveladas aos jogadores.</small>
              </section>

              <section className="session-studio__checklist">
                <span>Checklist da Vigília</span>
                {[
                  ['Roteiro', Boolean(selected.cenaIds?.length)],
                  ['Visual / mapa', Boolean(selected.imagemUrl || selected.mapaIds?.length)],
                  ['Pistas / handouts', Boolean(selected.pistaIds?.length || selected.handoutIds?.length)],
                  ['Elenco / locais', Boolean(selected.npcIds?.length || selected.adversarioIds?.length || selected.localIds?.length)],
                  ['Notas do Mestre', Boolean(selected.anotacoesMestre?.trim())]
                ].map(([label, done]) => (
                  <div key={String(label)} className={done ? 'is-done' : ''}>
                    <i>{done ? <Check size={11} /> : null}</i>
                    <span>{String(label)}</span>
                  </div>
                ))}
              </section>
            </aside>
          </div>
        </main>
      </div>

      {quickType && canManage && (
        <div className="session-studio__modal-backdrop" onMouseDown={resetQuick}>
          <form className="session-studio__quick-modal" onSubmit={createAndLink} onMouseDown={event => event.stopPropagation()}>
            <header>
              <div>
                <p className="ro-eyebrow">Criar e vincular</p>
                <h3>{quickType === 'scene' ? 'Nova cena' : quickType === 'map' ? 'Novo mapa' : quickType === 'clue' ? 'Nova pista' : 'Novo handout'}</h3>
              </div>
              <button type="button" onClick={resetQuick}><X size={17} /></button>
            </header>

            <label>Título<input autoFocus value={quickTitle} onChange={event => setQuickTitle(event.target.value)} required /></label>
            <label>Descrição<textarea value={quickDescription} onChange={event => setQuickDescription(event.target.value)} rows={4} /></label>

            <div className="session-studio__quick-grid">
              <label>Visibilidade
                <select value={quickVisibility} onChange={event => setQuickVisibility(event.target.value as VisibilidadeConteudo)}>
                  <option value="mestre_privado">Mestre privado</option>
                  <option value="compartilhado">Compartilhado</option>
                  <option value="revelado_jogadores">Revelado aos jogadores</option>
                </select>
              </label>
              <label>URL opcional<input value={quickUrl} onChange={event => { setQuickUrl(event.target.value); if (event.target.value) setQuickFile(null); }} placeholder="https://…" /></label>
            </div>

            <label className="session-studio__dropzone">
              <Upload size={18} />
              <span>{quickFile ? quickFile.name : quickType === 'handout' ? 'Anexar arquivo' : 'Anexar imagem'}</span>
              <small>{quickType === 'handout' ? 'PDF, imagem ou arquivo de apoio' : 'PNG, JPG, WEBP ou GIF · até 15 MB'}</small>
              <input
                type="file"
                accept={quickType === 'handout' ? undefined : 'image/png,image/jpeg,image/webp,image/gif'}
                onChange={event => setQuickFile(event.target.files?.[0] || null)}
              />
            </label>

            <footer>
              <button type="button" className="ro-button--quiet" onClick={resetQuick}>Cancelar</button>
              <button type="submit" className="ro-button" disabled={quickBusy}>{quickBusy ? 'Salvando…' : 'Criar e vincular'}</button>
            </footer>
          </form>
        </div>
      )}

      {message && <p className="session-studio__message" role="status">{message}</p>}
    </section>
  );
};
