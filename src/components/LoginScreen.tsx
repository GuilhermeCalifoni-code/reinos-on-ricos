import React, { useEffect, useState } from 'react';
import { Personagem } from '../types/character';
import { UserSession } from '../types/auth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/auth/authService';
import { ThemeToggle } from '../design-system/ThemeToggle';

interface LoginScreenProps {
  personagens: Personagem[];
  onLogin: (session: UserSession) => void;
  onAbrirModalSql: () => void;
  onCriarNovoPersonagem: (nome?: string) => Personagem;
}

type AuthMode = 'entrar' | 'cadastro' | 'local' | 'nova_senha';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  personagens, onLogin, onAbrirModalSql, onCriarNovoPersonagem
}) => {
  const remoto = isSupabaseConfigured();
  const [modo, setModo] = useState<AuthMode>('entrar');
  const usarRemoto = remoto && modo !== 'local';
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('ONIRICO-01');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

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
    ? 'Criar conta'
    : modo === 'nova_senha'
      ? 'Nova senha'
      : usarRemoto
        ? 'Entrar'
        : 'Acesso local';

  return (
    <div className="login-onirico">
      <header className="login-onirico__header">
        <div>
          <span className="login-onirico__brand">REINOS ONÍRICOS</span>
          <small>Companheiro de mesa</small>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button type="button" onClick={onAbrirModalSql} className="ro-button--quiet">Configurar Supabase</button>
        </div>
      </header>

      <main className="login-onirico__main">
        <section className="login-onirico__intro">
          <p className="ro-eyebrow">Vigília · Sonhar · Ruptura</p>
          <h1>Carregamos mundos dentro de nós.</h1>
          <p>Organize campanhas, conduza sessões e atravesse a fronteira entre Realidade e Sonhar sem tirar a mesa do centro da experiência.</p>
        </section>

        <section className="login-onirico__panel">
          <p className="ro-eyebrow">{modo === 'nova_senha' ? 'Recuperação' : 'Arquivo de campanha'}</p>
          <h2>{titulo}</h2>
          <p>{usarRemoto ? 'Sua identidade acompanha suas campanhas; o papel é definido em cada mesa.' : 'Modo local de demonstração, sem sincronização entre dispositivos.'}</p>

          {remoto && modo !== 'nova_senha' && (
            <div className="login-onirico__switch">
              <button type="button" onClick={() => setModo('entrar')} className={modo === 'entrar' ? 'is-active' : ''}>Entrar</button>
              <button type="button" onClick={() => setModo('cadastro')} className={modo === 'cadastro' ? 'is-active' : ''}>Criar conta</button>
            </div>
          )}

          <form onSubmit={usarRemoto ? autenticar : entrarLocal} className="login-onirico__form">
            {(modo === 'cadastro' || !usarRemoto) && (
              <label>
                <span>Nome</span>
                <input value={nome} onChange={event => setNome(event.target.value)} placeholder="Como devemos chamar você?" />
              </label>
            )}

            {usarRemoto && modo !== 'nova_senha' && (
              <label>
                <span>E-mail</span>
                <input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
              </label>
            )}

            {usarRemoto ? (
              <>
                <label>
                  <span>{modo === 'nova_senha' ? 'Nova senha' : 'Senha'}</span>
                  <input type="password" required minLength={6} value={senha} onChange={event => setSenha(event.target.value)} placeholder="••••••••" />
                </label>
                {modo === 'nova_senha' && (
                  <label>
                    <span>Confirmar nova senha</span>
                    <input type="password" required minLength={6} value={confirmacao} onChange={event => setConfirmacao(event.target.value)} placeholder="••••••••" />
                  </label>
                )}
                {modo === 'entrar' && <button type="button" onClick={() => void recuperar()} className="login-onirico__link">Esqueci minha senha</button>}
              </>
            ) : (
              <label>
                <span>Código local</span>
                <input value={codigo} onChange={event => setCodigo(event.target.value)} placeholder="ONIRICO-01" />
              </label>
            )}

            {erro && <p className="login-onirico__error">{erro}</p>}
            {mensagem && <p className="login-onirico__message">{mensagem}</p>}
            <button className="ro-button w-full" disabled={enviando}>{enviando ? 'Aguarde…' : titulo}</button>
          </form>

          {remoto && modo !== 'nova_senha' && (
            <button type="button" onClick={() => setModo(modo === 'local' ? 'entrar' : 'local')} className="login-onirico__local">
              {modo === 'local' ? 'Voltar para acesso online' : 'Usar modo local de demonstração'}
            </button>
          )}
        </section>
      </main>
    </div>
  );
};
