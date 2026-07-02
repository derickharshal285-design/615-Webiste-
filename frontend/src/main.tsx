import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to always send HttpOnly Cookies to the backend API
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (!config) config = {};
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    config.credentials = 'include';
  }
  return originalFetch(resource, config);
};

// Automatically check for Service Worker updates and force the new version to activate
// so that users never have to manually clear cache or hard refresh to see new deployments.
const updateSW = registerSW({
  onNeedRefresh() {
    // The service worker found an update. Force it to update immediately.
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
