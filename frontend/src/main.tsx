import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n/config'
import App from './App.tsx'

// Umami Analytics — RGPD-15: Only load if user has explicitly opted in
function loadUmamiIfConsented() {
  try {
    if (localStorage.getItem('analytics-consent') !== 'true') return;
  } catch { return; }
  if (!import.meta.env.VITE_UMAMI_WEBSITE_ID) return;
  if (document.querySelector('script[data-website-id]')) return; // already loaded
  const script = document.createElement('script');
  script.defer = true;
  script.src = import.meta.env.VITE_UMAMI_URL || 'https://cloud.umami.is/script.js';
  script.setAttribute('data-website-id', import.meta.env.VITE_UMAMI_WEBSITE_ID);
  document.head.appendChild(script);
}
loadUmamiIfConsented();
// Allow dynamic loading when user opts in from the CookieBanner
window.addEventListener('analytics-consent-granted', loadUmamiIfConsented);

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
