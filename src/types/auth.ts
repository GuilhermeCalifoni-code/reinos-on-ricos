export type UserRole = 'mestre' | 'jogador' | 'observador';

export type UIDensity = 'comfortable' | 'compact';
export type UITextScale = 'small' | 'normal' | 'large';

export interface UIPreferences {
  theme?: 'light' | 'dark';
  density?: UIDensity;
  textScale?: UITextScale;
  reduceMotion?: boolean;
}

export interface UserProfile {
  userId: string;
  nome: string;
  avatarUrl?: string;
  preferences?: UIPreferences;
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
  uiPreferences?: UIPreferences;
  mesaCodigo: string;
  personagemVinculadoId?: string;
  /** Somente autenticação Supabase; o modo local de jogo foi descontinuado. */
  modoConexao: 'supabase';
}
