export type UserRole = 'mestre' | 'jogador' | 'observador';

export interface UserProfile {
  userId: string;
  nome: string;
  avatarUrl?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface UserSession {
  id: string;
  /** UUID de auth.users quando a sessão vem do Supabase. */
  authUserId?: string;
  role: UserRole;
  nome: string;
  email?: string;
  avatarUrl?: string;
  mesaCodigo: string;
  personagemVinculadoId?: string;
  modoConexao: 'supabase' | 'local';
}
