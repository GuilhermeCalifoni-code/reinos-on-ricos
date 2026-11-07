// Monitoramento de erros (Roteiro 10/10, T4) com o Sentry.
// Liga só em produção e nos previews da Vercel. Não envia e-mail nem nome: só o id do usuário
// (o Sentry não manda dados pessoais por padrão, e o beforeSend tira qualquer campo além do id).
import * as Sentry from '@sentry/react';

declare const __AMBIENTE__: string;
declare const __VERSAO__: string;

// O DSN é público por natureza (vai no site de qualquer jeito). Pode ser trocado pela variável VITE_SENTRY_DSN.
const DSN_PADRAO = 'https://312f515d79db7cda32d91476445d37f5@o4512380560867328.ingest.de.sentry.io/4512387796697168';

const ehLocal = (host: string) => host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');

let ativo = false;

export function iniciarMonitoramento(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN || DSN_PADRAO;
  if (!dsn || typeof window === 'undefined' || ehLocal(window.location.hostname)) return;
  Sentry.init({
    dsn,
    environment: typeof __AMBIENTE__ === 'string' ? __AMBIENTE__ : 'desconhecido',
    release: typeof __VERSAO__ === 'string' && __VERSAO__ ? __VERSAO__ : undefined,
    beforeSend(event) {
      if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
      return event;
    }
  });
  ativo = true;

  // Teste de fumaça: abrir o site com ?teste-sentry manda um erro de teste, sem quebrar a tela.
  if (new URLSearchParams(window.location.search).has('teste-sentry')) {
    Sentry.captureException(new Error('Teste do Sentry (Reinos Oníricos): pode ignorar'));
  }
}

/** Liga os erros ao usuário logado (só o id). Passe null ao sair. */
export function identificarUsuario(id: string | null | undefined): void {
  if (!ativo) return;
  Sentry.setUser(id ? { id } : null);
}

/** Erros que derrubam a tela (AppErrorBoundary). */
export function registrarErroDaTela(error: Error, componentStack?: string | null): void {
  if (!ativo) return;
  Sentry.captureException(error, { contexts: { react: { componentStack: componentStack ?? '' } } });
}
