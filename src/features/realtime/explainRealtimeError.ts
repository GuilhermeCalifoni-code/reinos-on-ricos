/**
 * Supabase PostgREST failures are JSON objects, not necessarily Error instances.
 * Converting them with String(error) produces the unhelpful "[object Object]".
 */
export function explainRealtimeError(cause: unknown): string {
  if (typeof cause === 'string') return cause.trim() || 'Erro sem detalhes.';
  if (cause instanceof Error) return cause.message || 'Erro sem detalhes.';

  if (cause && typeof cause === 'object') {
    const item = cause as Record<string, unknown>;
    const code = typeof item.code === 'string' ? item.code : '';
    const message = typeof item.message === 'string' ? item.message : '';
    const details = typeof item.details === 'string' ? item.details : '';
    const hint = typeof item.hint === 'string' ? item.hint : '';

    if (code === 'PGRST202' || (message.includes('schema cache') && message.includes('function'))) {
      return 'A API ainda não reconhece a função de movimentação (PGRST202). Atualize a página. Se persistir, informe ao administrador.';
    }
    if (code === '42883' && (message.includes('pg_catalog.least') || message.includes('pg_catalog.greatest'))) {
      return 'Erro de cálculo de posição no servidor (42883). A operação não foi salva.';
    }
    const readable = [message, details, hint].filter(Boolean).join(' — ');
    if (readable) return code ? `[${code}] ${readable}` : readable;
    try {
      const serialized = JSON.stringify(cause);
      if (serialized && serialized !== '{}') return serialized.slice(0, 500);
    } catch {
      // A non-serializable response is still a failure.
    }
  }
  return 'Erro não identificado na comunicação com a Mesa.';
}
