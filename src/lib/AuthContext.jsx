import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    // In PWA/standalone mode give the browser a moment to read localStorage
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      await new Promise(res => setTimeout(res, 300));
    }

    const tryFetch = async (retriesLeft, delay) => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
      } catch (error) {
        if (retriesLeft > 0) {
          await new Promise(res => setTimeout(res, delay));
          return tryFetch(retriesLeft - 1, delay * 2);
        }
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        if (error.status === 403 && error.data?.extra_data?.reason === 'user_not_registered') {
          setAuthError({ type: 'user_not_registered', message: 'User not registered' });
        } else {
          // Any other error (network, unknown) — redirect to login
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
      }
    };

    // Hard timeout — if everything hangs for 8s, force redirect to login
    const timeout = setTimeout(() => {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    }, 8000);

    await tryFetch(2, 400);
    clearTimeout(timeout);
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};