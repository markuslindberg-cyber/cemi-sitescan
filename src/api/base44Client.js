import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

// Re-read token at client creation time to ensure we catch tokens
// set from URL params (e.g. after Google OAuth redirect on mobile/Safari)
const getToken = () => {
  const storageKey = 'base44_access_token';
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('access_token');
  if (urlToken) {
    localStorage.setItem(storageKey, urlToken);
    return urlToken;
  }
  return localStorage.getItem(storageKey) || appParams.token;
};

export const base44 = createClient({
  appId,
  token: getToken(),
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});