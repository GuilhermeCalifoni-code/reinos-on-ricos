export type UserRole = 'mestre' | 'jogador';

export interface UserSession {
  id: string;
  role: UserRole;
  nome: string;
  email?: string;
  mesaCodigo: string;
  personagemVinculadoId?: string;
  modoConexao: 'supabase' | 'local';
}
