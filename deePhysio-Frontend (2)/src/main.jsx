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

// One-time cleanup: Clear legacy persistent tokens from localStorage
// to ensure the new sessionStorage-based manual login takes immediate effect.
const keysToClear = ['token', 'deephysio_user', 'deephysio_role'];
keysToClear.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
  }
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
