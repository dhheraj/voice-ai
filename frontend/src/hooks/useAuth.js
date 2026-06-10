import { useState, useEffect, useCallback } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  firebaseReady,
} from '../config/firebase';
import { getStoredUser, setStoredUser } from '../utils';
import { ApiService } from '../services/api';

export function useAuth(onThemeSync) {
  const [user, setUser] = useState(getStoredUser());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);

  const syncUserToServer = useCallback(async (fbUser) => {
    if (!fbUser) return null;
    try {
      const idToken = await fbUser.getIdToken();
      return await ApiService.syncUserToServer(idToken, {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
      });
    } catch (e) {
      console.warn('User sync failed:', e.message);
      return null;
    }
  }, []);

  const handleUserSignedIn = useCallback(async (fbUser) => {
    const localUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
    };
    setUser(localUser);
    setStoredUser(localUser);
    
    const serverData = await syncUserToServer(fbUser);
    if (serverData?.user) {
      const synced = { ...localUser, id: serverData.user.id, theme: serverData.user.theme };
      setUser(synced);
      setStoredUser(synced);
      if (serverData.user.theme && (serverData.user.theme === 'light' || serverData.user.theme === 'dark')) {
        if (onThemeSync) onThemeSync(serverData.user.theme);
      }
    }
    setLoginOpen(false);
  }, [syncUserToServer, onThemeSync]);

  useEffect(() => {
    if (!firebaseReady) return;

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) handleUserSignedIn(result.user);
      })
      .catch((err) => {
        if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          setAuthError(err.message);
        }
      });

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) handleUserSignedIn(fbUser);
      else if (!getStoredUser()) setUser(null);
    });
    return unsub;
  }, [handleUserSignedIn]);

  const handleSignIn = async () => {
    if (!firebaseReady) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleUserSignedIn(result.user);
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request' || (e.message && e.message.includes('popup'))) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          setAuthError('Login failed. Please enable popups or try again.');
        }
      } else if (e.code !== 'auth/popup-closed-by-user') {
        setAuthError(e.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOutLocal = () => {
    if (firebaseReady) {
      signOut(auth).catch(() => {});
    }
    setUser(null);
    setStoredUser(null);
    setLoginOpen(false);
  };

  return {
    user,
    setUser,
    authLoading,
    authError,
    setAuthError,
    loginOpen,
    setLoginOpen,
    firebaseReady,
    handleSignIn,
    handleSignOutLocal,
  };
}
