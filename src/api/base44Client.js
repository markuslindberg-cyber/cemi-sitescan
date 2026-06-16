import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

// appParams already handles reading token from URL (with removeFromUrl) and persisting to localStorage.
// We re-read from localStorage here to ensure we get the token even if appParams ran before
// the token was fully persisted (can happen on mobile after Google OAuth redirect).
const getToken = () => {
  return appParams.token || localStorage.getItem('base44_access_token');
};

export const base44 = createClient({
  appId,
  token: getToken(),
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});