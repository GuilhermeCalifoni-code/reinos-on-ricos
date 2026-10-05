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
type OAuthProvider = 'google' | 'discord';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.6A10 10 0 0 0 12 22Z"/>
    <path fill="#FBBC05" d="M6.4 13.93A6.03 6.03 0 0 1 6.08 12c0-.67.12-1.32.32-1.93v-2.6H3.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.05 4.53l3.35-2.6Z"/>
    <path fill="#EA4335" d="M12 5.95c1.47 0 2.8.5 3.84 1.5l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.95 5.47l3.35 2.6c.79-2.36 3-4.12 5.6-4.12Z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M19.4 5.3A16.4 16.4 0 0 0 15.3 4l-.5 1a15 15 0 0 0-5.6 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C2 9.2 1.3 13 1.7 16.7a16.5 16.5 0 0 0 5 2.5l1.2-1.7c-.7-.3-1.4-.7-2-1.2l.5-.4c3.8 1.8 7.9 1.8 11.6 0l.5.4c-.7.5-1.3.9-2 1.2l1.2 1.7a16.4 16.4 0 0 0 5-2.5c.5-4.3-.8-8-3.3-11.4ZM8.6 14.5c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z"/>
  </svg>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({
  personagens, onLogin, onCriarNovoPersonagem
}) => {
  const remoto = isSupabaseConfigured();
  const [modo, setModo] = useState<AuthMode>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('ONIRICO-01');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [oauthEmAndamento, setOauthEmAndamento] = useState<OAuthProvider | null>(null);
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
      avatarUrl: perfil.avatarUrl,
      mesaCodigo: '',
      modoConexao: 'supabase'
    });
  };

  const entrarComOAuth = async (provider: OAuthProvider) => {
    setErro('');
    setMensagem('');

    if (!remoto) {
      setErro('O acesso online ainda não está configurado neste deploy. Você pode usar o Modo local agora.');
      return;
    }

    setOauthEmAndamento(provider);
    try {
      await authService.entrarComOAuth(provider);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível iniciar o acesso social.');
      setOauthEmAndamento(null);
    }
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
        else setMensagem('Conta criada. Confirme seu e-mail para concluir o cadastro.');
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
    ? 'Crie seu acesso.'
    : modo === 'nova_senha'
      ? 'Definir nova senha'
      : modo === 'local'
        ? 'Modo local'
        : 'Bem-vindo de volta.';

  const renderSocialButtons = (contexto: 'login' | 'cadastro') => (
    <div className={`login-onirico__social-grid login-onirico__social-grid--${contexto}`}>
      <button
        type="button"
        className="login-onirico__social-button login-onirico__social-button--google"
        onClick={() => void entrarComOAuth('google')}
        disabled={oauthEmAndamento !== null}
      >
        <span className="login-onirico__social-icon"><GoogleIcon /></span>
        <span className="login-onirico__social-copy">
          <strong>{oauthEmAndamento === 'google' ? 'Abrindo Google…' : 'Continuar com Google'}</strong>
          {contexto === 'cadastro' && <small>Use sua conta Google para criar seu perfil na Vigília.</small>}
        </span>
        <span className="login-onirico__social-arrow" aria-hidden="true">→</span>
      </button>

      <button
        type="button"
        className="login-onirico__social-button login-onirico__social-button--discord"
        onClick={() => void entrarComOAuth('discord')}
        disabled={oauthEmAndamento !== null}
      >
        <span className="login-onirico__social-icon"><DiscordIcon /></span>
        <span className="login-onirico__social-copy">
          <strong>{oauthEmAndamento === 'discord' ? 'Abrindo Discord…' : 'Continuar com Discord'}</strong>
          {contexto === 'cadastro' && <small>Entre com o Discord que você já usa com sua mesa.</small>}
        </span>
        <span className="login-onirico__social-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );

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
          <div className={`login-onirico__panel login-onirico__panel--${modo}`}>
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
              {modo === 'cadastro' && 'Escolha como quer entrar. Sua conta será criada pelo Google ou Discord, sem uma nova senha.'}
              {modo === 'local' && 'Use o modo local para jogo no mesmo dispositivo, sem sincronização online.'}
              {modo === 'nova_senha' && 'Escolha uma nova senha para recuperar seu acesso.'}
            </p>

            {modo === 'cadastro' && (
              <div className="login-onirico__oauth-create">
                {renderSocialButtons('cadastro')}

                <div className="login-onirico__separator login-onirico__separator--compact">
                  <span>ou crie com e-mail</span>
                </div>

                <form onSubmit={autenticar} className="login-onirico__form login-onirico__form--signup">
                  <label>
                    <span>Nome</span>
                    <div className="login-onirico__field-control">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c.8-4.2 3.1-6 7-6s6.2 1.8 7 6"/></svg>
                      <input
                        autoComplete="name"
                        required
                        value={nome}
                        onChange={event => setNome(event.target.value)}
                        placeholder="Como devemos chamar você?"
                      />
                    </div>
                  </label>

                  <label>
                    <span>E-mail</span>
                    <div className="login-onirico__field-control">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6.5h18v11H3zM4 7l8 6 8-6" /></svg>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        placeholder="voce@exemplo.com"
                      />
                    </div>
                  </label>

                  <label>
                    <span>Senha</span>
                    <div className="login-onirico__field-control">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5z" /></svg>
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={senha}
                        onChange={event => setSenha(event.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                      />
                      <button type="button" className="login-onirico__password-toggle" onClick={() => setMostrarSenha(valor => !valor)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>
                      </button>
                    </div>
                  </label>

                  {erro && <p className="login-onirico__error" role="alert">{erro}</p>}
                  {mensagem && <p className="login-onirico__message" role="status">{mensagem}</p>}

                  <button className="login-onirico__submit login-onirico__submit--signup" disabled={enviando}>
                    <span className="login-onirico__submit-star" aria-hidden="true">✦</span>
                    <strong>{enviando ? 'Criando conta…' : 'Criar conta com e-mail'}</strong>
                    {!enviando && <span aria-hidden="true">→</span>}
                  </button>
                </form>

                <div className="login-onirico__oauth-note">
                  <span aria-hidden="true">✦</span>
                  <p>Você pode criar sua conta pelo Google, Discord ou e-mail. Os papéis de Mestre, Jogador e Observador continuam definidos dentro de cada campanha.</p>
                </div>
              </div>
            )}

            {(modo === 'entrar' || modo === 'nova_senha') && (
              <>
                <form onSubmit={autenticar} className="login-onirico__form">
                  {modo !== 'nova_senha' && (
                    <label>
                      <span>E-mail</span>
                      <div className="login-onirico__field-control">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6.5h18v11H3zM4 7l8 6 8-6" /></svg>
                        <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
                      </div>
                    </label>
                  )}

                  <label>
                    <span>{modo === 'nova_senha' ? 'Nova senha' : 'Senha'}</span>
                    <div className="login-onirico__field-control">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5z" /></svg>
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        autoComplete={modo === 'nova_senha' ? 'new-password' : 'current-password'}
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

                  {erro && <p className="login-onirico__error" role="alert">{erro}</p>}
                  {mensagem && <p className="login-onirico__message" role="status">{mensagem}</p>}

                  <button className="login-onirico__submit" disabled={enviando}>
                    <span className="login-onirico__submit-star" aria-hidden="true">✦</span>
                    <strong>{enviando ? 'Aguarde…' : modo === 'nova_senha' ? 'Salvar nova senha' : 'Entrar na Vigília'}</strong>
                    {!enviando && <span aria-hidden="true">→</span>}
                  </button>
                </form>

                {modo === 'entrar' && (
                  <>
                    <div className="login-onirico__separator"><span>ou continue com</span></div>
                    {renderSocialButtons('login')}


                  </>
                )}

                {modo === 'nova_senha' && (
                  <button type="button" onClick={() => trocarModo('entrar')} className="login-onirico__secondary-link">Voltar para o login</button>
                )}
              </>
            )}

            {modo === 'local' && (
              <>
                <form onSubmit={entrarLocal} className="login-onirico__form">
                  <label>
                    <span>Nome</span>
                    <div className="login-onirico__field-control">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.3"/><path d="M5 20c.8-4.2 3.1-6 7-6s6.2 1.8 7 6"/></svg>
                      <input autoComplete="name" value={nome} onChange={event => setNome(event.target.value)} placeholder="Como devemos chamar você?" />
                    </div>
                  </label>

                  <label>
                    <span>Código da mesa local</span>
                    <div className="login-onirico__field-control">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5h14v14H5zM9 9h6v6H9z" /></svg>
                      <input value={codigo} onChange={event => setCodigo(event.target.value)} placeholder="ONIRICO-01" />
                    </div>
                  </label>

                  <button className="login-onirico__submit">
                    <span className="login-onirico__submit-star" aria-hidden="true">✦</span>
                    <strong>Acessar modo local</strong>
                    <span aria-hidden="true">→</span>
                  </button>
                </form>

                <div className="login-onirico__offline-note">
                  <strong>Modo local</strong>
                  <span>Os dados ficam neste dispositivo e não são sincronizados com outras pessoas.</span>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
