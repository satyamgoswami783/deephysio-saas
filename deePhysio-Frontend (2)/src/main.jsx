import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'

// Global error safety for external browser extension scripts
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('startTime') || 
      event.filename?.includes('anonymous') || 
      event.filename?.includes('extension')
    ) {
      // Prevent browser extension crashes from breaking the React UI
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      return true;
    }
  });
}

// Register PWA service worker and mobile listeners
import('./pwa/PwaManager');


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
