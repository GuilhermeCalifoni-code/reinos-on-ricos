import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar, MobileNavigation, MainViewType } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CampaignsLibraryView } from './components/CampaignsLibraryView';
import { CreateCharacterModal } from './components/CreateCharacterModal';
import { RupturaModal } from './components/RupturaModal';
import { LoginScreen } from './components/LoginScreen';
import { readLegacyLocalSnapshot, summarizeLegacyLocalSnapshot } from './data/legacyLocalSnapshot';
import { Personagem, AtributoNome, DominioNome } from './types/character';
import { Campanha, Sessao } from './types/campaign';
import { UserSession } from './types/auth';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { authService } from './services/auth/authService';
import { useRemoteCampaigns } from './services/campaigns/useRemoteCampaigns';
import { canPrepareCampaign as roleCanPrepare, campaignEntryView } from './services/campaigns/campaignNavigationPolicy';
import { useRemoteCampaignContent } from './services/campaigns/useRemoteCampaignContent';
import { useRemoteCharacters } from './services/characters/useRemoteCharacters';
import { campaignRepository } from './services/campaigns/campaignRepository';
import { campaignAssetService } from './services/storage/campaignAssetService';
import { localCloudMigrationService } from './services/migration/localCloudMigrationService';
import { useTheme } from './design-system/theme';
import { applyUIPreferences, loadLocalUIPreferences, saveLocalUIPreferences } from './services/preferences/uiPreferences';
import { accountDataService } from './services/account/accountDataService';
import { liveTableRepository } from './features/realtime/liveTableRepository';
import { usePlatformAccess } from './services/admin/usePlatformAccess';

const CreateCampaignView = React.lazy(() => import('./components/CreateCampaignView').then(module => ({ default: module.CreateCampaignView })));
const CampaignDetailView = React.lazy(() => import('./components/CampaignDetailView').then(module => ({ default: module.CampaignDetailView })));
const MesaView = React.lazy(() => import('./components/MesaView').then(module => ({ default: module.MesaView })));
const CharactersListView = React.lazy(() => import('./components/CharactersListView').then(module => ({ default: module.CharactersListView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
const PlatformAdminView = React.lazy(() => import('./components/PlatformAdminView').then(module => ({ default: module.PlatformAdminView })));
const CommunityView = React.lazy(() => import('./components/CommunityView').then(module => ({ default: module.CommunityView })));
const CharacterSheet = React.lazy(() => import('./components/CharacterSheet').then(module => ({ default: module.CharacterSheet })));
const RulesReference = React.lazy(() => import('./components/RulesReference').then(module => ({ default: module.RulesReference })));
const CompendiumView = React.lazy(() => import('./components/CompendiumView').then(module => ({ default: module.CompendiumView })));

const ViewFallback = () => (
  <div className="ro-empty-state m-6">
    <span>Carregando arquivo da Vigília…</span>
  </div>
);

export default function App() {
  const { setTheme } = useTheme();
  // Não confia em cache do navegador como sessão autenticada.
  // O Supabase Auth precisa confirmar a identidade antes de abrir a aplicação.
  const [session, setSession] = useState<UserSession | null>(null);
  const [authChecking, setAuthChecking] = useState(isSupabaseConfigured());
  const legacySummary = useMemo(() => summarizeLegacyLocalSnapshot(readLegacyLocalSnapshot()), []);
  const sessionRef = useRef<UserSession | null>(session);

  useEffect(() => {
    sessionRef.current = session;
    const prefs = session?.uiPreferences || loadLocalUIPreferences();
    applyUIPreferences(prefs);
    if (prefs.theme) setTheme(prefs.theme);
  }, [session, setTheme]);

  const campanhasRemotas = useRemoteCampaigns(session?.authUserId);
  const [campanhaRemotaAtivaId, setCampanhaRemotaAtivaId] = useState<string | null>(null);
  const usandoRemoto = Boolean(session?.authUserId) && isSupabaseConfigured();
  const platformAccess = usePlatformAccess(usandoRemoto ? session?.authUserId : undefined);
  const canAccessAdmin = platformAccess.canViewUsers || platformAccess.canManageCampaignRoles;
  const campanhas = campanhasRemotas.campanhas;
  const campanhaAtivaId = campanhaRemotaAtivaId;
  const campanhaAtiva = campanhaRemotaAtivaId
    ? campanhas.find(c => c.id === campanhaRemotaAtivaId) || null
    : campanhas[0] || null;
  const setCampanhaAtivaId = setCampanhaRemotaAtivaId;
  const papelDaCampanha = campanhasRemotas.roleDaCampanha(campanhaAtiva?.id) || 'observador';
  const podePrepararCampanha = (camp: Campanha) => roleCanPrepare(campanhasRemotas.roleDaCampanha(camp.id));
  const membroRemotoAtivo = campanhasRemotas.membros.find(membro => membro.campaignId === campanhaAtiva?.id && membro.userId === session?.authUserId);
  const personagemJogadorId = membroRemotoAtivo?.characterId;
  const personagensRemotos = useRemoteCharacters(
    usandoRemoto ? session?.authUserId : undefined,
    usandoRemoto ? campanhaAtivaId || undefined : undefined,
    usandoRemoto
  );
  const personagens = personagensRemotos.characters;

  const conteudoRemoto = useRemoteCampaignContent(campanhaAtivaId || undefined, usandoRemoto);
  const sessoesAtuais = conteudoRemoto.sessoes;
  const npcsAtuais = conteudoRemoto.npcs;
  const adversariosAtuais = conteudoRemoto.adversarios;
  const locaisAtuais = conteudoRemoto.locais;
  const pistasAtuais = conteudoRemoto.pistas;
  const loreAtual = conteudoRemoto.loreEntries;
  const anotacoesAtuais = conteudoRemoto.anotacoes;
  const cenasAtuais = conteudoRemoto.cenas;
  const handoutsAtuais = conteudoRemoto.handouts;
  const mapasAtuais = conteudoRemoto.mapas;
  const sessaoAtiva = sessoesAtuais.find(sessao => sessao.numero === campanhaAtiva?.sessaoAtual);
  const sessaoAtivaId = sessaoAtiva?.id;
  const membrosCampanha = campanhaAtiva?.id ? campanhasRemotas.membros.filter(membro => membro.campaignId === campanhaAtiva.id) : [];
  const personagensCampanha = campanhaAtiva?.id
    ? personagens.filter(personagem => personagem.campaignId === campanhaAtiva.id)
    : personagens;

  const salvarPersonagemPersistente = (personagemAtualizado: Personagem) => {
    if (!usandoRemoto) return;
    const remoto: Personagem = {
      ...personagemAtualizado,
      ownerUserId: personagemAtualizado.ownerUserId || session?.authUserId
    };
    void personagensRemotos.save(remoto).catch(error => console.error('Erro ao salvar ficha no Supabase:', error));
  };

  const excluirPersonagemPersistente = (id: string) => {
    if (!usandoRemoto) return;
    void personagensRemotos.remove(id).catch(error => console.error('Erro ao excluir ficha remota:', error));
  };

  const duplicarPersonagemPersistente = (id: string) => {
    if (!usandoRemoto) return;
    const original = personagens.find(item => item.id === id);
    if (!original || !session?.authUserId) return;
    const copia: Personagem = {
      ...JSON.parse(JSON.stringify(original)),
      id: `desvelado-${Date.now()}`,
      nome: `${original.nome} (Cópia)`,
      ownerUserId: session.authUserId,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    void personagensRemotos.save(copia).catch(error => console.error('Erro ao duplicar ficha remota:', error));
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let ativo = true;

    const persistirSessaoRemota = async (supabaseSession: Awaited<ReturnType<typeof authService.sessaoAtual>>) => {
      if (!ativo || !supabaseSession?.user) return;

      const profile = await authService.perfil(supabaseSession.user);
      if (!ativo) return;

      if (sessionRef.current?.authUserId && sessionRef.current.authUserId !== supabaseSession.user.id) {
        setCampanhaRemotaAtivaId(null);
      }

      const restaurada: UserSession = {
        id: supabaseSession.user.id,
        authUserId: supabaseSession.user.id,
        role: 'observador',
        nome: profile.nome,
        email: supabaseSession.user.email,
        avatarUrl: profile.avatarUrl,
        uiPreferences: profile.preferences,
        mesaCodigo: '',
        modoConexao: 'supabase'
      };

      sessionRef.current = restaurada;
      setSession(restaurada);
      setAuthChecking(false);
    };

    const limparSessaoRemotaEmCache = () => {
      sessionRef.current = null;
      setSession(null);
      setAuthChecking(false);
    };

    void authService.sessaoAtual()
      .then(async (supabaseSession) => {
        if (!ativo) return;
        if (!supabaseSession?.user) {
          limparSessaoRemotaEmCache();
          return;
        }
        await persistirSessaoRemota(supabaseSession);
      })
      .catch(() => {
        // Sem acesso local offline: falha da conexão mantém a tela de autenticação.
        if (ativo) setAuthChecking(false);
      });

    const subscription = authService.onAuthStateChange((event, supabaseSession) => {
      if (!ativo) return;

      if (event === 'SIGNED_OUT') {
        limparSessaoRemotaEmCache();
        return;
      }

      if (
        supabaseSession?.user &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')
      ) {
        void persistirSessaoRemota(supabaseSession).catch(() => undefined);
      }
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  // Navegação Principal do Produto
  const [viewAtiva, setViewAtiva] = useState<MainViewType>('dashboard');
  useEffect(() => {
    if (viewAtiva === 'administracao' && !platformAccess.loading && !canAccessAdmin) setViewAtiva('dashboard');
  }, [viewAtiva, platformAccess.loading, canAccessAdmin]);
  // O estúdio de preparação é exclusivo do Mestre. O Jogador/Observador volta à Mesa.
  useEffect(() => {
    if (viewAtiva === 'detalhe_campanha' && campanhaAtiva && !podePrepararCampanha(campanhaAtiva)) {
      setViewAtiva('modo_mesa');
    }
  }, [viewAtiva, campanhaAtiva?.id, papelDaCampanha, session?.role]);
  const [personagemParaFicha, setPersonagemParaFicha] = useState<Personagem | null>(null);

  // Modais
  const [modalCriarPersonagem, setModalCriarPersonagem] = useState<boolean>(false);

  // Ruptura modal global
  const [modalRupturaGlobal, setModalRupturaGlobal] = useState<{
    aberto: boolean;
    personagem: Personagem | null;
    delta: number;
    motivo: string;
  }>({
    aberto: false,
    personagem: null,
    delta: 1,
    motivo: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipuladores de Sessão
  const handleLogin = (novaSession: UserSession) => {
    setCampanhaRemotaAtivaId(null);
    sessionRef.current = novaSession;
    setSession(novaSession);
    setAuthChecking(false);
    // Contas remotas não têm um papel global: Mestre/Jogador/Observador é definido por campanha.
    // O Dashboard é o ponto de entrada correto para qualquer conta autenticada.
    setViewAtiva('dashboard');
  };

  const handleAtualizarSessao = (patch: Partial<UserSession>) => {
    setSession(current => {
      if (!current) return current;
      const atualizada = { ...current, ...patch };
      sessionRef.current = atualizada;
      return atualizada;
    });
  };

  const handleMigrarDadosLocais = async () => {
    if (!usandoRemoto || !session?.authUserId) {
      throw new Error('Entre em uma conta online para sincronizar este dispositivo.');
    }

    const report = await localCloudMigrationService.migrate(readLegacyLocalSnapshot(), session.authUserId);

    await Promise.all([
      campanhasRemotas.recarregar(),
      personagensRemotos.refresh()
    ]);

    return report;
  };

  const handleAtualizarPreferencias = async (preferences: NonNullable<UserSession['uiPreferences']>) => {
    const next = { ...(session?.uiPreferences || {}), ...preferences };
    saveLocalUIPreferences(next);
    applyUIPreferences(next);
    if (next.theme) setTheme(next.theme);

    await authService.atualizarPreferencias(next);

    handleAtualizarSessao({ uiPreferences: next });
  };

  const handleExportarDados = async () => {
    const payload = await accountDataService.exportarConta();
    accountDataService.baixarJson(payload, `reinos-oniricos-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleExportarLegado = () => {
    accountDataService.baixarJson({
      formato: 'reinos-oniricos-local-backup-v1',
      exportadoEm: new Date().toISOString(),
      ...readLegacyLocalSnapshot()
    }, `reinos-oniricos-legado-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleSairTodos = async () => {
    await authService.sairTodos();
    sessionRef.current = null;
    setSession(null);
  };

  const handleTrocarSessao = () => {
    void authService.sair().catch(() => undefined);
    setCampanhaRemotaAtivaId(null);
    sessionRef.current = null;
    setSession(null);
  };

  // Navegações de Campanha
  const handleContinuarCampanha = (camp: Campanha) => {
    setCampanhaAtivaId(camp.id);
    setViewAtiva('modo_mesa');
  };

  const handleAbrirSessaoPreparada = async (sessao: Sessao) => {
    const camp = campanhas.find(item => item.id === sessao.campanhaId) || campanhaAtiva;
    if (!camp) return;

    setCampanhaAtivaId(camp.id);

    await campaignRepository.atualizar(camp.id, { sessaoAtual: sessao.numero });

    const primeiraCena = (sessao.cenaIds || [])
      .map(id => cenasAtuais.find(item => item.id === id))
      .find(Boolean);
    const primeiroMapa = (sessao.mapaIds || [])
      .find(id => mapasAtuais.some(item => item.id === id));
    const contentType = primeiraCena?.tipoDeConteudo === 'mapa' || (!primeiraCena && primeiroMapa)
      ? 'mapa'
      : (primeiraCena?.tipoDeConteudo || sessao.conteudoDeCena || 'ambientacao');

    if (session?.authUserId) {
      try {
        const live = await liveTableRepository.load(camp.id);
        await liveTableRepository.saveState(camp.id, session.authUserId, {
          ...live.state,
          sessionId: sessao.id,
          activeSceneId: primeiraCena?.id,
          activeMapId: primeiroMapa,
          contentType,
          ruptureGeneral: live.state?.ruptureGeneral ?? camp.rupturaGeral,
          metadata: {
            ...(live.state?.metadata || {}),
            sceneTitle: primeiraCena?.titulo || sessao.titulo,
            sceneDescription: primeiraCena?.descricao || sessao.descricao || '',
            sceneImageUrl: primeiraCena?.imagemUrl || sessao.imagemUrl || ''
          }
        });
      } catch (error) {
        console.error('Não foi possível aplicar a abertura preparada da sessão:', error);
      }
    }

    await campanhasRemotas.recarregar();
    setViewAtiva('modo_mesa');
  };

  const handleDetalhesCampanha = (camp: Campanha) => {
    setCampanhaAtivaId(camp.id);
    setViewAtiva(campaignEntryView(campanhasRemotas.roleDaCampanha(camp.id)));
  };

  const handleIniciarCriacaoCampanha = () => {
    setViewAtiva('criar_campanha');
  };

  const handleEntrarComCodigoRemoto = async (codigo: string, personagemId?: string) => {
    const id = await campanhasRemotas.entrarComCodigo(codigo);

    if (personagemId && session?.authUserId) {
      const personagem = personagens.find(
        item => item.id === personagemId && item.ownerUserId === session.authUserId && !item.campaignId
      );

      if (personagem) {
        await campaignRepository.vincularPersonagem(id, personagem.id);
        await personagensRemotos.refresh();
      }
    }

    await campanhasRemotas.recarregar();
    setCampanhaRemotaAtivaId(id);
    // O convite concede acesso à Mesa Ao Vivo, não ao material de preparação.
    setViewAtiva('modo_mesa');
  };

  const handleVincularMinhaFicha = async (campaignId: string, characterId: string | null) => {
    await campaignRepository.vincularPersonagem(campaignId, characterId);
    await Promise.all([
      personagensRemotos.refresh(),
      campanhasRemotas.recarregar()
    ]);
  };

  const handleExecutarCriacaoCampanha = async (dados: {
    nome: string;
    descricao: string;
    imagemUrl: string;
    imagemArquivo?: File;
    tipo: 'campanha' | 'oneshot' | 'playtest';
  }) => {
    const nova = await campanhasRemotas.criar({
      nome: dados.nome,
      descricao: dados.descricao,
      imagemUrl: dados.imagemUrl,
      tipo: dados.tipo
    });

    if (dados.imagemArquivo) {
      try {
        const path = await campaignAssetService.uploadCampaignCover(nova.id, dados.imagemArquivo);
        await campaignRepository.atualizarImagem(nova.id, campaignAssetService.toStorageRef(path));
        await campanhasRemotas.recarregar();
      } catch (error: any) {
        alert(`A campanha foi criada, mas a capa não pôde ser enviada. ${error.message || ''}`);
      }
    }

    setCampanhaRemotaAtivaId(nova.id);
    setViewAtiva('detalhe_campanha');
  };

  // Abrir Ficha de Personagem
  const handleAbrirFichaPersonagem = (p: Personagem) => {
    setPersonagemParaFicha(p);
  };

  // Ruptura Auditada
  const handleAbrirModalRupturaPara = (p: Personagem, delta: number, motivo: string) => {
    setModalRupturaGlobal({
      aberto: true,
      personagem: p,
      delta,
      motivo
    });
  };

  // Upload JSON de Ficha
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.authUserId) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const json = JSON.parse(String(event.target?.result || ''));
        if (!json?.nome || !json?.atributos || !json?.dominios) {
          throw new Error('Este arquivo não contém uma ficha válida de Reinos Oníricos.');
        }
        const draft: Personagem = {
          ...json,
          id: `desvelado-import-${Date.now()}`,
          ownerUserId: session.authUserId,
          campaignId: undefined,
          atualizadoEm: new Date().toISOString()
        };
        await personagensRemotos.save(draft);
        alert('Ficha importada para o Supabase com sucesso.');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao importar ficha.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportarJSON = (personagem: Personagem) => {
    accountDataService.baixarJson(personagem,
      `${personagem.nome.toLowerCase().replace(/\\s+/g, '_')}_reinos_oniricos.json`);
  };

  // Se o usuário ainda não escolheu seu perfil (Mestre vs Jogador), exibe a Tela de Login
  if (authChecking) return <ViewFallback />;

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  // Se uma ficha específica estiver aberta em detalhe:
  const renderConteudoPrincipal = () => {
    if (personagemParaFicha) {
      return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--ro-line)]">
            <button
              onClick={() => setPersonagemParaFicha(null)}
              className="text-xs text-[var(--ro-paper-muted)] hover:text-[var(--ro-gold)] transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Voltar para o painel</span>
            </button>
            <span className="text-[10px] sm:text-xs uppercase tracking-[.12em] text-[var(--ro-gold)]">
              Ficha do Desvelado · {personagemParaFicha.nome}
            </span>
          </div>

          <CharacterSheet
            personagem={personagemParaFicha}
            onSalvar={(atualizado) => {
              salvarPersonagemPersistente(atualizado);
              setPersonagemParaFicha(atualizado);
            }}
            onDuplicar={(p) => {
              duplicarPersonagemPersistente(p);
              setPersonagemParaFicha(null);
            }}
            onExcluir={(id) => {
              excluirPersonagemPersistente(id);
              setPersonagemParaFicha(null);
            }}
            onExportar={exportarJSON}
            onIrParaRolador={(p) => {
              setViewAtiva('modo_mesa');
              setPersonagemParaFicha(null);
            }}
            onIrParaGuiaSonhar={() => {
              setViewAtiva('modo_mesa');
              setPersonagemParaFicha(null);
            }}
            onDispararMovimentoMorte={() => {
              setViewAtiva('modo_mesa');
              setPersonagemParaFicha(null);
            }}
          />
        </div>
      );
    }

    switch (viewAtiva) {
      case 'administracao':
        return canAccessAdmin ? <PlatformAdminView access={{ role: platformAccess.role, permissions: platformAccess.permissions }} /> : null;
      case 'dashboard':
        return (
          <DashboardView
            campanhas={campanhas}
            userName={session.nome}
            personagens={personagens}
            sessoes={sessoesAtuais}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onNovoPersonagem={() => setModalCriarPersonagem(true)}
            onAbrirPersonagem={handleAbrirFichaPersonagem}
            onContinuarCampanha={handleContinuarCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
            canPrepareCampaign={podePrepararCampanha}
            personagensParaVinculo={personagensRemotos.personal.filter(personagem => !personagem.campaignId)}
            onEntrarComCodigo={handleEntrarComCodigoRemoto}
            avatarUrl={session.avatarUrl}
            onAbrirCampanhas={() => setViewAtiva('campanhas')}
            onAbrirPersonagens={() => setViewAtiva('personagens')}
            onAbrirComunidade={() => setViewAtiva('comunidade')}
            onAbrirConfiguracoes={() => setViewAtiva('configuracoes')}
            onSair={handleTrocarSessao}
          />
        );

      case 'campanhas':
        return (
          <CampaignsLibraryView
            campanhas={campanhas}
            personagensParaVinculo={personagensRemotos.personal.filter(personagem => !personagem.campaignId)}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            canPrepareCampaign={podePrepararCampanha}
            onEntrarComCodigo={handleEntrarComCodigoRemoto}
          />
        );

      case 'criar_campanha':
        return (
          <CreateCampaignView
            onCriar={handleExecutarCriacaoCampanha}
            onCancelar={() => setViewAtiva('campanhas')}
          />
        );

      case 'detalhe_campanha':
        return campanhaAtiva && podePrepararCampanha(campanhaAtiva) ? (
          <CampaignDetailView
            campanha={campanhaAtiva}
            personagens={personagensCampanha}
            personagensPessoais={personagensRemotos.personal}
            sessoes={sessoesAtuais}
            npcs={npcsAtuais}
            adversarios={adversariosAtuais}
            locais={locaisAtuais}
            pistas={pistasAtuais}
            loreEntries={loreAtual}
            anotacoes={anotacoesAtuais}
            cenas={cenasAtuais}
            handouts={handoutsAtuais}
            mapas={mapasAtuais}
            onIniciarSessao={handleContinuarCampanha}
            onAbrirSessao={handleAbrirSessaoPreparada}
            onAbrirFichaPersonagem={handleAbrirFichaPersonagem}
            onNovaSessao={(campaignId, dados) => { void conteudoRemoto.criarSessao(campaignId, dados); }}
            onAtualizarSessao={conteudoRemoto.atualizarSessao}
            onAdicionarNPC={conteudoRemoto.adicionarNPC}
            onAtualizarNPC={conteudoRemoto.atualizarNPC}
            onRemoverNPC={conteudoRemoto.removerNPC}
            onAdicionarAdversario={conteudoRemoto.adicionarAdversario}
            onAtualizarAdversario={conteudoRemoto.atualizarAdversario}
            onRemoverAdversario={conteudoRemoto.removerAdversario}
            onAdicionarLocal={conteudoRemoto.adicionarLocal}
            onAtualizarLocal={conteudoRemoto.atualizarLocal}
            onRemoverLocal={conteudoRemoto.removerLocal}
            onAdicionarPista={conteudoRemoto.adicionarPista}
            onAtualizarPista={conteudoRemoto.atualizarPista}
            onRemoverPista={conteudoRemoto.removerPista}
            onAdicionarLore={(item) => { void conteudoRemoto.adicionarLore(item); }}
            onAdicionarAnotacao={(campaignId, titulo, conteudo) => { void conteudoRemoto.adicionarAnotacao(campaignId, titulo, conteudo); }}
            onAdicionarCena={conteudoRemoto.adicionarCena}
            onAtualizarCena={conteudoRemoto.atualizarCena}
            onRemoverCena={conteudoRemoto.removerCena}
            onAdicionarHandout={conteudoRemoto.adicionarHandout}
            onAtualizarHandout={conteudoRemoto.atualizarHandout}
            onRemoverHandout={conteudoRemoto.removerHandout}
            onAdicionarMapa={conteudoRemoto.adicionarMapa}
            onAtualizarMapa={conteudoRemoto.atualizarMapa}
            onRemoverMapa={conteudoRemoto.removerMapa}
            membros={campanhasRemotas.membros.filter(membro => membro.campaignId === campanhaAtiva.id)}
            currentUserId={session.authUserId}
            canManageMembers={papelDaCampanha === 'mestre'}
            onRegenerarCodigo={campanhasRemotas.regenerarCodigo}
            onAtualizarMembro={campanhasRemotas.atualizarMembro}
            onVincularMinhaFicha={handleVincularMinhaFicha}
            onExcluirCampanha={(id) => { void campanhasRemotas.remover(id).then(() => { setCampanhaRemotaAtivaId(null); setViewAtiva('dashboard'); }).catch(error => alert(error.message || 'Não foi possível excluir a campanha.')); }}
          />
        ) : (
          <DashboardView
            campanhas={campanhas}
            sessoes={sessoesAtuais}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
            canPrepareCampaign={podePrepararCampanha}
            personagensParaVinculo={personagens}
            onEntrarComCodigo={handleEntrarComCodigoRemoto}
          />
        );

      case 'modo_mesa':
        return campanhaAtiva ? (
          <MesaView
            campanha={campanhaAtiva}
            personagens={personagensCampanha}
            npcs={npcsAtuais.filter(item => item.campanhaId === campanhaAtiva.id)}
            adversarios={adversariosAtuais.filter(item => item.campanhaId === campanhaAtiva.id)}
            role={papelDaCampanha}
            personagemJogadorId={personagemJogadorId}
            userId={session.authUserId}
            userName={session.nome}
            sessionId={sessaoAtivaId}
            sessionTitle={sessaoAtiva?.titulo}
            sessionDescription={sessaoAtiva?.descricao}
            sessao={sessaoAtiva}
            cenas={cenasAtuais.filter(item => item.campanhaId === campanhaAtiva.id)}
            pistas={pistasAtuais.filter(item => item.campanhaId === campanhaAtiva.id)}
            handouts={handoutsAtuais.filter(item => item.campanhaId === campanhaAtiva.id)}
            members={membrosCampanha}
            registroOnline={true}
            onVoltarParaCampanha={() => setViewAtiva(
              papelDaCampanha === 'mestre' ? 'detalhe_campanha' : 'campanhas'
            )}
            onAtualizarPersonagem={salvarPersonagemPersistente}
            onAbrirModalRupturaPara={handleAbrirModalRupturaPara}
            onAbrirFichaPersonagem={handleAbrirFichaPersonagem}
            contadores={[]}
            onAdicionarContador={() => undefined}
            onAtualizarContador={() => undefined}
            onRemoverContador={() => undefined}
            onDuplicarContador={() => undefined}
            mapas={mapasAtuais}
            onAdicionarMapa={(item) => { void conteudoRemoto.adicionarMapa(item); }}
            onAtualizarMapa={(id, patch) => { void conteudoRemoto.atualizarMapa(id, patch); }}
            onRemoverMapa={(id) => { void conteudoRemoto.removerMapa(id); }}
            onAtualizarSessao={conteudoRemoto.atualizarSessao}
            tokensMapa={[]}
            onAdicionarTokenMapa={() => undefined}
            onAtualizarTokenMapa={() => undefined}
            onRemoverTokenMapa={() => undefined}
          />
        ) : null;

      case 'compendio':
        return <CompendiumView />;

      case 'comunidade':
        return <CommunityView />;

      case 'personagens':
        return (
          <CharactersListView
            personagens={personagens}
            currentUserId={session.authUserId}
            onSelecionarPersonagem={handleAbrirFichaPersonagem}
            onNovoPersonagem={() => setModalCriarPersonagem(true)}
            onImportarJSON={() => fileInputRef.current?.click()}
          />
        );

      case 'configuracoes':
        return (
          <SettingsView
            session={session}
            onTrocarSessao={handleTrocarSessao}
            onAtualizarSessao={handleAtualizarSessao}
            onAtualizarPreferencias={handleAtualizarPreferencias}
            onExportarDados={handleExportarDados}
            onSairTodos={handleSairTodos}
            localDataSummary={legacySummary}
            onMigrarDadosLocais={handleMigrarDadosLocais}
            onExportarLegado={handleExportarLegado}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`ro-app-shell flex font-sans selection:bg-[var(--ro-accent-soft)] selection:text-[var(--ro-paper)] ${viewAtiva === 'modo_mesa' && !personagemParaFicha ? 'ro-app-shell--live' : ''}`}>
      {/* Input Oculto de Arquivo JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* 9. SIDEBAR (210-230px, Fundo #171717, Borda #292929, Minimalista) */}
      {viewAtiva !== 'modo_mesa' && <Sidebar
        viewAtiva={viewAtiva}
        setViewAtiva={(v) => {
          setPersonagemParaFicha(null);
          setViewAtiva(v);
        }}
        onNovaCampanha={handleIniciarCriacaoCampanha}
        onSair={handleTrocarSessao}
        canAccessAdmin={canAccessAdmin}
      />}

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {viewAtiva !== 'modo_mesa' && <MobileNavigation
          viewAtiva={viewAtiva}
          setViewAtiva={(v) => {
            setPersonagemParaFicha(null);
            setViewAtiva(v);
          }}
          onNovaCampanha={handleIniciarCriacaoCampanha}
          onSair={handleTrocarSessao}
          canAccessAdmin={canAccessAdmin}
        />}
        {/* 10. HEADER (Minimalista, Fundo #0B0B0B, Borda #292929) */}
        {viewAtiva !== 'modo_mesa' && viewAtiva !== 'dashboard' && viewAtiva !== 'campanhas' && viewAtiva !== 'comunidade' && <Header
          campanhaNome={
            viewAtiva === 'detalhe_campanha'
              ? campanhaAtiva?.nome
              : undefined
          }
          rupturaNivel={campanhaAtiva?.rupturaGeral || 0}
          session={session}
        />}

        {/* View renderizada */}
        <main className={viewAtiva === 'modo_mesa' && !personagemParaFicha ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1 min-h-[calc(100vh-3.5rem)]'}>
          <React.Suspense fallback={<ViewFallback />}>
            {renderConteudoPrincipal()}
          </React.Suspense>
        </main>
      </div>

      {/* Modal Criar Personagem */}
      {modalCriarPersonagem && (
        <CreateCharacterModal
          isOpen={modalCriarPersonagem}
          onClose={() => setModalCriarPersonagem(false)}
          onCriar={async (novo, imagemArquivo) => {
            let salvo = await personagensRemotos.save({
              ...novo,
              ownerUserId: novo.ownerUserId || session?.authUserId
            });

            if (imagemArquivo) {
              try {
                const path = await campaignAssetService.uploadCharacterPortrait(salvo.id, imagemArquivo);
                salvo = await personagensRemotos.save({
                  ...salvo,
                  imagemUrl: campaignAssetService.toStorageRef(path),
                  atualizadoEm: new Date().toISOString()
                });
              } catch (error: any) {
                alert(`A ficha foi criada, mas o retrato não pôde ser enviado. ${error.message || ''}`);
              }
            }

            setPersonagemParaFicha(salvo);
          }}
        />
      )}

      {/* Modal Ruptura */}
      {modalRupturaGlobal.aberto && modalRupturaGlobal.personagem && (
        <RupturaModal
          isOpen={modalRupturaGlobal.aberto}
          personagem={modalRupturaGlobal.personagem}
          onClose={() => setModalRupturaGlobal({ aberto: false, personagem: null, delta: 1, motivo: '' })}
          onSalvar={(pAtualizado) => {
            salvarPersonagemPersistente(pAtualizado);
            setModalRupturaGlobal({ aberto: false, personagem: null, delta: 1, motivo: '' });
          }}
          ajusteSugerido={{
            delta: modalRupturaGlobal.delta,
            motivo: modalRupturaGlobal.motivo,
            origem: 'manual'
          }}
        />
      )}
    </div>
  );
}
