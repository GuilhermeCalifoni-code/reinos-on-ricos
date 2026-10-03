import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

const CHUNK_RELOAD_KEY = 'reinos_oniricos_chunk_reload_v1';

const isChunkLoadError = (error: Error) => {
  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('loading chunk') ||
    message.includes('chunkloaderror')
  );
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Reinos Oníricos] Falha não tratada na interface', error, info);

    if (!isChunkLoadError(error)) return;

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
    } catch {
      // Se o armazenamento estiver indisponível, mantemos a tela de recuperação.
    }
  }

  private reload = () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      // Sem ação necessária.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="system-failure" role="alert">
        <div className="system-failure__card">
          <p className="ro-eyebrow">Falha de interface</p>
          <h1>A Vigília perdeu o fio por um instante.</h1>
          <p>
            Seus dados persistidos não foram apagados. Recarregue a aplicação para reconstruir a interface e
            reconectar os recursos online.
          </p>
          <button type="button" className="ro-button" onClick={this.reload}>
            Recarregar Reinos Oníricos
          </button>
          <details>
            <summary>Detalhes técnicos</summary>
            <code>{this.state.error.message || 'Erro desconhecido'}</code>
          </details>
        </div>
      </main>
    );
  }
}
