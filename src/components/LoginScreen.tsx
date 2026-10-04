import React, { useEffect, useState } from 'react';
import { Personagem } from '../types/character';
import { UserSession } from '../types/auth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/auth/authService';

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
  const [mostrarSenha, setMostrarSenha] = useState(false);

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
    <div className="login-onirico login-onirico--reference">
      <main className="login-onirico__stage">
        <img className="login-onirico__frame-art" src="/ro-login-frame.webp" alt="" aria-hidden="true" />

        <section className="login-onirico__story">
          <img className="login-onirico__mist-city" src="/ro-login-mist-city.webp" alt="" aria-hidden="true" />
          <div className="login-onirico__story-copy">
            <img className="login-onirico__brand-lockup" src="/ro-login-logo.webp" alt="Reinos Oníricos RPG" />
            <p className="login-onirico__eyebrow">Fantasia urbana · Vigília · Sonhar</p>

            <h1 className="login-onirico__headline">
              <span>Entre na</span>
              <span>Vigília.</span>
              <span>Atravesse o</span>
              <span>Sonhar.</span>
            </h1>

            <p className="login-onirico__lead">
              Reinos Oníricos é um RPG de fantasia urbana sobre o que existe entre o real e o impossível.
              A plataforma acompanha sua mesa com campanhas, personagens e jogo ao vivo.
            </p>

            <blockquote>
              “Entre o concreto e o impossível, existem aqueles que ainda investigam.”
            </blockquote>
          </div>
        </section>

        <section className="login-onirico__portrait-zone" aria-hidden="true">
          <img className="login-onirico__portrait" src="/ro-login-portrait.webp" alt="" />
        </section>

        <section className="login-onirico__access-column">
          <div className="login-onirico__panel">
            {modo !== 'nova_senha' && (
              <div className="login-onirico__switch" role="tablist" aria-label="Forma de acesso">
                <button type="button" onClick={() => trocarModo('entrar')} className={modo === 'entrar' ? 'is-active' : ''}>Entrar</button>
                <button type="button" onClick={() => trocarModo('cadastro')} className={modo === 'cadastro' ? 'is-active' : ''}>Criar conta</button>
                <button type="button" onClick={() => trocarModo('local')} className={modo === 'local' ? 'is-active' : ''}>Modo local</button>
              </div>
            )}

            <h2>{titulo}</h2>
            <p className="login-onirico__panel-copy">
              {modo === 'entrar' && 'Acesse sua conta para continuar na Vigília.'}
              {modo === 'cadastro' && 'Crie sua conta para organizar campanhas, fichas e sessões compartilhadas.'}
              {modo === 'local' && 'Use o modo local para jogo no mesmo dispositivo, sem sincronização online.'}
              {modo === 'nova_senha' && 'Escolha uma nova senha para recuperar seu acesso.'}
            </p>

            <form onSubmit={usarRemoto ? autenticar : entrarLocal} className="login-onirico__form">
              {(modo === 'cadastro' || modo === 'local') && (
                <label>
                  <span>Nome</span>
                  <div className="login-onirico__field-control">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c.8-4.2 3.1-6 7-6s6.2 1.8 7 6"/></svg>
                    <input autoComplete="name" value={nome} onChange={event => setNome(event.target.value)} placeholder="Como devemos chamar você?" />
                  </div>
                </label>
              )}

              {usarRemoto && modo !== 'nova_senha' && (
                <label>
                  <span>E-mail</span>
                  <div className="login-onirico__field-control">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6.5h18v11H3zM4 7l8 6 8-6" /></svg>
                    <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
                  </div>
                </label>
              )}

              {usarRemoto ? (
                <>
                  <label>
                    <span>{modo === 'nova_senha' ? 'Nova senha' : 'Senha'}</span>
                    <div className="login-onirico__field-control">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5z" /></svg>
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        autoComplete={modo === 'nova_senha' ? 'new-password' : modo === 'cadastro' ? 'new-password' : 'current-password'}
                        required
                        minLength={6}
                        value={senha}
                        onChange={event => setSenha(event.target.value)}
                        placeholder="••••••••"
                      />
                      <button type="button" className="login-onirico__password-toggle" onClick={() => setMostrarSenha(valor => !valor)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>
                      </button>
                    </div>
                  </label>

                  {modo === 'nova_senha' && (
                    <label>
                      <span>Confirmar nova senha</span>
                      <div className="login-onirico__field-control">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5z" /></svg>
                        <input type="password" autoComplete="new-password" required minLength={6} value={confirmacao} onChange={event => setConfirmacao(event.target.value)} placeholder="••••••••" />
                      </div>
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
                  <div className="login-onirico__field-control">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5h14v14H5zM9 9h6v6H9z" /></svg>
                    <input value={codigo} onChange={event => setCodigo(event.target.value)} placeholder="ONIRICO-01" />
                  </div>
                </label>
              )}

              {erro && <p className="login-onirico__error" role="alert">{erro}</p>}
              {mensagem && <p className="login-onirico__message" role="status">{mensagem}</p>}

              <button className="login-onirico__submit" disabled={enviando}>
                <span className="login-onirico__submit-star" aria-hidden="true">✦</span>
                <strong>
                  {enviando
                    ? 'Aguarde…'
                    : modo === 'entrar'
                      ? 'Entrar na Vigília'
                      : modo === 'cadastro'
                        ? 'Criar conta'
                        : modo === 'local'
                          ? 'Acessar modo local'
                          : 'Salvar nova senha'}
                </strong>
                {!enviando && <span aria-hidden="true">→</span>}
              </button>
            </form>

            {modo === 'entrar' && (
              <>
                <div className="login-onirico__separator"><span>ou</span></div>

                <div className="login-onirico__entry-options">
                  <button type="button" onClick={() => trocarModo('cadastro')} className="login-onirico__entry-card">
                    <span className="login-onirico__entry-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c.7-4 3.2-6 7-6s6.3 2 7 6"/><path d="M3 18.5c.4-3 1.7-4.8 4-5.7M21 18.5c-.4-3-1.7-4.8-4-5.7"/></svg>
                    </span>
                    <span><strong>Ainda não tem uma conta?</strong><small>Crie sua conta para organizar campanhas, gerenciar personagens e jogar com sua mesa.</small></span>
                    <span className="login-onirico__entry-cta">Criar conta&nbsp; →</span>
                  </button>

                  <button type="button" onClick={() => trocarModo('local')} className="login-onirico__entry-card">
                    <span className="login-onirico__entry-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="12" rx="1.2"/><path d="M8 20h8M12 16v4"/></svg>
                    </span>
                    <span><strong>Modo local</strong><small>Use o modo local para jogo no mesmo dispositivo, sem sincronização online.</small></span>
                    <span className="login-onirico__entry-cta">Acessar modo local&nbsp; →</span>
                  </button>
                </div>
              </>
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
          </div>
        </section>
      </main>
    </div>
  );
};
