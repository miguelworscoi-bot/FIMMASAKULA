import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import './index.css';

// Prevenção de avisos benignos de WebSocket no ambiente de desenvolvimento
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    const text = String(e?.reason?.message || e?.reason || '');
    if (text.includes('WebSocket') || text.includes('vite')) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

