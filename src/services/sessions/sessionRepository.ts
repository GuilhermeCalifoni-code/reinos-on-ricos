/** Contrato reservado para migrar sessões sem misturar regras da UI com persistência. */
export interface SessionRepository<T> { listar(campaignId: string): Promise<T[]>; salvar(session: T): Promise<T>; }
