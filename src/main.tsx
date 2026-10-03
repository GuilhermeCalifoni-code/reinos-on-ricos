import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './design-system/theme';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { ConnectionStatus } from './components/system/ConnectionStatus';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <ConnectionStatus />
        <App />
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
