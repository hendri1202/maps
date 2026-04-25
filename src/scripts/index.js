import 'leaflet/dist/leaflet.css';
import '../styles/app.css';

import App from './pages/app.js';
import { registerServiceWorker } from './utils/sw-register.js';
import { initOnlineListener, syncOfflineDrafts } from './data/offline-sync.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.getElementById('main-content'),
    drawerButton: document.getElementById('drawer-button'),
    drawerNavigation: document.getElementById('navigation-drawer'),
    skipLinkButton: document.getElementById('skip-link'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  await registerServiceWorker();
  initOnlineListener();
  syncOfflineDrafts();
});
