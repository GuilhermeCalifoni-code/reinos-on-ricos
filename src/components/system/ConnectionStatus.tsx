import React, { useEffect, useState } from 'react';

const readOnlineState = () => typeof navigator === 'undefined' ? true : navigator.onLine;

export const ConnectionStatus: React.FC = () => {
  const [online, setOnline] = useState(readOnlineState);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="system-connection-banner" role="status" aria-live="polite">
      <strong>Sem conexão com a internet.</strong>
      <span>A interface continua aberta, mas recursos do Supabase e sincronização em tempo real podem aguardar a reconexão.</span>
    </div>
  );
};
