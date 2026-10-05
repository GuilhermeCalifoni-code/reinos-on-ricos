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
import { Campanha } from './types/campaign';
import { UserSession } from './types/auth';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { authService } from './services/auth/authService';
import { useRemoteCampaigns } from './services/campaigns/useRemoteCampaigns';
import { useRemoteCampaignContent } from './services/campaigns/useRemoteCampaignContent';
import { useRemoteCharacters } from './services/characters/useRemoteCharacters';
import { campaignRepository } from './services/campaigns/campaignRepository';
import { campaignAssetService } from './services/storage/campaignAssetService';
import { localCloudMigrationService } from './services/migration/localCloudMigrationService';

const SESSION_STORAGE_KEY = 'reinos_oniricos_session_v1';

const CreateCampaignView = React.lazy(() => import('./components/CreateCampaignView').then(module => ({ default: module.CreateCampaignView })));
const CampaignDetailView = React.lazy(() => import('./components/CampaignDetailView').then(module => ({ default: module.CampaignDetailView })));
const MesaView = React.lazy(() => import('./components/MesaView').then(module => ({ default: module.MesaView })));
const CharactersListView = React.lazy(() => import('./components/CharactersListView').then(module => ({ default: module.CharactersListView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
const CharacterSheet = React.lazy(() => import('./components/CharacterSheet').then(module => ({ default: module.CharacterSheet })));
const RulesReference = React.lazy(() => import('./components/RulesReference').then(module => ({ default: module.RulesReference })));

const ViewFallback = () => (
  <div className="ro-empty-state m-6">
    <span>Carregando arquivo da Vigília…</span>
  </div>
);

export default function App() {
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
  }, [session]);

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
    importarJSON,
    restaurarExemplos
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
    pistas,
    adicionarPista,
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
  const campanhas = usandoRemoto ? campanhasRemotas.campanhas : campanhasLocais;
  const campanhaAtivaId = usandoRemoto ? campanhaRemotaAtivaId : campanhaAtivaIdLocal;
  const campanhaAtiva = usandoRemoto ? campanhas.find(c => c.id === campanhaRemotaAtivaId) || campanhas[0] || null : campanhaAtivaLocal;
  const setCampanhaAtivaId = (id: string) => usandoRemoto ? setCampanhaRemotaAtivaId(id) : setCampanhaAtivaIdLocal(id);
  const papelDaCampanha = usandoRemoto ? campanhasRemotas.roleDaCampanha(campanhaAtivaId || undefined) || 'observador' : session?.role || 'observador';
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

      const restaurada: UserSession = {
        id: supabaseSession.user.id,
        authUserId: supabaseSession.user.id,
        role: 'observador',
        nome: profile.nome,
        email: supabaseSession.user.email,
        avatarUrl: profile.avatarUrl,
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

  const handleTrocarSessao = () => {
    if (session?.modoConexao === 'supabase') void authService.sair().catch(() => undefined);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Erro ao limpar sessão:', e);
    }
    sessionRef.current = null;
    setSession(null);
  };

  // Navegações de Campanha
  const handleContinuarCampanha = (camp: Campanha) => {
    setCampanhaAtivaId(camp.id);
    setViewAtiva('modo_mesa');
  };

  const handleDetalhesCampanha = (camp: Campanha) => {
    setCampanhaAtivaId(camp.id);
    setViewAtiva('detalhe_campanha');
  };

  const handleIniciarCriacaoCampanha = () => {
    setViewAtiva('criar_campanha');
  };

  const handleEntrarComCodigoRemoto = async (codigo: string, personagemId?: string) => {
    const id = await campanhasRemotas.entrarComCodigo(codigo);
    if (personagemId && session?.authUserId) {
      const personagem = personagens.find(item => item.id === personagemId);
      if (personagem) {
        await campaignRepository.vincularPersonagem(id, personagem.id);
        await personagensRemotos.refresh();
      }
    }
    await campanhasRemotas.recarregar();
    setCampanhaRemotaAtivaId(id);
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
            personagensParaVinculo={usandoRemoto ? personagens : undefined}
            onEntrarComCodigo={usandoRemoto ? handleEntrarComCodigoRemoto : undefined}
            avatarUrl={session.avatarUrl}
            onAbrirCampanhas={() => setViewAtiva('campanhas')}
            onAbrirConfiguracoes={() => setViewAtiva('configuracoes')}
            onSair={handleTrocarSessao}
          />
        );

      case 'campanhas':
        return (
          <CampaignsLibraryView
            campanhas={campanhas}
            personagensParaVinculo={usandoRemoto ? personagens : undefined}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            onEntrarComCodigo={usandoRemoto ? handleEntrarComCodigoRemoto : undefined}
          />
        );

      case 'criar_campanha':
        return (
          <CreateCampaignView
            onCriar={handleExecutarCriacaoCampanha}
            onCancelar={() => setViewAtiva('dashboard')}
          />
        );

      case 'detalhe_campanha':
        return campanhaAtiva ? (
          <CampaignDetailView
            campanha={campanhaAtiva}
            personagens={personagensCampanha}
            sessoes={sessoesAtuais}
            npcs={npcsAtuais}
            adversarios={adversariosAtuais}
            locais={locaisAtuais}
            pistas={pistasAtuais}
            loreEntries={loreAtual}
            anotacoes={anotacoesAtuais}
            cenas={cenasAtuais}
            handouts={handoutsAtuais}
            onIniciarSessao={handleContinuarCampanha}
            onAbrirFichaPersonagem={handleAbrirFichaPersonagem}
            onNovaSessao={(campaignId, dados) => usandoRemoto ? void conteudoRemoto.criarSessao(campaignId, dados) : void criarSessao(campaignId, dados)}
            onAdicionarNPC={(item) => usandoRemoto ? conteudoRemoto.adicionarNPC(item) : adicionarNPC(item)}
            onAtualizarNPC={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarNPC(id, patch) : atualizarNPC(id, patch)}
            onRemoverNPC={(id) => usandoRemoto ? conteudoRemoto.removerNPC(id) : removerNPC(id)}
            onAdicionarAdversario={(item) => usandoRemoto ? conteudoRemoto.adicionarAdversario(item) : adicionarAdversario(item)}
            onAtualizarAdversario={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarAdversario(id, patch) : atualizarAdversario(id, patch)}
            onRemoverAdversario={(id) => usandoRemoto ? conteudoRemoto.removerAdversario(id) : removerAdversario(id)}
            onAdicionarLocal={(item) => usandoRemoto ? void conteudoRemoto.adicionarLocal(item) : adicionarLocal(item)}
            onAdicionarPista={(item) => usandoRemoto ? void conteudoRemoto.adicionarPista(item) : adicionarPista(item)}
            onAdicionarLore={(item) => usandoRemoto ? void conteudoRemoto.adicionarLore(item) : adicionarLore(item)}
            onAdicionarAnotacao={(campaignId, titulo, conteudo) => usandoRemoto ? conteudoRemoto.adicionarAnotacao(campaignId, titulo, conteudo) : adicionarAnotacao(campaignId, titulo, conteudo)}
            onAdicionarCena={(item) => usandoRemoto ? conteudoRemoto.adicionarCena(item) : adicionarCena(item)}
            onAtualizarCena={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarCena(id, patch) : atualizarCena(id, patch)}
            onRemoverCena={(id) => usandoRemoto ? conteudoRemoto.removerCena(id) : removerCena(id)}
            onAdicionarHandout={(item) => usandoRemoto ? conteudoRemoto.adicionarHandout(item) : adicionarHandout(item)}
            onAtualizarHandout={(id, patch) => usandoRemoto ? conteudoRemoto.atualizarHandout(id, patch) : atualizarHandout(id, patch)}
            onRemoverHandout={(id) => usandoRemoto ? conteudoRemoto.removerHandout(id) : removerHandout(id)}
            membros={usandoRemoto ? campanhasRemotas.membros.filter(membro => membro.campaignId === campanhaAtiva.id) : []}
            currentUserId={session.authUserId}
            canManageMembers={papelDaCampanha === 'mestre'}
            onRegenerarCodigo={usandoRemoto ? campanhasRemotas.regenerarCodigo : undefined}
            onAtualizarMembro={usandoRemoto ? campanhasRemotas.atualizarMembro : undefined}
            onExcluirCampanha={usandoRemoto ? (id) => { void campanhasRemotas.remover(id).then(() => { setCampanhaRemotaAtivaId(null); setViewAtiva('dashboard'); }).catch(error => alert(error.message || 'Não foi possível excluir a campanha.')); } : removerCampanha}
          />
        ) : (
          <DashboardView
            campanhas={campanhas}
            sessoes={sessoesAtuais}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
            personagensParaVinculo={usandoRemoto ? personagens : undefined}
            onEntrarComCodigo={usandoRemoto ? handleEntrarComCodigoRemoto : undefined}
          />
        );

      case 'modo_mesa':
        return campanhaAtiva ? (
          <MesaView
            campanha={campanhaAtiva}
            personagens={personagensCampanha}
            role={papelDaCampanha}
            personagemJogadorId={personagemJogadorId}
            userId={session.authUserId}
            userName={session.nome}
            sessionId={sessaoAtivaId}
            sessionTitle={sessaoAtiva?.titulo}
            sessionDescription={sessaoAtiva?.descricao}
            members={membrosCampanha}
            registroOnline={usandoRemoto}
            onVoltarParaCampanha={() => setViewAtiva('detalhe_campanha')}
            onAtualizarPersonagem={salvarPersonagemPersistente}
            onAbrirModalRupturaPara={handleAbrirModalRupturaPara}
            onAbrirFichaPersonagem={handleAbrirFichaPersonagem}
            contadores={contadores}
            onAdicionarContador={adicionarContador}
            onAtualizarContador={atualizarContador}
            onRemoverContador={removerContador}
            onDuplicarContador={duplicarContador}
            mapas={mapas}
            onAdicionarMapa={adicionarMapa}
            onAtualizarMapa={atualizarMapa}
            onRemoverMapa={removerMapa}
            tokensMapa={tokensMapa}
            onAdicionarTokenMapa={adicionarTokenMapa}
            onAtualizarTokenMapa={atualizarTokenMapa}
            onRemoverTokenMapa={removerTokenMapa}
          />
        ) : null;

      case 'compendio':
        return (
          <div className="ro-compendium-shell">
            <RulesReference />
          </div>
        );

      case 'personagens':
        return (
          <CharactersListView
            personagens={personagens}
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
            onRestaurarExemplos={restaurarExemplos}
            onAtualizarSessao={handleAtualizarSessao}
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
        campanhas={campanhas}
        campanhaAtivaId={campanhaAtivaId}
        onSelecionarCampanha={(id) => {
          setCampanhaAtivaId(id);
          setPersonagemParaFicha(null);
          setViewAtiva('detalhe_campanha');
        }}
        onNovaCampanha={handleIniciarCriacaoCampanha}
        onAbrirMesa={() => {
          const alvo = campanhaAtiva || campanhas[0];
          if (alvo) handleContinuarCampanha(alvo);
          else handleIniciarCriacaoCampanha();
        }}
        onSair={handleTrocarSessao}
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
        />}
        {/* 10. HEADER (Minimalista, Fundo #0B0B0B, Borda #292929) */}
        {viewAtiva !== 'modo_mesa' && viewAtiva !== 'dashboard' && viewAtiva !== 'campanhas' && <Header
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
          onCriar={(novo) => {
            salvarPersonagemPersistente(novo);
            setPersonagemParaFicha(novo);
            setModalCriarPersonagem(false);
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
