import React, { useEffect, useState } from 'react';
import { Campanha, Sessao, NPC, Adversario, Local, Pista, LoreEntry, Anotacao, NovaSessaoInput, SessaoStatus, MembroCampanha, Cena, Handout } from '../types/campaign';
import { Personagem } from '../types/character';
import { SessionPlanner } from './campaign/SessionPlanner';
import { CampaignMembersPanel } from './campaign/CampaignMembersPanel';
import { CampaignAssetsPanel } from './campaign/CampaignAssetsPanel';
import { CampaignActorsPanel } from './campaign/CampaignActorsPanel';
import { AssetImage } from './system/AssetImage';
import { BookOpen, CalendarPlus, Check, Compass, Copy, MapPinned, Play, Search, ScrollText, Sparkles, Users } from 'lucide-react';

export type CampaignTabType = 
  | 'visao_geral'
  | 'sessoes'
  | 'personagens'
  | 'npcs'
  | 'adversarios'
  | 'locais'
  | 'pistas'
  | 'cenas'
  | 'mapas'
  | 'handouts'
  | 'lore'
  | 'anotacoes'
  | 'configuracoes';

const MASTER_ONLY_TABS = new Set<CampaignTabType>(['sessoes', 'anotacoes', 'configuracoes']);

interface CampaignDetailViewProps {
  campanha: Campanha;
  personagens: Personagem[];
  sessoes: Sessao[];
  npcs: NPC[];
  adversarios: Adversario[];
  locais: Local[];
  pistas: Pista[];
  loreEntries: LoreEntry[];
  anotacoes: Anotacao[];
  cenas: Cena[];
  handouts: Handout[];
  onIniciarSessao: (campanha: Campanha) => void;
  onAbrirFichaPersonagem: (personagem: Personagem) => void;
  onNovaSessao: (campanhaId: string, dados: NovaSessaoInput) => void;
  onAdicionarNPC: (npc: Omit<NPC, 'id'>) => Promise<unknown> | unknown;
  onAtualizarNPC: (id: string, patch: Partial<NPC>) => Promise<unknown> | unknown;
  onRemoverNPC: (id: string) => Promise<unknown> | unknown;
  onAdicionarAdversario: (adv: Omit<Adversario, 'id'>) => Promise<unknown> | unknown;
  onAtualizarAdversario: (id: string, patch: Partial<Adversario>) => Promise<unknown> | unknown;
  onRemoverAdversario: (id: string) => Promise<unknown> | unknown;
  onAdicionarLocal: (loc: Omit<Local, 'id'>) => void;
  onAdicionarPista: (pista: Omit<Pista, 'id'>) => void;
  onAdicionarLore: (lore: Omit<LoreEntry, 'id'>) => void;
  onAdicionarAnotacao: (campanhaId: string, titulo: string, conteudo: string) => void;
  onAdicionarCena: (cena: Omit<Cena, 'id'>) => Promise<unknown> | unknown;
  onAtualizarCena: (id: string, patch: Partial<Cena>) => Promise<unknown> | unknown;
  onRemoverCena: (id: string) => Promise<unknown> | unknown;
  onAdicionarHandout: (handout: Omit<Handout, 'id'>) => Promise<unknown> | unknown;
  onAtualizarHandout: (id: string, patch: Partial<Handout>) => Promise<unknown> | unknown;
  onRemoverHandout: (id: string) => Promise<unknown> | unknown;
  membros?: MembroCampanha[];
  currentUserId?: string;
  canManageMembers?: boolean;
  onRegenerarCodigo?: (campaignId: string) => Promise<string>;
  onAtualizarMembro?: (campaignId: string, userId: string, patch: { role?: MembroCampanha['role']; status?: MembroCampanha['status']; characterId?: string | null }) => Promise<void>;
  onExcluirCampanha?: (id: string) => void;
}

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campanha,
  personagens,
  sessoes,
  npcs,
  adversarios,
  locais,
  pistas,
  loreEntries,
  anotacoes,
  cenas,
  handouts,
  onIniciarSessao,
  onAbrirFichaPersonagem,
  onNovaSessao,
  onAdicionarNPC,
  onAtualizarNPC,
  onRemoverNPC,
  onAdicionarAdversario,
  onAtualizarAdversario,
  onRemoverAdversario,
  onAdicionarLocal,
  onAdicionarPista,
  onAdicionarLore,
  onAdicionarAnotacao,
  onAdicionarCena,
  onAtualizarCena,
  onRemoverCena,
  onAdicionarHandout,
  onAtualizarHandout,
  onRemoverHandout,
  membros = [],
  currentUserId,
  canManageMembers = false,
  onRegenerarCodigo,
  onAtualizarMembro,
  onExcluirCampanha
}) => {
  const [abaAtiva, setAbaAtiva] = useState<CampaignTabType>('visao_geral');
  
  // Estados para modais simples de adição rápida
  const [modalNovaSessao, setModalNovaSessao] = useState(false);
  const [tituloNovaSessao, setTituloNovaSessao] = useState('');
  const [descricaoNovaSessao, setDescricaoNovaSessao] = useState('');
  const [dataNovaSessao, setDataNovaSessao] = useState('');
  const [statusNovaSessao, setStatusNovaSessao] = useState<SessaoStatus>('planejamento');
  const [notasMestreNovaSessao, setNotasMestreNovaSessao] = useState('');

  const [modalNovoItem, setModalNovoItem] = useState<CampaignTabType | null>(null);
  const [itemNome, setItemNome] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemExtra, setItemExtra] = useState('');
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  const sessoesCampanha = sessoes
    .filter(s => s.campanhaId === campanha.id)
    .slice()
    .sort((a, b) => b.numero - a.numero);
  const ultimaSessao = sessoesCampanha[0] || null;
  const npcsCampanha = npcs.filter(n => n.campanhaId === campanha.id);
  const adversariosCampanha = adversarios.filter(a => a.campanhaId === campanha.id);
  const locaisCampanha = locais.filter(l => l.campanhaId === campanha.id);
  const pistasCampanha = pistas.filter(p => p.campanhaId === campanha.id);
  const loreCampanha = loreEntries.filter(l => l.campanhaId === campanha.id);
  const anotacoesCampanha = anotacoes.filter(a => a.campanhaId === campanha.id);
  const cenasCampanha = cenas.filter(item => item.campanhaId === campanha.id);
  const handoutsCampanha = handouts.filter(item => item.campanhaId === campanha.id);
  const membrosAtivos = membros.filter(membro => membro.status === 'ativo');
  const totalMembros = membrosAtivos.length || campanha.jogadoresCount || personagens.length || 0;
  const sessaoEmAberto = sessoesCampanha.find(sessao => sessao.status && sessao.status !== 'concluida') || null;
  const totalArquivo = pistasCampanha.length + locaisCampanha.length + npcsCampanha.length + adversariosCampanha.length + cenasCampanha.length + handoutsCampanha.length;
  const statusCampanha = campanha.status === 'concluida'
    ? 'Concluída'
    : campanha.status === 'planejamento'
      ? 'Planejamento'
      : 'Em andamento';

  const handleCopiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(campanha.codigo);
      setCodigoCopiado(true);
      window.setTimeout(() => setCodigoCopiado(false), 1800);
    } catch {
      setCodigoCopiado(false);
    }
  };

  const handleCriarSessaoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNovaSessao.trim()) return;
    onNovaSessao(campanha.id, {
      titulo: tituloNovaSessao,
      descricao: descricaoNovaSessao,
      data: dataNovaSessao,
      status: statusNovaSessao,
      anotacoesMestre: notasMestreNovaSessao
    });
    setTituloNovaSessao('');
    setDescricaoNovaSessao('');
    setDataNovaSessao('');
    setStatusNovaSessao('planejamento');
    setNotasMestreNovaSessao('');
    setModalNovaSessao(false);
  };

  const handleCriarItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNome.trim() || !modalNovoItem) return;

    if (modalNovoItem === 'npcs') {
      onAdicionarNPC({
        campanhaId: campanha.id,
        nome: itemNome.trim(),
        papel: itemExtra.trim() || 'Desconhecido',
        conceito: itemExtra.trim(),
        descricao: itemDesc.trim(),
        atitude: 'neutro',
        localizacao: ''
      });
    } else if (modalNovoItem === 'adversarios') {
      onAdicionarAdversario({
        campanhaId: campanha.id,
        nome: itemNome.trim(),
        tipo: 'pesadelo',
        nivel: 1,
        vida: 6,
        vidaMaxima: 6,
        defesa: 10,
        resistencia: 7,
        ataquePrincipal: itemExtra.trim(),
        descricao: itemDesc.trim()
      });
    } else if (modalNovoItem === 'locais') {
      onAdicionarLocal({
        campanhaId: campanha.id,
        nome: itemNome.trim(),
        tipo: 'fronteira',
        descricao: itemDesc.trim(),
        anomaliaDetectada: itemExtra.trim()
      });
    } else if (modalNovoItem === 'pistas') {
      onAdicionarPista({
        campanhaId: campanha.id,
        titulo: itemNome.trim(),
        tipo: 'documento',
        status: 'descoberta',
        descricao: itemDesc.trim()
      });
    } else if (modalNovoItem === 'lore') {
      onAdicionarLore({
        campanhaId: campanha.id,
        titulo: itemNome.trim(),
        categoria: 'mundo',
        conteudo: itemDesc.trim()
      });
    } else if (modalNovoItem === 'anotacoes') {
      onAdicionarAnotacao(campanha.id, itemNome.trim(), itemDesc.trim());
    }

    setItemNome('');
    setItemDesc('');
    setItemExtra('');
    setModalNovoItem(null);
  };

  const tabsBase: { id: CampaignTabType; label: string }[] = [
    { id: 'visao_geral', label: 'Visão Geral' },
    { id: 'sessoes', label: 'Sessões' },
    { id: 'personagens', label: 'Personagens' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'adversarios', label: 'Adversários' },
    { id: 'locais', label: 'Locais' },
    { id: 'pistas', label: 'Pistas' },
    { id: 'cenas', label: 'Cenas' },
    { id: 'mapas', label: 'Mapas' },
    { id: 'handouts', label: 'Arquivos' },
    { id: 'lore', label: 'Lore' },
    { id: 'anotacoes', label: 'Anotações' },
    { id: 'configuracoes', label: 'Configurações' }
  ];

  const tabs = canManageMembers ? tabsBase : tabsBase.filter(tab => !MASTER_ONLY_TABS.has(tab.id));

  useEffect(() => {
    if (!canManageMembers && MASTER_ONLY_TABS.has(abaAtiva)) setAbaAtiva('visao_geral');
  }, [abaAtiva, canManageMembers]);

  return (
    <div className="campaign-v4 w-full flex flex-col pb-20">
      {/* Centro de comando da campanha */}
      <section className="campaign-v5__hero">
        <div className="campaign-v5__hero-copy">
          <div className="campaign-v5__hero-kicker">
            <span>{campanha.tipo === 'oneshot' ? 'One-shot' : campanha.tipo === 'playtest' ? 'Playtest' : 'Campanha'}</span>
            <i />
            <span>{canManageMembers ? 'Visão do Mestre' : 'Crônica ativa'}</span>
          </div>

          <h1>{campanha.nome}</h1>
          <p>{campanha.descricao || 'Uma nova crônica aguarda os primeiros registros do Mestre.'}</p>

          <div className="campaign-v5__hero-meta">
            <span><Users /> {totalMembros} {totalMembros === 1 ? 'membro' : 'membros'}</span>
            <span><BookOpen /> {sessoesCampanha.length} {sessoesCampanha.length === 1 ? 'sessão' : 'sessões'}</span>
            <span><Sparkles /> Ruptura {campanha.rupturaGeral}/6</span>
            <span className="is-status">{statusCampanha}</span>
          </div>

          <div className="campaign-v5__hero-actions">
            <button type="button" className="campaign-v5__primary" onClick={() => onIniciarSessao(campanha)}>
              <Play />
              {ultimaSessao ? 'Continuar mesa' : 'Abrir Mesa Ao Vivo'}
            </button>
            {canManageMembers && (
              <button type="button" className="campaign-v5__secondary" onClick={() => setModalNovaSessao(true)}>
                <CalendarPlus />
                Nova sessão
              </button>
            )}
          </div>
        </div>

        <div className="campaign-v5__hero-art" aria-hidden="true">
          <div className="campaign-v5__hero-backdrop">
            <AssetImage src={campanha.imagemUrl} fallbackSrc="/ro-login-mist-city.webp" alt="" />
          </div>
          <div className="campaign-v5__art campaign-v5__art--city" />
          <div className="campaign-v5__hero-sigil"><img src="/ro-mark.svg" alt="" /></div>
        </div>
      </section>

      {/* Navegação de Abas (Visão Geral, Sessões, Personagens, etc.) */}
      <nav className="w-full border-b border-[var(--ro-line)] bg-[var(--ro-bg)] sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-1 overflow-x-auto py-1.5 [scrollbar-width:none]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id)}
              className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap rounded-sm ${
                abaAtiva === tab.id
                  ? 'text-[var(--ro-paper)] bg-[var(--ro-surface-raised)] border-b-2 border-[var(--ro-line-strong)]'
                  : 'text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)] hover:bg-[var(--ro-surface)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo da Aba */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-9 w-full">
        {/* ABA: VISÃO GERAL */}
        {abaAtiva === 'visao_geral' && (
          <div className="campaign-v5__overview">
            <section className="campaign-v5__overview-grid">
              <article className="campaign-v5__next-session">
                <div className="campaign-v5__card-copy">
                  <p className="ro-eyebrow">{ultimaSessao ? 'Último registro da crônica' : 'Comece por aqui'}</p>
                  <h2>{ultimaSessao ? ultimaSessao.titulo : 'Prepare a primeira sessão'}</h2>
                  <p>
                    {ultimaSessao
                      ? ultimaSessao.resumo || ultimaSessao.descricao || 'A sessão já possui um registro. Continue a mesa ou organize o próximo capítulo.'
                      : 'Crie a primeira sessão para reunir cenas, anotações e o fluxo que será usado quando a mesa começar.'}
                  </p>

                  <div className="campaign-v5__next-meta">
                    {ultimaSessao ? (
                      <>
                        <span>Sessão #{String(ultimaSessao.numero).padStart(2, '0')}</span>
                        <span>{ultimaSessao.data || 'Sem data definida'}</span>
                        <span>{ultimaSessao.status || (ultimaSessao.concluida ? 'concluída' : 'em andamento')}</span>
                      </>
                    ) : (
                      <>
                        <span>0 sessões</span>
                        <span>Planejamento inicial</span>
                      </>
                    )}
                  </div>

                  <div className="campaign-v5__card-actions">
                    <button type="button" className="campaign-v5__primary" onClick={() => ultimaSessao ? onIniciarSessao(campanha) : setModalNovaSessao(true)}>
                      {ultimaSessao ? <Play /> : <CalendarPlus />}
                      {ultimaSessao ? 'Continuar na mesa' : 'Criar primeira sessão'}
                    </button>
                    {ultimaSessao && canManageMembers && (
                      <button type="button" className="campaign-v5__text-action" onClick={() => setAbaAtiva('sessoes')}>
                        Ver sessões →
                      </button>
                    )}
                  </div>
                </div>
                <div className="campaign-v5__art campaign-v5__art--desk" aria-hidden="true" />
              </article>

              <article className="campaign-v5__chronicle">
                <div className="campaign-v5__chronicle-head">
                  <div>
                    <p className="ro-eyebrow">Pulso da crônica</p>
                    <h3>{statusCampanha}</h3>
                  </div>
                  <Compass />
                </div>

                <div className="campaign-v5__chronicle-stats">
                  <div><strong>{campanha.rupturaGeral}</strong><span>Ruptura / 6</span></div>
                  <div><strong>{totalMembros}</strong><span>Membros</span></div>
                  <div><strong>{totalArquivo}</strong><span>Registros</span></div>
                  <div><strong>{sessaoEmAberto ? '01' : '00'}</strong><span>Sessão aberta</span></div>
                </div>

                <div className="campaign-v5__rupture-track" aria-label={`Ruptura ${campanha.rupturaGeral} de 6`}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <i key={index} className={index < campanha.rupturaGeral ? 'is-filled' : ''} />
                  ))}
                </div>
                <div className="campaign-v5__art campaign-v5__art--compass" aria-hidden="true" />
              </article>
            </section>

            <section className="campaign-v5__command-grid">
              <article className="campaign-v5__invite">
                <div className="campaign-v5__invite-copy">
                  <p className="ro-eyebrow">Convide sua mesa</p>
                  <h3>Código da campanha</h3>
                  <p>Envie este código para os jogadores entrarem diretamente nesta crônica.</p>

                  <button type="button" className="campaign-v5__code" onClick={handleCopiarCodigo}>
                    <span>{campanha.codigo}</span>
                    {codigoCopiado ? <Check /> : <Copy />}
                  </button>
                  <small>{codigoCopiado ? 'Código copiado.' : 'Clique no código para copiar.'}</small>
                </div>
                <div className="campaign-v5__art campaign-v5__art--invite" aria-hidden="true" />
              </article>

              <article className="campaign-v5__party">
                <div className="campaign-v5__section-title">
                  <div>
                    <p className="ro-eyebrow">Desvelados vinculados</p>
                    <h3>{personagens.length ? `${personagens.length} na crônica` : 'A mesa ainda está vazia'}</h3>
                  </div>
                  <button type="button" onClick={() => setAbaAtiva('personagens')}>Ver todos →</button>
                </div>

                {personagens.length ? (
                  <div className="campaign-v5__party-list">
                    {personagens.slice(0, 3).map(pj => (
                      <button key={pj.id} type="button" onClick={() => onAbrirFichaPersonagem(pj)}>
                        <span className="campaign-v5__avatar">{pj.nome.slice(0, 2).toUpperCase()}</span>
                        <span>
                          <strong>{pj.nome}</strong>
                          <small>{pj.conceito} · Nível {pj.nivel}</small>
                        </span>
                        <em>{pj.vidaAtual}/{pj.vidaMaxima} V</em>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="campaign-v5__empty-copy">
                    <p>Quando os jogadores entrarem com o código e vincularem seus personagens, eles aparecerão aqui.</p>
                  </div>
                )}
                <div className="campaign-v5__art campaign-v5__art--portrait" aria-hidden="true" />
              </article>

              <article className="campaign-v5__quick">
                <div className="campaign-v5__section-title">
                  <div>
                    <p className="ro-eyebrow">Atalhos do Mestre</p>
                    <h3>Prepare sem perder o fluxo.</h3>
                  </div>
                </div>

                <div className="campaign-v5__quick-actions">
                  {canManageMembers && (
                    <button type="button" onClick={() => setModalNovaSessao(true)}>
                      <CalendarPlus /><span><strong>Nova sessão</strong><small>Planeje o próximo capítulo.</small></span>
                    </button>
                  )}
                  <button type="button" onClick={() => setAbaAtiva('pistas')}>
                    <Search /><span><strong>Pistas</strong><small>{pistasCampanha.length} registradas.</small></span>
                  </button>
                  <button type="button" onClick={() => setAbaAtiva('cenas')}>
                    <ScrollText /><span><strong>Cenas</strong><small>{cenasCampanha.length} preparadas.</small></span>
                  </button>
                  <button type="button" onClick={() => setAbaAtiva('mapas')}>
                    <MapPinned /><span><strong>Mapas</strong><small>Abra o espaço de mapas.</small></span>
                  </button>
                  {canManageMembers && (
                    <button type="button" onClick={() => setAbaAtiva('configuracoes')}>
                      <Users /><span><strong>Membros</strong><small>Convites, funções e personagens.</small></span>
                    </button>
                  )}
                </div>
              </article>
            </section>

            <section className="campaign-v5__records">
              <div className="campaign-v5__records-head">
                <div>
                  <p className="ro-eyebrow">Arquivo ativo</p>
                  <h2>O que já existe nesta crônica</h2>
                </div>
                <div className="campaign-v5__art campaign-v5__art--city-small" aria-hidden="true" />
              </div>

              <div className="campaign-v5__record-grid">
                <button type="button" onClick={() => setAbaAtiva('pistas')}><strong>{pistasCampanha.length}</strong><span>Pistas</span></button>
                <button type="button" onClick={() => setAbaAtiva('locais')}><strong>{locaisCampanha.length}</strong><span>Locais</span></button>
                <button type="button" onClick={() => setAbaAtiva('npcs')}><strong>{npcsCampanha.length}</strong><span>NPCs</span></button>
                <button type="button" onClick={() => setAbaAtiva('adversarios')}><strong>{adversariosCampanha.length}</strong><span>Adversários</span></button>
                <button type="button" onClick={() => setAbaAtiva('cenas')}><strong>{cenasCampanha.length}</strong><span>Cenas</span></button>
                <button type="button" onClick={() => setAbaAtiva('handouts')}><strong>{handoutsCampanha.length}</strong><span>Arquivos</span></button>
              </div>
            </section>
          </div>
        )}

        {/* 21. ABA: SESSÕES */}
        {abaAtiva === 'sessoes' && (
          <SessionPlanner
            sessoes={sessoesCampanha}
            onCreate={() => setModalNovaSessao(true)}
            onOpen={() => onIniciarSessao(campanha)}
          />
        )}

        {abaAtiva === 'cenas' && (
          <CampaignAssetsPanel
            campaignId={campanha.id}
            mode="cenas"
            scenes={cenasCampanha}
            handouts={handoutsCampanha}
            canManage={canManageMembers}
            onAddScene={onAdicionarCena}
            onUpdateScene={onAtualizarCena}
            onRemoveScene={onRemoverCena}
            onAddHandout={onAdicionarHandout}
            onUpdateHandout={onAtualizarHandout}
            onRemoveHandout={onRemoverHandout}
          />
        )}

        {abaAtiva === 'handouts' && (
          <CampaignAssetsPanel
            campaignId={campanha.id}
            mode="handouts"
            scenes={cenasCampanha}
            handouts={handoutsCampanha}
            canManage={canManageMembers}
            onAddScene={onAdicionarCena}
            onUpdateScene={onAtualizarCena}
            onRemoveScene={onRemoverCena}
            onAddHandout={onAdicionarHandout}
            onUpdateHandout={onAtualizarHandout}
            onRemoveHandout={onRemoverHandout}
          />
        )}

        {abaAtiva === 'mapas' && (
          <section className="campaign-assets">
            <header className="campaign-assets__head">
              <div><p className="ro-eyebrow">Cartografia narrativa</p><h2>Mapas da campanha</h2></div>
            </header>
            <div className="campaign-assets__card">
              <p>Mapas são administrados diretamente na Mesa Ao Vivo, onde zoom, pan, grade, visibilidade e tokens permanecem sincronizados em Realtime.</p>
              <button type="button" className="ro-button mt-4" onClick={() => onIniciarSessao(campanha)}>Abrir Mesa Ao Vivo →</button>
            </div>
          </section>
        )}

        {/* 22. ABA: PERSONAGENS */}
        {abaAtiva === 'personagens' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ro-line)]">
              <div>
                <h2 className="font-serif text-2xl text-[var(--ro-paper)]">Personagens Desvelados</h2>
                <p className="text-xs text-[var(--ro-ash)] mt-0.5">Membros do grupo nesta crônica.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {personagens.map(pj => (
                <div
                  key={pj.id}
                  onClick={() => onAbrirFichaPersonagem(pj)}
                  className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-5 rounded-sm hover:border-[var(--ro-line-strong)] cursor-pointer transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Retrato sutil */}
                    <div className="h-32 bg-[var(--ro-bg)] border border-[var(--ro-line)] mb-4 flex items-center justify-center text-2xl font-serif text-[var(--ro-copper)]">
                      {pj.nome.slice(0, 1)}
                    </div>

                    <h3 className="font-serif text-xl text-[var(--ro-paper)] font-normal leading-snug">
                      {pj.nome}
                    </h3>
                    <p className="text-[11px] font-mono text-[var(--ro-ash)] mt-1 uppercase tracking-wider">
                      {pj.conceito} · Nível {pj.nivel}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--ro-line)] space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[var(--ro-paper-muted)]">
                      <span className="text-[var(--ro-ash)] uppercase text-[10px]">Vida</span>
                      <span>{pj.vidaAtual} / {pj.vidaMaxima}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--ro-paper-muted)]">
                      <span className="text-[var(--ro-ash)] uppercase text-[10px]">Ruptura</span>
                      <span className={pj.ruptura >= 4 ? 'text-[var(--ro-paper)]' : 'text-[var(--ro-copper)]'}>
                        {pj.ruptura} / 6
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 23. ABA: NPCs */}
        {abaAtiva === 'npcs' && (
          <CampaignActorsPanel
            mode="npc"
            campanhaId={campanha.id}
            npcs={npcsCampanha}
            adversarios={adversariosCampanha}
            canManage={canManageMembers}
            onAddNpc={onAdicionarNPC}
            onUpdateNpc={onAtualizarNPC}
            onRemoveNpc={onRemoverNPC}
            onAddAdversary={onAdicionarAdversario}
            onUpdateAdversary={onAtualizarAdversario}
            onRemoveAdversary={onRemoverAdversario}
          />
        )}

        {/* ABA: ADVERSÁRIOS */}
        {abaAtiva === 'adversarios' && (
          <CampaignActorsPanel
            mode="adversario"
            campanhaId={campanha.id}
            npcs={npcsCampanha}
            adversarios={adversariosCampanha}
            canManage={canManageMembers}
            onAddNpc={onAdicionarNPC}
            onUpdateNpc={onAtualizarNPC}
            onRemoveNpc={onRemoverNPC}
            onAddAdversary={onAdicionarAdversario}
            onUpdateAdversary={onAtualizarAdversario}
            onRemoveAdversary={onRemoverAdversario}
          />
        )}

        {/* ABA: LOCAIS */}
        {abaAtiva === 'locais' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ro-line)]">
              <div>
                <h2 className="font-serif text-2xl text-[var(--ro-paper)]">Locais & Fronteiras</h2>
                <p className="text-xs text-[var(--ro-ash)] mt-0.5">Espaços urbanos onde o Sonhar se manifesta.</p>
              </div>
              {canManageMembers && (<button
                onClick={() => setModalNovoItem('locais')}
                className="px-4 py-2 bg-[var(--ro-surface-raised)] hover:bg-[var(--ro-accent-soft)] text-[var(--ro-paper)] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[var(--ro-line-strong)]"
              >
                + Novo Local
              </button>)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locaisCampanha.map(loc => (
                <div key={loc.id} className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-4 sm:p-5 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl text-[var(--ro-paper)] font-normal">{loc.nome}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[var(--ro-bg)] border border-[var(--ro-line)] text-[var(--ro-copper)]">
                      {loc.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ro-paper-muted)]/80 leading-relaxed">{loc.descricao}</p>
                  {loc.anomaliaDetectada && (
                    <div className="p-3 bg-[var(--ro-bg)] border border-[var(--ro-line)] text-xs font-mono text-[var(--ro-ash)]">
                      <span className="text-[var(--ro-copper)]">Anomalia: </span>
                      {loc.anomaliaDetectada}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: PISTAS */}
        {abaAtiva === 'pistas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ro-line)]">
              <div>
                <h2 className="font-serif text-2xl text-[var(--ro-paper)]">Pistas & Evidências</h2>
                <p className="text-xs text-[var(--ro-ash)] mt-0.5">Documentos, gravações e objetos anômalos.</p>
              </div>
              {canManageMembers && (<button
                onClick={() => setModalNovoItem('pistas')}
                className="px-4 py-2 bg-[var(--ro-surface-raised)] hover:bg-[var(--ro-accent-soft)] text-[var(--ro-paper)] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[var(--ro-line-strong)]"
              >
                + Nova Pista
              </button>)}
            </div>

            <div className="space-y-4">
              {pistasCampanha.map(pista => (
                <div key={pista.id} className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-4 sm:p-5 rounded-sm flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[var(--ro-bg)] border border-[var(--ro-line)] text-[var(--ro-copper)]">
                        {pista.tipo}
                      </span>
                      <span className="text-xs font-mono text-[var(--ro-ash)]">
                        Status: {pista.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-[var(--ro-paper)] font-normal">{pista.titulo}</h3>
                    <p className="text-xs text-[var(--ro-paper-muted)]/80 mt-2 leading-relaxed">{pista.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: LORE */}
        {abaAtiva === 'lore' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ro-line)]">
              <div>
                <h2 className="font-serif text-2xl text-[var(--ro-paper)]">Arquivos de Lore & Conhecimento</h2>
                <p className="text-xs text-[var(--ro-ash)] mt-0.5">Tradição, leis do Sonhar e facções urbanas.</p>
              </div>
              {canManageMembers && (<button
                onClick={() => setModalNovoItem('lore')}
                className="px-4 py-2 bg-[var(--ro-surface-raised)] hover:bg-[var(--ro-accent-soft)] text-[var(--ro-paper)] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[var(--ro-line-strong)]"
              >
                + Novo Arquivo
              </button>)}
            </div>

            <div className="space-y-4">
              {loreCampanha.map(lore => (
                <div key={lore.id} className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-4 sm:p-5 rounded-sm space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ro-copper)]">
                    {lore.categoria}
                  </span>
                  <h3 className="font-serif text-2xl text-[var(--ro-paper)] font-normal">{lore.titulo}</h3>
                  <p className="text-xs text-[var(--ro-paper-muted)]/80 leading-relaxed">{lore.conteudo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: ANOTAÇÕES */}
        {abaAtiva === 'anotacoes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ro-line)]">
              <div>
                <h2 className="font-serif text-2xl text-[var(--ro-paper)]">Anotações do Narrador</h2>
                <p className="text-xs text-[var(--ro-ash)] mt-0.5">Planejamento secreto e notas da crônica.</p>
              </div>
              {canManageMembers && (<button
                onClick={() => setModalNovoItem('anotacoes')}
                className="px-4 py-2 bg-[var(--ro-surface-raised)] hover:bg-[var(--ro-accent-soft)] text-[var(--ro-paper)] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[var(--ro-line-strong)]"
              >
                + Nova Anotação
              </button>)}
            </div>

            <div className="space-y-4">
              {anotacoesCampanha.map(nota => (
                <div key={nota.id} className="bg-[var(--ro-surface)] border border-[var(--ro-line)] p-4 sm:p-5 rounded-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--ro-ash)]">
                    <span>{nota.atualizadaEm}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-[var(--ro-paper)] font-normal">{nota.titulo}</h3>
                  <p className="text-xs text-[var(--ro-paper-muted)]/80 leading-relaxed whitespace-pre-line">{nota.conteudo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: CONFIGURAÇÕES */}
        {abaAtiva === 'configuracoes' && (
          <div className="max-w-2xl space-y-8">
            <div className="pb-4 border-b border-[var(--ro-line)]">
              <h2 className="font-serif text-2xl text-[var(--ro-paper)]">Configurações da Campanha</h2>
              <p className="text-xs text-[var(--ro-ash)] mt-0.5">Identificadores e sincronização da crônica.</p>
            </div>

            <div className="space-y-6">
              {membros.length > 0 && (
                <CampaignMembersPanel
                  campaignId={campanha.id}
                  members={membros}
                  inviteCode={campanha.codigo}
                  currentUserId={currentUserId}
                  characters={personagens}
                  canManage={canManageMembers}
                  onRegenerateInvite={onRegenerarCodigo}
                  onUpdateMember={onAtualizarMembro}
                />
              )}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--ro-ash)] mb-2">
                  Código de Conexão da Mesa
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={campanha.codigo}
                    className="bg-[var(--ro-surface)] border border-[var(--ro-line)] px-4 py-2.5 text-xs font-mono text-[var(--ro-paper)] rounded-sm w-48"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(campanha.codigo)}
                    className="px-4 py-2.5 bg-[var(--ro-surface-raised)] hover:bg-[var(--ro-accent-soft)] text-xs text-[var(--ro-paper-muted)] rounded-sm border border-[var(--ro-line)]"
                  >
                    Copiar Código
                  </button>
                </div>
                <p className="text-[11px] text-[var(--ro-ash)] mt-1.5">
                  Os jogadores utilizam este código para conectar seus Desvelados a esta mesa.
                </p>
              </div>

              {onExcluirCampanha && (
                <div className="pt-8 border-t border-[var(--ro-line)]">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-rose-400 mb-2">
                    Zona de Exclusão
                  </h3>
                  <p className="text-xs text-[var(--ro-ash)] mb-4">
                    Remover esta campanha e suas referências locais.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente remover "${campanha.nome}"?`)) {
                        onExcluirCampanha(campanha.id);
                      }
                    }}
                    className="px-4 py-2 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 text-xs rounded-sm transition-colors"
                  >
                    Excluir Campanha
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Criar Nova Sessão */}
      {modalNovaSessao && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--ro-surface)] border border-[var(--ro-line)] max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-6 rounded-sm">
            <h3 className="font-serif text-2xl text-[var(--ro-paper)] mb-2">Criar Nova Sessão</h3>
            <p className="text-xs text-[var(--ro-ash)] mb-5">Adicione o próximo capítulo à crônica.</p>
            <form onSubmit={handleCriarSessaoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">Título da Sessão</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: A sombra sobre o asfalto..."
                  value={tituloNovaSessao}
                  onChange={(e) => setTituloNovaSessao(e.target.value)}
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper)] rounded-sm focus:border-[var(--ro-line-strong)] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">Data</label>
                  <input type="date" value={dataNovaSessao} onChange={(e) => setDataNovaSessao(e.target.value)} className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper)] rounded-sm" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">Estado</label>
                  <select value={statusNovaSessao} onChange={(e) => setStatusNovaSessao(e.target.value as SessaoStatus)} className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper)] rounded-sm">
                    <option value="planejamento">Planejamento</option>
                    <option value="pronta">Pronta</option>
                    <option value="ao_vivo">Ao vivo</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">Descrição</label>
                <textarea rows={2} value={descricaoNovaSessao} onChange={(e) => setDescricaoNovaSessao(e.target.value)} className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper-muted)] rounded-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">Notas do Mestre</label>
                <textarea rows={2} value={notasMestreNovaSessao} onChange={(e) => setNotasMestreNovaSessao(e.target.value)} className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper-muted)] rounded-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--ro-line)]">
                <button
                  type="button"
                  onClick={() => setModalNovaSessao(false)}
                  className="px-4 py-2 text-xs text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--ro-copper)] hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-medium rounded-sm uppercase tracking-wider"
                >
                  Criar Sessão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Genérico para Adicionar Item (NPC, Adversário, Local, etc.) */}
      {modalNovoItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--ro-surface)] border border-[var(--ro-line)] max-w-md w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-6 rounded-sm">
            <h3 className="font-serif text-2xl text-[var(--ro-paper)] mb-2 capitalize">
              Adicionar {modalNovoItem === 'npcs' ? 'NPC' : modalNovoItem === 'adversarios' ? 'Adversário' : modalNovoItem === 'locais' ? 'Local' : modalNovoItem === 'pistas' ? 'Pista' : modalNovoItem === 'lore' ? 'Lore' : 'Anotação'}
            </h3>
            <form onSubmit={handleCriarItemSubmit} className="space-y-4 pt-3">
              <div>
                <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">Nome / Título</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={itemNome}
                  onChange={(e) => setItemNome(e.target.value)}
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper)] rounded-sm focus:border-[var(--ro-line-strong)] focus:outline-none"
                />
              </div>

              {(modalNovoItem === 'npcs' || modalNovoItem === 'adversarios' || modalNovoItem === 'locais') && (
                <div>
                  <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">
                    {modalNovoItem === 'npcs' ? 'Papel / Conceito' : modalNovoItem === 'adversarios' ? 'Ataque Principal' : 'Anomalia Detectada'}
                  </label>
                  <input
                    type="text"
                    value={itemExtra}
                    onChange={(e) => setItemExtra(e.target.value)}
                    className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper)] rounded-sm focus:border-[var(--ro-line-strong)] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[var(--ro-ash)] uppercase mb-1.5">Descrição / Conteúdo</label>
                <textarea
                  rows={3}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-[var(--ro-bg)] border border-[var(--ro-line)] px-3.5 py-2.5 text-xs text-[var(--ro-paper-muted)] rounded-sm focus:border-[var(--ro-line-strong)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--ro-line)]">
                <button
                  type="button"
                  onClick={() => setModalNovoItem(null)}
                  className="px-4 py-2 text-xs text-[var(--ro-ash)] hover:text-[var(--ro-paper-muted)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--ro-copper)] hover:bg-[var(--ro-copper-bright)] text-[var(--ro-on-accent)] text-xs font-medium rounded-sm uppercase tracking-wider"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
