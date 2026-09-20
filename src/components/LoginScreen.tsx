import React, { useState, useEffect } from 'react';
import { UserRole, UserSession } from '../types/auth';
import { Personagem } from '../types/character';
import { isSupabaseConfigured, testarConexaoSupabase } from '../lib/supabaseClient';

interface LoginScreenProps {
  personagens: Personagem[];
  onLogin: (session: UserSession) => void;
  onAbrirModalSql: () => void;
  onCriarNovoPersonagem: (nome?: string) => Personagem;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  personagens,
  onLogin,
  onAbrirModalSql,
  onCriarNovoPersonagem
}) => {
  const [roleAtivo, setRoleAtivo] = useState<UserRole>('mestre');

  // Campos Mestre
  const [mestreCodigoMesa, setMestreCodigoMesa] = useState('ONIRICO-01');
  const [mestreSenha, setMestreSenha] = useState('');
  const [mestreNome, setMestreNome] = useState('Narrador Onírico');
  const [erroMestre, setErroMestre] = useState('');

  // Campos Jogador
  const [jogadorCodigoMesa, setJogadorCodigoMesa] = useState('ONIRICO-01');
  const [jogadorNome, setJogadorNome] = useState('');
  const [personagemSelecionadoId, setPersonagemSelecionadoId] = useState(personagens[0]?.id || '');
  const [criarNovoAoEntrar, setCriarNovoAoEntrar] = useState(false);
  const [novoPersonagemNome, setNovoPersonagemNome] = useState('');
  const [erroJogador, setErroJogador] = useState('');

  // Status Supabase
  const [supabaseAtivo, setSupabaseAtivo] = useState(false);

  useEffect(() => {
    const configurado = isSupabaseConfigured();
    setSupabaseAtivo(configurado);
    if (configurado) {
      testarConexaoSupabase();
    }
  }, []);

  const handleEntrarMestre = (e: React.FormEvent) => {
    e.preventDefault();
    setErroMestre('');

    if (!mestreCodigoMesa.trim()) {
      setErroMestre('Informe o código da mesa.');
      return;
    }

    const session: UserSession = {
      id: 'mestre-' + Date.now(),
      role: 'mestre',
      nome: mestreNome.trim() || 'Mestre da Névoa',
      mesaCodigo: mestreCodigoMesa.trim().toUpperCase(),
      modoConexao: supabaseAtivo ? 'supabase' : 'local'
    };

    onLogin(session);
  };

  const handleEntrarJogador = (e: React.FormEvent) => {
    e.preventDefault();
    setErroJogador('');

    if (!jogadorNome.trim()) {
      setErroJogador('Informe seu nome ou apelido de jogador.');
      return;
    }

    let pId = personagemSelecionadoId;
    if (criarNovoAoEntrar) {
      const novo = onCriarNovoPersonagem(novoPersonagemNome.trim() || 'Novo Desvelado');
      pId = novo.id;
    }

    const session: UserSession = {
      id: 'jogador-' + Date.now(),
      role: 'jogador',
      nome: jogadorNome.trim(),
      mesaCodigo: jogadorCodigoMesa.trim().toUpperCase(),
      personagemVinculadoId: pId,
      modoConexao: supabaseAtivo ? 'supabase' : 'local'
    };

    onLogin(session);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#D9D7D2] flex flex-col justify-between selection:bg-[#A88952]/20 selection:text-[#F5F3EE]">
      {/* Topo / Header Minimalista */}
      <header className="border-b border-[#292929] bg-[#0B0B0B] py-4 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold tracking-widest text-[#A88952] border border-[#75603D]/60 px-1.5 py-0.5 rounded-sm">
              RO
            </span>
            <span className="font-serif text-base tracking-[0.2em] text-[#F5F3EE] uppercase font-medium">
              Reinos Oníricos
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={onAbrirModalSql}
              className="text-[#666666] hover:text-[#A88952] transition-colors"
            >
              Script Supabase (.sql)
            </button>
            <span className="text-[#292929]">|</span>
            <span className="text-[#666666]">
              {supabaseAtivo ? 'Nuvem Conectada' : 'Modo Local Ativo'}
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="max-w-xl w-full mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <span className="text-[11px] font-mono tracking-widest uppercase text-[#A88952] block mb-2">
            Horror Psicológico · Investigação · Sonhar
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#F5F3EE] tracking-tight">
            Acesso ao Sistema
          </h1>
          <p className="text-xs text-[#666666] mt-3 max-w-sm mx-auto leading-relaxed">
            Selecione seu perfil para conectar à crônica urbana e gerenciar a fronteira entre vigília e ruptura.
          </p>
        </div>

        {/* Seletor de Perfil (Mestre vs Jogador) */}
        <div className="bg-[#171717] border border-[#292929] p-1 grid grid-cols-2 rounded-sm mb-8">
          <button
            type="button"
            onClick={() => setRoleAtivo('mestre')}
            className={`py-2.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              roleAtivo === 'mestre'
                ? 'bg-[#292929] text-[#F5F3EE] border border-[#333333]'
                : 'text-[#666666] hover:text-[#D9D7D2]'
            }`}
          >
            Mestre / Narrador
          </button>
          <button
            type="button"
            onClick={() => setRoleAtivo('jogador')}
            className={`py-2.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              roleAtivo === 'jogador'
                ? 'bg-[#292929] text-[#F5F3EE] border border-[#333333]'
                : 'text-[#666666] hover:text-[#D9D7D2]'
            }`}
          >
            Jogador / Desvelado
          </button>
        </div>

        {/* Container do Formulário */}
        <div className="bg-[#171717] border border-[#292929] p-8 rounded-sm">
          {roleAtivo === 'mestre' ? (
            <form onSubmit={handleEntrarMestre} className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2">
                  Seu Nome ou Identificação
                </label>
                <input
                  type="text"
                  required
                  value={mestreNome}
                  onChange={(e) => setMestreNome(e.target.value)}
                  placeholder="Ex: Narrador Onírico"
                  className="w-full bg-[#0B0B0B] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-2.5 text-xs text-[#F5F3EE] transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2">
                  Código da Mesa
                </label>
                <input
                  type="text"
                  required
                  value={mestreCodigoMesa}
                  onChange={(e) => setMestreCodigoMesa(e.target.value.toUpperCase())}
                  placeholder="Ex: ONIRICO-01"
                  className="w-full bg-[#0B0B0B] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-2.5 text-xs font-mono text-[#F5F3EE] transition-colors rounded-sm uppercase"
                />
                <p className="text-[11px] text-[#666666] mt-1.5">
                  Mesa padrão inicial: <span className="text-[#A88952]">ONIRICO-01</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2">
                  Senha / PIN de Mestre (Opcional)
                </label>
                <input
                  type="password"
                  value={mestreSenha}
                  onChange={(e) => setMestreSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0B0B] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-2.5 text-xs text-[#F5F3EE] transition-colors rounded-sm"
                />
              </div>

              {erroMestre && (
                <div className="text-xs text-rose-400 font-mono">{erroMestre}</div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm"
              >
                Acessar Painel do Mestre →
              </button>
            </form>
          ) : (
            <form onSubmit={handleEntrarJogador} className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2">
                  Seu Nome ou Apelido
                </label>
                <input
                  type="text"
                  required
                  value={jogadorNome}
                  onChange={(e) => setJogadorNome(e.target.value)}
                  placeholder="Ex: Carlos, Ana..."
                  className="w-full bg-[#0B0B0B] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-2.5 text-xs text-[#F5F3EE] transition-colors rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2">
                  Código da Mesa do Mestre
                </label>
                <input
                  type="text"
                  required
                  value={jogadorCodigoMesa}
                  onChange={(e) => setJogadorCodigoMesa(e.target.value.toUpperCase())}
                  placeholder="Ex: ONIRICO-01"
                  className="w-full bg-[#0B0B0B] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-2.5 text-xs font-mono text-[#F5F3EE] transition-colors rounded-sm uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-[#666666]">
                    Seu Personagem Desvelado
                  </label>
                  <button
                    type="button"
                    onClick={() => setCriarNovoAoEntrar(!criarNovoAoEntrar)}
                    className="text-[11px] font-mono text-[#A88952] hover:underline"
                  >
                    {criarNovoAoEntrar ? 'Escolher Existente' : '+ Criar Novo'}
                  </button>
                </div>

                {criarNovoAoEntrar ? (
                  <input
                    type="text"
                    required
                    value={novoPersonagemNome}
                    onChange={(e) => setNovoPersonagemNome(e.target.value)}
                    placeholder="Nome do novo Desvelado..."
                    className="w-full bg-[#0B0B0B] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-2.5 text-xs text-[#F5F3EE] transition-colors rounded-sm"
                  />
                ) : (
                  <select
                    value={personagemSelecionadoId}
                    onChange={(e) => setPersonagemSelecionadoId(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-2.5 text-xs text-[#F5F3EE] transition-colors rounded-sm"
                  >
                    {personagens.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (Nível {p.nivel} {p.conceito})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {erroJogador && (
                <div className="text-xs text-rose-400 font-mono">{erroJogador}</div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm"
              >
                Entrar na Crônica →
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-[#292929] py-4 px-6 text-center text-[11px] font-mono text-[#666666]">
        Reinos Oníricos RPG · Sistema de Investigação e Horror Psicológico Urbano
      </footer>
    </div>
  );
};
