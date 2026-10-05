import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
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
        <SpeedInsights />
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
