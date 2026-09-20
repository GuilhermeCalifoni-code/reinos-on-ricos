import React from 'react';
import { 
  User, 
  Sparkles, 
  Dice5, 
  ShieldAlert, 
  BookOpen, 
  AlertTriangle, 
  Heart, 
  Shield, 
  Zap, 
  Plus,
  Upload,
  Crown,
  LogOut,
  Database
} from 'lucide-react';
import { Personagem } from '../types/character';
import { UserSession } from '../types/auth';

export type ModuloNavegacao = 
  | 'ficha' 
  | 'rolador' 
  | 'sonhar' 
  | 'mestre' 
  | 'regras';

interface NavbarProps {
  moduloAtivo: ModuloNavegacao;
  setModuloAtivo: (modulo: ModuloNavegacao) => void;
  personagens: Personagem[];
  personagemAtivoId: string;
  session: UserSession | null;
  onSelecionarPersonagem: (id: string) => void;
  onNovoPersonagem: () => void;
  onImportarFicha: () => void;
  onTrocarSessao: () => void;
  onAbrirModalSql: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  moduloAtivo,
  setModuloAtivo,
  personagens,
  personagemAtivoId,
  session,
  onSelecionarPersonagem,
  onNovoPersonagem,
  onImportarFicha,
  onTrocarSessao,
  onAbrirModalSql
}) => {
  const personagemAtivo = personagens.find(p => p.id === personagemAtivoId) || personagens[0] || null;

  return (
    <header className="sticky top-0 z-40 bg-[#0d1017]/95 backdrop-blur border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Marca Urbana */}
          <div className="flex items-center gap-3 min-w-max">
            <div className="relative flex items-center justify-center w-9 h-9 rounded bg-slate-900 border border-cyan-500/40 text-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="font-mono text-sm tracking-wider font-extrabold">RO</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] font-bold text-base tracking-wider text-slate-100 uppercase">
                  Reinos Oníricos
                </span>
                {session?.role === 'mestre' ? (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Mestre
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1">
                    <User className="w-3 h-3" /> Jogador
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Mesa: <strong className="text-slate-200">{session?.mesaCodigo || 'ONIRICO-01'}</strong> · {session?.nome}
              </p>
            </div>
          </div>

          {/* Seletor de Personagem Ativo */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1.5 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={personagemAtivoId}
              onChange={(e) => {
                if (e.target.value === '__novo__') {
                  onNovoPersonagem();
                } else {
                  onSelecionarPersonagem(e.target.value);
                }
              }}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-4"
            >
              {personagens.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.nome} (Nvl {p.nivel} {p.conceito})
                </option>
              ))}
              <option value="__novo__" className="bg-slate-900 text-cyan-400 font-bold">
                + Criar Novo Desvelado...
              </option>
            </select>
            <button
              onClick={onImportarFicha}
              className="text-slate-400 hover:text-cyan-300 p-1 rounded"
              title="Importar Ficha (.json)"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick HUD do Personagem Ativo */}
          {personagemAtivo && (
            <div className="hidden xl:flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-md px-3 py-1 font-mono text-xs">
              <div className="flex items-center gap-1 text-rose-400" title="Pontos de Vida">
                <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                <span className="font-bold">{personagemAtivo.vidaAtual}/{personagemAtivo.vidaMaxima} V</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div className="flex items-center gap-1 text-cyan-400" title="Proteção Onírica">
                <Shield className="w-3.5 h-3.5 fill-cyan-500/20" />
                <span>{personagemAtivo.protecaoOniricaAtual}/{personagemAtivo.protecaoOniricaMaxima} PO</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div className="flex items-center gap-1 text-amber-400" title="Pontos de Foco">
                <Zap className="w-3.5 h-3.5" />
                <span>{personagemAtivo.focoAtual}/{personagemAtivo.focoMaximo} F</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div 
                className={`flex items-center gap-1 font-semibold ${
                  personagemAtivo.ruptura >= 5 
                    ? 'text-rose-400 animate-pulse' 
                    : personagemAtivo.ruptura >= 3 
                    ? 'text-amber-400' 
                    : 'text-slate-300'
                }`}
                title="Trilha de Ruptura (0 a 6)"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ruptura {personagemAtivo.ruptura}/6</span>
              </div>
            </div>
          )}

          {/* Navegação Principal e Ações de Sessão */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
              <button
                id="nav-ficha"
                onClick={() => setModuloAtivo('ficha')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  moduloAtivo === 'ficha'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Ficha</span>
              </button>

              <button
                id="nav-rolador"
                onClick={() => setModuloAtivo('rolador')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  moduloAtivo === 'rolador'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Dice5 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rolador</span>
              </button>

              <button
                id="nav-guia-sonhar"
                onClick={() => setModuloAtivo('sonhar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  moduloAtivo === 'sonhar'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="whitespace-nowrap">Guia do Sonhar</span>
              </button>

              {/* Botão Mestre / Cena de Tensão */}
              <button
                id="nav-painel-mestre"
                onClick={() => setModuloAtivo('mestre')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  moduloAtivo === 'mestre'
                    ? session?.role === 'mestre'
                      ? 'bg-purple-950/80 text-purple-200 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                      : 'bg-rose-950/70 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="whitespace-nowrap">
                  {session?.role === 'mestre' ? 'Painel do Mestre' : 'Cena de Tensão'}
                </span>
              </button>

              <button
                id="nav-regras"
                onClick={() => setModuloAtivo('regras')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                  moduloAtivo === 'regras'
                    ? 'bg-slate-800 text-slate-100 border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Referência Rápida do Livro Básico"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Regras</span>
              </button>
            </nav>

            {/* Ações Auxiliares: Query SQL e Trocar Perfil */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={onAbrirModalSql}
                className="p-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition"
                title="Ver Script SQL Supabase"
              >
                <Database className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onTrocarSessao}
                className="p-1.5 rounded bg-slate-900 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition flex items-center gap-1 text-[11px] font-mono"
                title="Trocar Perfil / Sair para Login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
