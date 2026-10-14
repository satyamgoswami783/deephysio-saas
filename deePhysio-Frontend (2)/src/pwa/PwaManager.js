class PwaManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.updateRequested = false;
    this.deferredInstallPrompt = null;
    this.updateListeners = new Set();
    this.installListeners = new Set();
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Track whether an existing controller was already in place when page loaded
        const hadPreviousController = Boolean(navigator.serviceWorker.controller);

        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            this.registration = reg;
            console.log('[PWA] Service Worker registered:', reg.scope);

            // Check for updates periodically (e.g. every 60 minutes)
            setInterval(() => {
              reg.update().catch((e) => console.debug('[PWA] SW auto-update check error:', e));
            }, 60 * 60 * 1000);

            // Listen for updatefound event
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New version ready to activate!');
                    this.updateAvailable = true;
                    this.notifyUpdateListeners();
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });

        // Detect when new service worker takes control -> reload safely
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // CRITICAL FIX: Only reload if a previous controller was already running (an update occurred)
          // or if the user explicitly clicked "Update Now".
          // This prevents unexpected page reloads during first install.
          if (!refreshing && (hadPreviousController || this.updateRequested)) {
            refreshing = true;
            console.log('[PWA] New controller active. Reloading safely...');
            window.location.reload();
          } else {
            console.log('[PWA] Initial Service Worker activated without reloading.');
          }
        });
      });
    }

    // Capture beforeinstallprompt event for install banner
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.notifyInstallListeners(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      this.notifyInstallListeners(false);
      console.log('[PWA] ClinicPilot installed successfully as standalone application');
    });
  }

  // Trigger safe update by notifying waiting SW to skipWaiting
  applyUpdate() {
    this.updateRequested = true;
    if (!this.registration || !this.registration.waiting) {
      // If waiting worker not found, simple reload
      window.location.reload();
      return;
    }
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Trigger PWA installation
  async promptInstall() {
    if (!this.deferredInstallPrompt) return false;
    this.deferredInstallPrompt.prompt();
    const { outcome } = await this.deferredInstallPrompt.userChoice;
    this.deferredInstallPrompt = null;
    this.notifyInstallListeners(false);
    return outcome === 'accepted';
  }

  onUpdateAvailable(callback) {
    this.updateListeners.add(callback);
    if (this.updateAvailable) callback(true);
    return () => this.updateListeners.delete(callback);
  }

  notifyUpdateListeners() {
    for (const cb of this.updateListeners) {
      cb(true);
    }
  }

  onInstallAvailable(callback) {
    this.installListeners.add(callback);
    if (this.deferredInstallPrompt) callback(true);
    return () => this.installListeners.delete(callback);
  }

  notifyInstallListeners(canInstall) {
    for (const cb of this.installListeners) {
      cb(canInstall);
    }
  }
}

export const pwaManager = new PwaManager();
export default pwaManager;
