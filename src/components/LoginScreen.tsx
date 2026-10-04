import React, { useEffect, useState } from 'react';
import { Personagem } from '../types/character';
import { UserSession } from '../types/auth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/auth/authService';
import { ThemeToggle } from '../design-system/ThemeToggle';

interface LoginScreenProps {
  personagens: Personagem[];
  onLogin: (session: UserSession) => void;
  onCriarNovoPersonagem: (nome?: string) => Personagem;
}

type AuthMode = 'entrar' | 'cadastro' | 'local' | 'nova_senha';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  personagens, onLogin, onCriarNovoPersonagem
}) => {
  const remoto = isSupabaseConfigured();
  const [modo, setModo] = useState<AuthMode>('entrar');
  const usarRemoto = modo !== 'local';
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('ONIRICO-01');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const trocarModo = (proximo: AuthMode) => {
    setModo(proximo);
    setErro('');
    setMensagem('');
  };

  useEffect(() => {
    if (!remoto) return;
    const subscription = authService.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        setModo('nova_senha');
        setMensagem('Defina uma nova senha para concluir a recuperação.');
      }
    });
    return () => subscription.unsubscribe();
  }, [remoto]);

  const concluirAuth = async (user: { id: string; email?: string; user_metadata: Record<string, unknown> }) => {
    const perfil = await authService.perfil(user as any);
    onLogin({
      id: user.id,
      authUserId: user.id,
      role: 'observador',
      nome: perfil.nome,
      email: user.email,
      mesaCodigo: '',
      modoConexao: 'supabase'
    });
  };

  const autenticar = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setMensagem('');

    if (!remoto) {
      setErro('O acesso online ainda não está configurado neste deploy. Você pode usar o Modo local agora.');
      return;
    }

    setEnviando(true);
    try {
      if (modo === 'nova_senha') {
        if (senha.length < 6) throw new Error('A nova senha precisa ter pelo menos 6 caracteres.');
        if (senha !== confirmacao) throw new Error('As senhas não coincidem.');
        await authService.atualizarSenha(senha);
        setSenha('');
        setConfirmacao('');
        setModo('entrar');
        setMensagem('Senha atualizada. Você já pode entrar.');
        return;
      }

      if (modo === 'cadastro') {
        const data = await authService.cadastrar(email, senha, nome || email.split('@')[0]);
        if (data.session && data.user) await concluirAuth(data.user);
        else setMensagem('Conta criada. Confirme seu e-mail antes de entrar.');
        return;
      }

      const session = await authService.entrar(email, senha);
      if (session?.user) await concluirAuth(session.user);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível autenticar.');
    } finally {
      setEnviando(false);
    }
  };

  const recuperar = async () => {
    setErro('');
    setMensagem('');
    if (!remoto) {
      setErro('A recuperação de conta depende da conexão online, que ainda não está configurada neste deploy.');
      return;
    }
    if (!email.trim()) {
      setErro('Informe seu e-mail primeiro.');
      return;
    }
    try {
      await authService.recuperarSenha(email);
      setMensagem('Enviamos as instruções de recuperação para seu e-mail.');
    } catch (err: any) {
      setErro(err.message || 'Não foi possível iniciar a recuperação.');
    }
  };

  const entrarLocal = (event: React.FormEvent) => {
    event.preventDefault();
    const personagem = personagens[0] || onCriarNovoPersonagem(nome || 'Novo Desvelado');
    onLogin({
      id: `local-${Date.now()}`,
      role: 'mestre',
      nome: nome || 'Narrador Onírico',
      mesaCodigo: codigo.toUpperCase(),
      personagemVinculadoId: personagem.id,
      modoConexao: 'local'
    });
  };

  const titulo = modo === 'cadastro'
    ? 'Criar sua conta'
    : modo === 'nova_senha'
      ? 'Definir nova senha'
      : modo === 'local'
        ? 'Modo local'
        : 'Bem-vindo de volta.';

  return (
    <div className="login-onirico login-onirico--urban login-onirico--reference">
      <header className="login-onirico__header">
        <a className="login-onirico__identity" href="/" aria-label="Reinos Oníricos RPG">
          <img src="/ro-mark.svg" alt="" className="login-onirico__mark" />
          <span>
            <strong>REINOS ONÍRICOS</strong>
            <small>RPG · Plataforma de mesa</small>
          </span>
        </a>
        <ThemeToggle />
      </header>

      <main className="login-onirico__main login-onirico__main--urban">
        <section className="login-onirico__intro login-onirico__intro--urban">
          <div className="login-onirico__intro-content">
            <div className="login-onirico__wordmark">
              <img src="/ro-mark.svg" alt="" />
              <div>
                <strong>REINOS<br />ONÍRICOS</strong>
                <small>RPG</small>
              </div>
            </div>

            <p className="ro-eyebrow">Fantasia urbana · Vigília · Sonhar</p>
            <h1>Entre na Vigília.<br />Atravesse o Sonhar.</h1>
            <p className="login-onirico__lead">
              Reinos Oníricos RPG é uma plataforma de fantasia urbana onde o real e o onírico se encontram.
              Crie campanhas, reúna seu grupo, desenvolva personagens e conduza histórias que atravessam cidades,
              sonhos e outras realidades.
            </p>
            <blockquote>“Entre o concreto e o impossível, existem aqueles que ainda investigam.”</blockquote>
          </div>
        </section>

        <section className="login-onirico__access-column">
          <section className="login-onirico__panel login-onirico__panel--urban">
            <div className="login-onirico__panel-brand">
              <img src="/ro-mark.svg" alt="" />
              <div>
                <p className="ro-eyebrow">{modo === 'nova_senha' ? 'Recuperação de acesso' : 'Portal da mesa'}</p>
                <h2>{titulo}</h2>
              </div>
            </div>

            <p className="login-onirico__panel-copy">
              {modo === 'entrar' && 'Acesse sua conta para continuar na Vigília e retomar suas campanhas.'}
              {modo === 'cadastro' && 'Crie sua conta para organizar campanhas, fichas e sessões compartilhadas.'}
              {modo === 'local' && 'Use o modo local para demonstração ou jogo no mesmo dispositivo, sem sincronização online.'}
              {modo === 'nova_senha' && 'Escolha uma nova senha para recuperar seu acesso.'}
            </p>

            {modo !== 'nova_senha' && (
              <div className="login-onirico__switch" role="tablist" aria-label="Forma de acesso">
                <button type="button" onClick={() => trocarModo('entrar')} className={modo === 'entrar' ? 'is-active' : ''}>Entrar</button>
                <button type="button" onClick={() => trocarModo('cadastro')} className={modo === 'cadastro' ? 'is-active' : ''}>Criar conta</button>
                <button type="button" onClick={() => trocarModo('local')} className={modo === 'local' ? 'is-active' : ''}>Modo local</button>
              </div>
            )}

            <form onSubmit={usarRemoto ? autenticar : entrarLocal} className="login-onirico__form">
              {(modo === 'cadastro' || modo === 'local') && (
                <label>
                  <span>Nome</span>
                  <input autoComplete="name" value={nome} onChange={event => setNome(event.target.value)} placeholder="Como devemos chamar você?" />
                </label>
              )}

              {usarRemoto && modo !== 'nova_senha' && (
                <label>
                  <span>E-mail</span>
                  <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
                </label>
              )}

              {usarRemoto ? (
                <>
                  <label>
                    <span>{modo === 'nova_senha' ? 'Nova senha' : 'Senha'}</span>
                    <input
                      type="password"
                      autoComplete={modo === 'nova_senha' ? 'new-password' : modo === 'cadastro' ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                      value={senha}
                      onChange={event => setSenha(event.target.value)}
                      placeholder="••••••••"
                    />
                  </label>

                  {modo === 'nova_senha' && (
                    <label>
                      <span>Confirmar nova senha</span>
                      <input type="password" autoComplete="new-password" required minLength={6} value={confirmacao} onChange={event => setConfirmacao(event.target.value)} placeholder="••••••••" />
                    </label>
                  )}

                  {modo === 'entrar' && (
                    <button type="button" onClick={() => void recuperar()} className="login-onirico__link">
                      Esqueci minha senha
                    </button>
                  )}
                </>
              ) : (
                <label>
                  <span>Código da mesa local</span>
                  <input value={codigo} onChange={event => setCodigo(event.target.value)} placeholder="ONIRICO-01" />
                </label>
              )}

              {erro && <p className="login-onirico__error" role="alert">{erro}</p>}
              {mensagem && <p className="login-onirico__message" role="status">{mensagem}</p>}

              <button className="ro-button login-onirico__submit" disabled={enviando}>
                {enviando
                  ? 'Aguarde…'
                  : modo === 'entrar'
                    ? 'Entrar na Vigília'
                    : modo === 'cadastro'
                      ? 'Criar conta'
                      : modo === 'local'
                        ? 'Acessar modo local'
                        : 'Salvar nova senha'}
                {!enviando && <span aria-hidden="true">→</span>}
              </button>
            </form>

            {modo === 'entrar' && (
              <>
                <div className="login-onirico__separator"><span>ou</span></div>

                <div className="login-onirico__entry-options">
                  <button type="button" onClick={() => trocarModo('cadastro')} className="login-onirico__entry-card">
                    <span className="login-onirico__entry-icon">＋</span>
                    <span><strong>Criar uma conta</strong><small>Organize campanhas, personagens e mesas compartilhadas.</small></span>
                    <b aria-hidden="true">→</b>
                  </button>

                  <button type="button" onClick={() => trocarModo('local')} className="login-onirico__entry-card">
                    <span className="login-onirico__entry-icon">◇</span>
                    <span><strong>Acessar modo local</strong><small>Explore a plataforma sem sincronização online.</small></span>
                    <b aria-hidden="true">→</b>
                  </button>
                </div>
              </>
            )}

            {!remoto && modo !== 'local' && modo !== 'nova_senha' && (
              <div className="login-onirico__offline-note login-onirico__offline-note--remote">
                <strong>Acesso online aguardando configuração</strong>
                <span>Entrar e Criar conta já estão na interface, mas precisam das variáveis do Supabase no Vercel para autenticar de verdade.</span>
              </div>
            )}

            {modo === 'local' && (
              <div className="login-onirico__offline-note">
                <strong>Modo local</strong>
                <span>Os dados ficam neste dispositivo e não são sincronizados com outras pessoas.</span>
              </div>
            )}

            {modo === 'nova_senha' && (
              <button type="button" onClick={() => trocarModo('entrar')} className="login-onirico__local">Voltar para o login</button>
            )}

            <div className="login-onirico__roles-note">
              <span>ⓘ</span>
              <p>Papéis como Mestre, Jogador e Observador são definidos em cada campanha.</p>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};
