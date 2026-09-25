import React, { useState, useRef } from 'react';
import { Sidebar, MobileNavigation, MainViewType } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CreateCampaignView } from './components/CreateCampaignView';
import { CampaignDetailView } from './components/CampaignDetailView';
import { MesaView } from './components/MesaView';
import { CharactersListView } from './components/CharactersListView';
import { SettingsView } from './components/SettingsView';
import { CharacterSheet } from './components/CharacterSheet';
import { CreateCharacterModal } from './components/CreateCharacterModal';
import { RupturaModal } from './components/RupturaModal';
import { LoginScreen } from './components/LoginScreen';
import { SupabaseSqlModal } from './components/SupabaseSqlModal';
import { useCharacterStorage } from './data/characterStore';
import { useCampaignStorage } from './data/campaignStore';
import { Personagem, AtributoNome, DominioNome } from './types/character';
import { Campanha } from './types/campaign';
import { UserSession } from './types/auth';

const SESSION_STORAGE_KEY = 'reinos_oniricos_session_v1';

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

  // Storage de Personagens
  const {
    personagens,
    personagemAtivo,
    personagemAtivoId,
    setPersonagemAtivoId,
    salvarPersonagem,
    criarNovoPersonagem,
    duplicarPersonagem,
    excluirPersonagem,
    exportarJSON,
    importarJSON,
    restaurarExemplos
  } = useCharacterStorage(session?.mesaCodigo || 'ONIRICO-01');

  // Storage de Campanhas
  const {
    campanhas,
    campanhaAtivaId,
    campanhaAtiva,
    setCampanhaAtivaId,
    criarCampanha,
    atualizarCampanha,
    removerCampanha,
    sessoes,
    criarSessao,
    npcs,
    adicionarNPC,
    adversarios,
    adicionarAdversario,
    locais,
    adicionarLocal,
    pistas,
    adicionarPista,
    loreEntries,
    adicionarLore,
    anotacoes,
    adicionarAnotacao
  } = useCampaignStorage();

  // Navegação Principal do Produto
  const [viewAtiva, setViewAtiva] = useState<MainViewType>('dashboard');
  const [personagemParaFicha, setPersonagemParaFicha] = useState<Personagem | null>(null);

  // Modais
  const [modalCriarPersonagem, setModalCriarPersonagem] = useState<boolean>(false);
  const [modalSqlAberto, setModalSqlAberto] = useState<boolean>(false);

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
    setSession(novaSession);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(novaSession));
    } catch (e) {
      console.error('Erro ao persistir sessão:', e);
    }

    if (novaSession.role === 'mestre') {
      setViewAtiva('dashboard');
    } else {
      if (novaSession.personagemVinculadoId) {
        setPersonagemAtivoId(novaSession.personagemVinculadoId);
        const p = personagens.find(x => x.id === novaSession.personagemVinculadoId);
        if (p) {
          setPersonagemParaFicha(p);
        }
      }
      setViewAtiva('personagens');
    }
  };

  const handleTrocarSessao = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Erro ao limpar sessão:', e);
    }
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

  const handleExecutarCriacaoCampanha = (dados: {
    nome: string;
    descricao: string;
    imagemUrl: string;
    tipo: 'campanha' | 'oneshot' | 'playtest';
  }) => {
    const nova = criarCampanha(dados);
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
          onAbrirModalSql={() => setModalSqlAberto(true)}
          onCriarNovoPersonagem={(nome) => {
            const novo = criarNovoPersonagem(nome);
            return novo;
          }}
        />

        {/* Modal da Query SQL do Supabase */}
        <SupabaseSqlModal
          isOpen={modalSqlAberto}
          onClose={() => setModalSqlAberto(false)}
        />
      </>
    );
  }

  // Se uma ficha específica estiver aberta em detalhe:
  const renderConteudoPrincipal = () => {
    if (personagemParaFicha) {
      return (
        <div className="max-w-7xl mx-auto px-6 py-6 w-full">
          <div className="mb-6 flex items-center justify-between pb-4 border-b border-[#292929]">
            <button
              onClick={() => setPersonagemParaFicha(null)}
              className="text-xs font-mono text-[#666666] hover:text-[#A88952] transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Voltar para o painel</span>
            </button>
            <span className="text-xs font-mono uppercase text-[#A88952]">
              Ficha do Desvelado · {personagemParaFicha.nome}
            </span>
          </div>

          <CharacterSheet
            personagem={personagemParaFicha}
            onSalvar={(atualizado) => {
              salvarPersonagem(atualizado);
              setPersonagemParaFicha(atualizado);
            }}
            onDuplicar={(p) => {
              duplicarPersonagem(p);
              setPersonagemParaFicha(null);
            }}
            onExcluir={(id) => {
              excluirPersonagem(id);
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
      case 'campanhas':
        return (
          <DashboardView
            campanhas={campanhas}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
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
            personagens={personagens}
            sessoes={sessoes}
            npcs={npcs}
            adversarios={adversarios}
            locais={locais}
            pistas={pistas}
            loreEntries={loreEntries}
            anotacoes={anotacoes}
            onIniciarSessao={handleContinuarCampanha}
            onAbrirFichaPersonagem={handleAbrirFichaPersonagem}
            onNovaSessao={criarSessao}
            onAdicionarNPC={adicionarNPC}
            onAdicionarAdversario={adicionarAdversario}
            onAdicionarLocal={adicionarLocal}
            onAdicionarPista={adicionarPista}
            onAdicionarLore={adicionarLore}
            onAdicionarAnotacao={adicionarAnotacao}
            onExcluirCampanha={removerCampanha}
          />
        ) : (
          <DashboardView
            campanhas={campanhas}
            onNovaCampanha={handleIniciarCriacaoCampanha}
            onContinuarCampanha={handleContinuarCampanha}
            onDetalhesCampanha={handleDetalhesCampanha}
          />
        );

      case 'modo_mesa':
        return campanhaAtiva ? (
          <MesaView
            campanha={campanhaAtiva}
            personagens={personagens}
            onVoltarParaCampanha={() => setViewAtiva('detalhe_campanha')}
            onAtualizarPersonagem={salvarPersonagem}
            onAbrirModalRupturaPara={handleAbrirModalRupturaPara}
            onAbrirFichaPersonagem={handleAbrirFichaPersonagem}
          />
        ) : null;

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
            onAbrirModalSql={() => setModalSqlAberto(true)}
            onTrocarSessao={handleTrocarSessao}
            onRestaurarExemplos={restaurarExemplos}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="ro-app-shell flex font-sans selection:bg-[#A88952]/20 selection:text-[#F5F3EE]">
      {/* Input Oculto de Arquivo JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* 9. SIDEBAR (210-230px, Fundo #171717, Borda #292929, Minimalista) */}
      <Sidebar
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
        onSair={handleTrocarSessao}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNavigation
          viewAtiva={viewAtiva}
          setViewAtiva={(v) => {
            setPersonagemParaFicha(null);
            setViewAtiva(v);
          }}
          onNovaCampanha={handleIniciarCriacaoCampanha}
        />
        {/* 10. HEADER (Minimalista, Fundo #0B0B0B, Borda #292929) */}
        <Header
          campanhaNome={
            (viewAtiva === 'detalhe_campanha' || viewAtiva === 'modo_mesa') 
              ? campanhaAtiva?.nome 
              : undefined
          }
          rupturaNivel={campanhaAtiva?.rupturaGeral || 0}
          session={session}
          onAbrirSql={() => setModalSqlAberto(true)}
        />

        {/* View renderizada */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          {renderConteudoPrincipal()}
        </main>
      </div>

      {/* Modal Criar Personagem */}
      {modalCriarPersonagem && (
        <CreateCharacterModal
          isOpen={modalCriarPersonagem}
          onClose={() => setModalCriarPersonagem(false)}
          onCriar={(novo) => {
            salvarPersonagem(novo);
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
            salvarPersonagem(pAtualizado);
            setModalRupturaGlobal({ aberto: false, personagem: null, delta: 1, motivo: '' });
          }}
          ajusteSugerido={{
            delta: modalRupturaGlobal.delta,
            motivo: modalRupturaGlobal.motivo,
            origem: 'manual'
          }}
        />
      )}

      {/* Modal da Query SQL do Supabase */}
      <SupabaseSqlModal
        isOpen={modalSqlAberto}
        onClose={() => setModalSqlAberto(false)}
      />
    </div>
  );
}
