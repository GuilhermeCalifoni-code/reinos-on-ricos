import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { UserProfile } from '../../types/auth';

const requireClient = () => {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.');
  return supabase;
};

export const authService = {
  async cadastrar(email: string, senha: string, nome: string) {
    const client = requireClient();
    const { data, error } = await client.auth.signUp({ email, password: senha, options: { data: { nome } } });
    if (error) throw error;
    return data;
  },
  async entrar(email: string, senha: string) {
    const { data, error } = await requireClient().auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    return data.session;
  },
  async entrarComOAuth(provider: 'google' | 'discord') {
    const client = requireClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: false
      }
    });
    if (error) throw error;
    return data;
  },
  async sair() {
    const { error } = await requireClient().auth.signOut();
    if (error) throw error;
  },
  async recuperarSenha(email: string) {
    const { error } = await requireClient().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
  },
  async atualizarSenha(novaSenha: string) {
    const { error } = await requireClient().auth.updateUser({ password: novaSenha });
    if (error) throw error;
  },
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data } = requireClient().auth.onAuthStateChange((event, session) => callback(event, session));
    return data.subscription;
  },
  async sessaoAtual(): Promise<Session | null> {
    const { data, error } = await requireClient().auth.getSession();
    if (error) throw error;
    return data.session;
  },
  async perfil(user: User): Promise<UserProfile> {
    const client = requireClient();
    const { data, error } = await client.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return { userId: user.id, nome: data?.nome || user.user_metadata.nome || user.email?.split('@')[0] || 'Desvelado', avatarUrl: data?.avatar_url, criadoEm: data?.criado_em, atualizadoEm: data?.atualizado_em };
  },
  async atualizarPerfil(profile: Pick<UserProfile, 'nome' | 'avatarUrl'>) {
    const { data: { user } } = await requireClient().auth.getUser();
    if (!user) throw new Error('Sessão autenticada não encontrada.');
    const { error } = await requireClient().from('profiles').upsert({ user_id: user.id, nome: profile.nome, avatar_url: profile.avatarUrl || null }, { onConflict: 'user_id' });
    if (error) throw error;
  }
};
