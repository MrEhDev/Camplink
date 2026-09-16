// Aquí inicializo el punto de entrada de la aplicación React de Camplink,
// envolviendo la SPA en los proveedores de autenticación, diseño visual, soporte de idioma y protección de fallos.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { registrarServiceWorker } from './utils/webPush';
import './index.scss';

// Capturar el evento nativo de instalación PWA desde el primer instante
window.addEventListener('beforeinstallprompt', (e) => {
  window.__camplink_pwa_prompt = e;
  window.dispatchEvent(new CustomEvent('camplink:pwa_prompt_available', { detail: e }));
});

// Registrar Service Worker para PWA y Web Push
registrarServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
