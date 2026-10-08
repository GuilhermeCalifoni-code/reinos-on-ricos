import React, { useState, useRef, useEffect } from 'react';
import { Sidebar, MobileNavigation, MainViewType } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CampaignsLibraryView } from './components/CampaignsLibraryView';
import { CreateCharacterModal } from './components/CreateCharacterModal';
import { RupturaModal } from './components/RupturaModal';
import { LoginScreen } from './components/LoginScreen';
import { useCharacterStorage } from './data/characterStore';
import { useCampaignStorage } from './data/campaignStore';
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

const SESSION_STORAGE_KEY = 'reinos_oniricos_session_v1';

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
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const salvo = localStorage.getItem(SESSION_STORAGE_KEY);
      if (salvo) {
        return JSON.parse(salvo);
      }
    } catch (e) {
      console.error('Erro ao ler sessão salva:', e);
    }
    return null;
  });
  const sessionRef = useRef<UserSession | null>(session);

  useEffect(() => {
    sessionRef.current = session;
    const prefs = session?.uiPreferences || loadLocalUIPreferences();
    applyUIPreferences(prefs);
    if (prefs.theme) setTheme(prefs.theme);
  }, [session, setTheme]);

  // Storage de Personagens
  const {
    personagens: personagensLocais,
    personagemAtivo,
    personagemAtivoId,
    setPersonagemAtivoId,
    salvarPersonagem: salvarPersonagemLocal,
    criarNovoPersonagem,
    duplicarPersonagem: duplicarPersonagemLocal,
    excluirPersonagem: excluirPersonagemLocal,
    exportarJSON,
    importarJSON
  } = useCharacterStorage(session?.mesaCodigo || 'ONIRICO-01');

  // Storage de Campanhas
  const {
    campanhas: campanhasLocais,
    campanhaAtivaId: campanhaAtivaIdLocal,
    campanhaAtiva: campanhaAtivaLocal,
    setCampanhaAtivaId: setCampanhaAtivaIdLocal,
    criarCampanha: criarCampanhaLocal,
    atualizarCampanha,
    removerCampanha,
    sessoes,
    criarSessao,
    atualizarSessao,
    npcs,
    adicionarNPC,
    atualizarNPC,
    removerNPC,
    adversarios,
    adicionarAdversario,
    atualizarAdversario,
    removerAdversario,
    locais,
    adicionarLocal,
    atualizarLocal,
    removerLocal,
    pistas,
    adicionarPista,
    atualizarPista,
    removerPista,
    loreEntries,
    adicionarLore,
    anotacoes,
    adicionarAnotacao,
    contadores,
    adicionarContador,
    atualizarContador,
    removerContador,
    duplicarContador,
    mapas,
    adicionarMapa,
    atualizarMapa,
    removerMapa,
    tokensMapa,
    adicionarTokenMapa,
    atualizarTokenMapa,
    removerTokenMapa,
    cenas,
    adicionarCena,
    atualizarCena,
    removerCena,
    handouts,
    adicionarHandout,
    atualizarHandout,
    removerHandout
  } = useCampaignStorage();
  const campanhasRemotas = useRemoteCampaigns(session?.modoConexao === 'supabase' ? session.authUserId : undefined);
  const [campanhaRemotaAtivaId, setCampanhaRemotaAtivaId] = useState<string | null>(null);
  const usandoRemoto = session?.modoConexao === 'supabase' && Boolean(session.authUserId) && isSupabaseConfigured();
  const platformAccess = usePlatformAccess(usandoRemoto ? session?.authUserId : undefined);
  const canAccessAdmin = platformAccess.canViewUsers || platformAccess.canManageCampaignRoles;
  const campanhas = usandoRemoto ? campanhasRemotas.campanhas : campanhasLocais;
  const campanhaAtivaId = usandoRemoto ? campanhaRemotaAtivaId : campanhaAtivaIdLocal;
  const campanhaAtiva = usandoRemoto
    ? (campanhaRemotaAtivaId ? campanhas.find(c => c.id === campanhaRemotaAtivaId) || null : campanhas[0] || null)
    : campanhaAtivaLocal;
  const setCampanhaAtivaId = (id: string) => usandoRemoto ? setCampanhaRemotaAtivaId(id) : setCampanhaAtivaIdLocal(id);
  const papelDaCampanha = usandoRemoto ? campanhasRemotas.roleDaCampanha(campanhaAtivaId || undefined) || 'observador' : session?.role || 'observador';
  const podePrepararCampanha = (camp: Campanha) => roleCanPrepare(
    usandoRemoto ? campanhasRemotas.roleDaCampanha(camp.id) : session?.role
  );
  const membroRemotoAtivo = usandoRemoto ? campanhasRemotas.membros.find(membro => membro.campaignId === campanhaAtivaId && membro.userId === session?.authUserId) : undefined;
  const personagemJogadorId = usandoRemoto ? membroRemotoAtivo?.characterId : session?.personagemVinculadoId;
  const personagensRemotos = useRemoteCharacters(
    usandoRemoto ? session?.authUserId : undefined,
    usandoRemoto ? campanhaAtivaId || undefined : undefined,
    usandoRemoto
  );
  const personagens = usandoRemoto ? personagensRemotos.characters : personagensLocais;

  const conteudoRemoto = useRemoteCampaignContent(campanhaAtivaId || undefined, usandoRemoto);
  const sessoesAtuais = usandoRemoto ? conteudoRemoto.sessoes : sessoes;
  const npcsAtuais = usandoRemoto ? conteudoRemoto.npcs : npcs;
  const adversariosAtuais = usandoRemoto ? conteudoRemoto.adversarios : adversarios;
  const locaisAtuais = usandoRemoto ? conteudoRemoto.locais : locais;
  const pistasAtuais = usandoRemoto ? conteudoRemoto.pistas : pistas;
  const loreAtual = usandoRemoto ? conteudoRemoto.loreEntries : loreEntries;
  const anotacoesAtuais = usandoRemoto ? conteudoRemoto.anotacoes : anotacoes;
  const cenasAtuais = usandoRemoto ? conteudoRemoto.cenas : cenas;
  const handoutsAtuais = usandoRemoto ? conteudoRemoto.handouts : handouts;
  const mapasAtuais = usandoRemoto ? conteudoRemoto.mapas : mapas;
  const sessaoAtiva = sessoesAtuais.find(sessao => sessao.numero === campanhaAtiva?.sessaoAtual);
  const sessaoAtivaId = sessaoAtiva?.id;
  const membrosCampanha = usandoRemoto && campanhaAtivaId ? campanhasRemotas.membros.filter(membro => membro.campaignId === campanhaAtivaId) : [];
  const personagensCampanha = usandoRemoto && campanhaAtivaId
    ? personagens.filter(personagem => personagem.campaignId === campanhaAtivaId)
    : personagens;

  const salvarPersonagemPersistente = (personagemAtualizado: Personagem) => {
    if (usandoRemoto) {
      const remoto: Personagem = {
        ...personagemAtualizado,
        ownerUserId: personagemAtualizado.ownerUserId || session?.authUserId
      };
      void personagensRemotos.save(remoto).catch(error => console.error('Erro ao salvar ficha remota:', error));
      return;
    }
    salvarPersonagemLocal(personagemAtualizado);
  };

  const excluirPersonagemPersistente = (id: string) => {
    if (usandoRemoto) {
      void personagensRemotos.remove(id).catch(error => console.error('Erro ao excluir ficha remota:', error));
      return;
    }
    excluirPersonagemLocal(id);
  };

  const duplicarPersonagemPersistente = (id: string) => {
    if (!usandoRemoto) {
      duplicarPersonagemLocal(id);
      return;
    }
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
      if (!ativo || !supabaseSession?.user || sessionRef.current?.modoConexao === 'local') return;

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
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restaurada));
      } catch (error) {
        console.error('Erro ao sincronizar sessão autenticada:', error);
      }
    };

    const limparSessaoRemotaEmCache = () => {
      if (sessionRef.current?.modoConexao !== 'supabase') return;
      sessionRef.current = null;
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (error) {
        console.error('Erro ao limpar sessão autenticada inválida:', error);
      }
      setSession(null);
    };

    if (sessionRef.current?.modoConexao !== 'local') {
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
          // Falha de rede não deve expulsar o usuário. A sessão em cache permanece
          // e a interface pode se recuperar quando a conectividade voltar.
        });
    }

    const subscription = authService.onAuthStateChange((event, supabaseSession) => {
      if (!ativo) return;

      if (event === 'SIGNED_OUT') {
        limparSessaoRemotaEmCache();
        return;
      }

      if (
        supabaseSession?.user &&
        sessionRef.current?.modoConexao !== 'local' &&
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
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(novaSession));
    } catch (e) {
      console.error('Erro ao persistir sessão:', e);
    }

    if (novaSession.personagemVinculadoId) {
      setPersonagemAtivoId(novaSession.personagemVinculadoId);
    }
    // Contas remotas não têm um papel global: Mestre/Jogador/Observador é definido por campanha.
    // O Dashboard é o ponto de entrada correto para qualquer conta autenticada.
    setViewAtiva('dashboard');
  };

  const handleAtualizarSessao = (patch: Partial<UserSession>) => {
    setSession(current => {
      if (!current) return current;
      const atualizada = { ...current, ...patch };
      sessionRef.current = atualizada;
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(atualizada));
      } catch (error) {
        console.error('Erro ao persistir alterações da sessão:', error);
      }
      return atualizada;
    });
  };

  const handleMigrarDadosLocais = async () => {
    if (!usandoRemoto || !session?.authUserId) {
      throw new Error('Entre em uma conta online para sincronizar este dispositivo.');
    }

    const report = await localCloudMigrationService.migrate({
      campanhas: campanhasLocais,
      sessoes,
      npcs,
      adversarios,
      locais,
      pistas,
      loreEntries,
      anotacoes,
      cenas,
      handouts,
      contadores,
      mapas,
      tokensMapa,
      personagens: personagensLocais
    }, session.authUserId);

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

    if (usandoRemoto) {
      await authService.atualizarPreferencias(next);
    }

    handleAtualizarSessao({ uiPreferences: next });
  };

  const handleExportarDados = async () => {
    if (usandoRemoto) {
      const payload = await accountDataService.exportarConta();
      accountDataService.baixarJson(payload, `reinos-oniricos-backup-${new Date().toISOString().slice(0, 10)}.json`);
      return;
    }

    accountDataService.baixarJson({
      formato: 'reinos-oniricos-local-backup-v1',
      exportadoEm: new Date().toISOString(),
      perfil: session,
      campanhas: campanhasLocais,
      personagens: personagensLocais,
      sessoes,
      npcs,
      adversarios,
      locais,
      pistas,
      loreEntries,
      anotacoes,
      cenas,
      handouts,
      contadores,
      mapas,
      tokensMapa
    }, `reinos-oniricos-local-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleSairTodos = async () => {
    if (!usandoRemoto) {
      handleTrocarSessao();
      return;
    }

    await authService.sairTodos();
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar sessão local após logout global:', error);
    }
    sessionRef.current = null;
    setSession(null);
  };

  const handleTrocarSessao = () => {
    if (session?.modoConexao === 'supabase') void authService.sair().catch(() => undefined);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Erro ao limpar sessão:', e);
    }
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

    if (usandoRemoto) {
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
    } else {
      atualizarCampanha(camp.id, { sessaoAtual: sessao.numero });
    }

    setViewAtiva('modo_mesa');
  };

  const handleDetalhesCampanha = (camp: Campanha) => {
    setCampanhaAtivaId(camp.id);
    setViewAtiva(campaignEntryView(usandoRemoto ? campanhasRemotas.roleDaCampanha(camp.id) : session?.role));
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

  const arquivoParaDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  const handleExecutarCriacaoCampanha = async (dados: {
    nome: string;
    descricao: string;
    imagemUrl: string;
    imagemArquivo?: File;
    tipo: 'campanha' | 'oneshot' | 'playtest';
  }) => {
    if (usandoRemoto) {
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
      return;
    }

    const imagemUrl = dados.imagemArquivo
      ? await arquivoParaDataUrl(dados.imagemArquivo)
      : dados.imagemUrl;

    criarCampanhaLocal({ ...dados, imagemUrl });
    setViewAtiva('detalhe_campanha');
  };

  // Abrir Ficha de Personagem
  const handleAbrirFichaPersonagem = (p: Personagem) => {
    setPersonagemAtivoId(p.id);
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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const importado = importarJSON(content);
        if (importado) {
          alert('Ficha importada com sucesso.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Se o usuário ainda não escolheu seu perfil (Mestre vs Jogador), exibe a Tela de Login
  if (!session) {
    return (
      <>
        <LoginScreen
          personagens={personagens}
          onLogin={handleLogin}
          onCriarNovoPersonagem={(nome) => {
            const novo = criarNovoPersonagem(nome);
            return novo;
          }}
        />
      </>
    );
  }

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
            personagensParaVinculo={usandoRemoto ? personagensRemotos.personal.filter(personagem => !personagem.campaignId) : undefined}
            onEntrarComCodigo={usandoRemoto ? handleEntrarComCodigoRemoto : undefined}
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
            personagensParaVinculo={usandoRemoto ? personagensRemotos.personal.filter(personagem => !personagem.campaignId) : undefined}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            canPrepareCampaign={podePrepararCampanha}
            onEntrarComCodigo={usandoRemoto ? handleEntrarComCodigoRemoto : undefined}
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
            personagensPessoais={usandoRemoto ? personagensRemotos.personal : personagens}
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
            onNovaSessao={(campaignId, dados) => usandoRemoto ? void conteudoRemoto.criarSessao(campaignId, dados) : void criarSessao(campaignId, dados)}
            onAtualizarSessao={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarSessao(id, patch) : atualizarSessao(id, patch)}
            onAdicionarNPC={(item) => usandoRemoto ? conteudoRemoto.adicionarNPC(item) : adicionarNPC(item)}
            onAtualizarNPC={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarNPC(id, patch) : atualizarNPC(id, patch)}
            onRemoverNPC={(id) => usandoRemoto ? conteudoRemoto.removerNPC(id) : removerNPC(id)}
            onAdicionarAdversario={(item) => usandoRemoto ? conteudoRemoto.adicionarAdversario(item) : adicionarAdversario(item)}
            onAtualizarAdversario={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarAdversario(id, patch) : atualizarAdversario(id, patch)}
            onRemoverAdversario={(id) => usandoRemoto ? conteudoRemoto.removerAdversario(id) : removerAdversario(id)}
            onAdicionarLocal={(item) => usandoRemoto ? conteudoRemoto.adicionarLocal(item) : adicionarLocal(item)}
            onAtualizarLocal={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarLocal(id, patch) : atualizarLocal(id, patch)}
            onRemoverLocal={(id) => usandoRemoto ? conteudoRemoto.removerLocal(id) : removerLocal(id)}
            onAdicionarPista={(item) => usandoRemoto ? conteudoRemoto.adicionarPista(item) : adicionarPista(item)}
            onAtualizarPista={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarPista(id, patch) : atualizarPista(id, patch)}
            onRemoverPista={(id) => usandoRemoto ? conteudoRemoto.removerPista(id) : removerPista(id)}
            onAdicionarLore={(item) => usandoRemoto ? void conteudoRemoto.adicionarLore(item) : adicionarLore(item)}
            onAdicionarAnotacao={(campaignId, titulo, conteudo) => usandoRemoto ? conteudoRemoto.adicionarAnotacao(campaignId, titulo, conteudo) : adicionarAnotacao(campaignId, titulo, conteudo)}
            onAdicionarCena={(item) => usandoRemoto ? conteudoRemoto.adicionarCena(item) : adicionarCena(item)}
            onAtualizarCena={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarCena(id, patch) : atualizarCena(id, patch)}
            onRemoverCena={(id) => usandoRemoto ? conteudoRemoto.removerCena(id) : removerCena(id)}
            onAdicionarHandout={(item) => usandoRemoto ? conteudoRemoto.adicionarHandout(item) : adicionarHandout(item)}
            onAtualizarHandout={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarHandout(id, patch) : atualizarHandout(id, patch)}
            onRemoverHandout={(id) => usandoRemoto ? conteudoRemoto.removerHandout(id) : removerHandout(id)}
            onAdicionarMapa={(item) => usandoRemoto ? conteudoRemoto.adicionarMapa(item) : adicionarMapa(item)}
            onAtualizarMapa={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarMapa(id, patch) : atualizarMapa(id, patch)}
            onRemoverMapa={(id) => usandoRemoto ? conteudoRemoto.removerMapa(id) : removerMapa(id)}
            membros={usandoRemoto ? campanhasRemotas.membros.filter(membro => membro.campaignId === campanhaAtiva.id) : []}
            currentUserId={session.authUserId}
            canManageMembers={papelDaCampanha === 'mestre'}
            onRegenerarCodigo={usandoRemoto ? campanhasRemotas.regenerarCodigo : undefined}
            onAtualizarMembro={usandoRemoto ? campanhasRemotas.atualizarMembro : undefined}
            onVincularMinhaFicha={usandoRemoto ? handleVincularMinhaFicha : undefined}
            onExcluirCampanha={usandoRemoto ? (id) => { void campanhasRemotas.remover(id).then(() => { setCampanhaRemotaAtivaId(null); setViewAtiva('dashboard'); }).catch(error => alert(error.message || 'Não foi possível excluir a campanha.')); } : removerCampanha}
          />
        ) : (
          <DashboardView
            campanhas={campanhas}
            sessoes={sessoesAtuais}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
            canPrepareCampaign={podePrepararCampanha}
            personagensParaVinculo={usandoRemoto ? personagens : undefined}
            onEntrarComCodigo={usandoRemoto ? handleEntrarComCodigoRemoto : undefined}
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
            registroOnline={usandoRemoto}
            onVoltarParaCampanha={() => setViewAtiva(
              papelDaCampanha === 'mestre' ? 'detalhe_campanha' : 'campanhas'
            )}
            onAtualizarPersonagem={salvarPersonagemPersistente}
            onAbrirModalRupturaPara={handleAbrirModalRupturaPara}
            onAbrirFichaPersonagem={handleAbrirFichaPersonagem}
            contadores={contadores}
            onAdicionarContador={adicionarContador}
            onAtualizarContador={atualizarContador}
            onRemoverContador={removerContador}
            onDuplicarContador={duplicarContador}
            mapas={mapasAtuais}
            onAdicionarMapa={usandoRemoto ? ((item) => { void conteudoRemoto.adicionarMapa(item); }) : adicionarMapa}
            onAtualizarMapa={usandoRemoto ? ((id, patch) => { void conteudoRemoto.atualizarMapa(id, patch); }) : atualizarMapa}
            onRemoverMapa={usandoRemoto ? ((id) => { void conteudoRemoto.removerMapa(id); }) : removerMapa}
            onAtualizarSessao={usandoRemoto ? conteudoRemoto.atualizarSessao : ((id, patch) => atualizarSessao(id, patch))}
            tokensMapa={tokensMapa}
            onAdicionarTokenMapa={adicionarTokenMapa}
            onAtualizarTokenMapa={atualizarTokenMapa}
            onRemoverTokenMapa={removerTokenMapa}
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
            localDataSummary={{
              campanhas: campanhasLocais.length,
              personagens: personagensLocais.length,
              itens:
                sessoes.length +
                npcs.length +
                adversarios.length +
                locais.length +
                pistas.length +
                loreEntries.length +
                anotacoes.length +
                cenas.length +
                handouts.length +
                contadores.length +
                mapas.length +
                tokensMapa.length
            }}
            onMigrarDadosLocais={usandoRemoto ? handleMigrarDadosLocais : undefined}
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
            if (usandoRemoto) {
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
              return;
            }

            const imagemUrl = imagemArquivo
              ? await arquivoParaDataUrl(imagemArquivo)
              : novo.imagemUrl;
            const local = { ...novo, imagemUrl };
            salvarPersonagemLocal(local);
            setPersonagemParaFicha(local);
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
