import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token: appParams.token || localStorage.getItem('base44_access_token'),
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Ensure the token is set on the client after OAuth redirects on mobile
// where localStorage may not be ready at module init time
const refreshToken = () => {
  const token = appParams.token || localStorage.getItem('base44_access_token');
  if (token && base44.setToken) {
    base44.setToken(token);
  }
};

// Try again shortly after module load to catch late-arriving tokens
setTimeout(refreshToken, 200);
setTimeout(refreshToken, 800);