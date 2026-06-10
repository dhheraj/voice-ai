import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import VoiceForm from './components/VoiceForm';
import AudioOutput from './components/AudioOutput';
import HistoryDetail from './components/HistoryDetail';
import ConfirmModal from './components/ConfirmModal';
import { Icon } from './components/Icon';
import AdBanner from './components/AdBanner';
import AdRail from './components/AdRail';
import SocialBar from './components/SocialBar';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, firebaseReady } from './firebase';
import { getTheme, setTheme, getStoredUser, setStoredUser } from './utils';

const formatTimeAgo = (timestamp) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const historyAdapter = (item) => ({
  id: item._id || item.id,
  text: item.textPreview || item.text,
  fullText: item.text || item.textPreview,
  locale: item.locale,
  localeLabel: item.localeLabel,
  speaker: item.speaker,
  emotion: item.emotion,
  timestamp: new Date(item.createdAt).getTime(),
  timeAgo: 'Just now',
});

export default function App() {
  const [theme, setThemeState] = useState(getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [text, setText] = useState('');
  const [locales, setLocales] = useState({});
  const [locale, setLocale] = useState('EN-US');
  const [speaker, setSpeaker] = useState('Aria');
  const [emotion, setEmotion] = useState('');

  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [lastCached, setLastCached] = useState(false);
  const [lastDuration, setLastDuration] = useState(0);
  const [lastAudioSize, setLastAudioSize] = useState(0);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const inputRef = useRef(null);

  const askConfirm = (config) =>
    new Promise((resolve) => {
      setConfirm({ ...config, resolve });
    });

  const closeConfirm = (result) => {
    setConfirm((c) => {
      if (c?.resolve) c.resolve(result);
      return null;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setTheme(theme);
    if (user?.uid) {
      fetch(`/api/auth/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, theme }),
      }).catch(() => {});
    }
  }, [theme, user]);

  useEffect(() => {
    fetch('/api/tts/voices')
      .then(r => r.json())
      .then(data => {
        setLocales(data.locales || {});
        const firstLocale = Object.keys(data.locales || {})[0] || 'EN-US';
        setLocale(firstLocale);
        setSpeaker(Object.keys(data.locales?.[firstLocale]?.speakers || {})[0] || '');
      })
      .catch(() => {});
  }, []);

  const loadServerHistory = useCallback(async (uid) => {
    if (!uid) { setHistory([]); return; }
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?firebaseUid=${encodeURIComponent(uid)}`);
      if (!res.ok) throw new Error('Failed to load history');
      const items = await res.json();
      setHistory(items.map(historyAdapter));
    } catch (e) {
      console.warn('History load failed:', e.message);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const syncUserToServer = useCallback(async (fbUser) => {
    if (!fbUser) return null;
    try {
      const idToken = await fbUser.getIdToken();
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          rawUserData: {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          },
        }),
      });
      if (!res.ok) throw new Error('Server sync failed');
      return await res.json();
    } catch (e) {
      console.warn('User sync failed:', e.message);
      return null;
    }
  }, []);

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
        setThemeState(serverData.user.theme);
      }
    }
    await loadServerHistory(fbUser.uid);
    setLoginOpen(false);
  }, [syncUserToServer, loadServerHistory]);

  useEffect(() => {
    if (user?.uid) {
      loadServerHistory(user.uid);
    } else {
      setHistory([]);
    }
  }, [user, loadServerHistory]);

  const addToHistoryServer = useCallback(async (entry) => {
    if (!user?.uid) return;
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, ...entry }),
      });
      if (!res.ok) return;
      const saved = await res.json();
      setHistory(prev => [historyAdapter(saved), ...prev].slice(0, 100));
    } catch (e) {
      console.warn('Save history failed:', e.message);
    }
  }, [user]);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    const voiceName = emotion
      ? `Magpie-Multilingual.${locale}.${speaker}.${emotion}`
      : `Magpie-Multilingual.${locale}.${speaker}`;

    const [lang, region] = locale.split('-');
    const normalizedLocale = region ? `${lang.toLowerCase()}-${region}` : lang.toLowerCase();

    const start = Date.now();
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: voiceName,
          language_code: normalizedLocale,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || `HTTP ${res.status}`;
        if (msg.includes('Triton') || msg.includes('Mapping failed') || msg.includes('chunks')) {
          throw new Error('The voice model could not process this text. Try a different voice, shorter text, or remove special characters.');
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const duration = Date.now() - start;
      const wasCached = res.headers.get('X-Cache') === 'HIT';
      setLastCached(wasCached);
      setLastDuration(duration);
      setLastAudioSize(blob.size);

      if (user?.uid) {
        addToHistoryServer({
          text: text.trim(),
          voice: voiceName,
          locale,
          localeLabel: locales[locale]?.label || locale,
          speaker,
          emotion,
          audioSize: blob.size,
          durationMs: duration,
          cached: wasCached,
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [text, loading, locale, speaker, emotion, audioUrl, locales, user, addToHistoryServer]);

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
          return;
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

  const handleSignOut = async () => {
    const ok = await askConfirm({
      title: 'Sign out?',
      message: 'You can sign back in anytime. Your saved history will stay linked to your account.',
      confirmText: 'Sign out',
      danger: false,
    });
    if (!ok) return;
    if (firebaseReady) {
      try { await signOut(auth); } catch {}
    }
    setUser(null);
    setStoredUser(null);
    setHistory([]);
    setSelectedItem(null);
  };

  const handleSelectHistory = (item) => {
    setSelectedItem(item);
    setSidebarOpen(false);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  const handleUseSettings = (item) => {
    setText(item.fullText || item.text);
    setLocale(item.locale);
    setSpeaker(item.speaker);
    setEmotion(item.emotion || '');
    setSelectedItem(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNewChat = () => {
    setText('');
    setEmotion('');
    setSelectedItem(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const fetchHistoryAudio = async (item) => {
    const voiceName = item.emotion
      ? `Magpie-Multilingual.${item.locale}.${item.speaker}.${item.emotion}`
      : `Magpie-Multilingual.${item.locale}.${item.speaker}`;
    const [lang, region] = (item.locale || 'EN-US').split('-');
    const normalizedLocale = region ? `${lang.toLowerCase()}-${region}` : lang.toLowerCase();
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: item.fullText || item.text,
        voice: voiceName,
        language_code: normalizedLocale,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  const handleDeleteHistory = async (item) => {
    if (!user?.uid || !item) return;
    const ok = await askConfirm({
      title: 'Delete this conversation?',
      message: item.text
        ? `"${item.text.slice(0, 80)}${item.text.length > 80 ? '…' : ''}" will be removed from your history.`
        : 'This conversation will be removed from your history.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setHistory(prev => prev.filter(h => h.id !== item.id));
    try {
      await fetch(`/api/history/${item.id}?firebaseUid=${encodeURIComponent(user.uid)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete failed:', e.message);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    const ok = await askConfirm({
      title: 'Clear all history?',
      message: 'All your saved generations will be permanently removed from your account.',
      confirmText: 'Clear all',
      danger: true,
    });
    if (!ok) return;
    setHistory([]);
    try {
      await fetch(`/api/history?firebaseUid=${encodeURIComponent(user.uid)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Clear failed:', e.message);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voiceai-${Date.now()}.wav`;
    a.click();
  };

  const toggleTheme = () => setThemeState(theme === 'light' ? 'dark' : 'light');

  const enrichedHistory = history.map(h => ({ ...h, timeAgo: formatTimeAgo(h.timestamp) }));

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setSidebarOpen(true)}
        user={user}
        onLoginClick={() => setLoginOpen(true)}
        onLogoutClick={handleSignOut}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        history={enrichedHistory}
        user={user}
        loading={historyLoading}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearHistory={handleClearHistory}
        onLoginClick={() => { setSidebarOpen(false); setLoginOpen(true); }}
        onLogout={handleSignOut}
        fetchAudio={fetchHistoryAudio}
      />

      <AdBanner slot="header" className="ad-header" />

      <main className="main-content">
        {selectedItem ? (
          <HistoryDetail
            item={selectedItem}
            onClose={handleCloseDetail}
            onUseSettings={handleUseSettings}
            onDelete={() => { handleDeleteHistory(selectedItem); handleCloseDetail(); }}
            fetchAudio={fetchHistoryAudio}
          />
        ) : (
          <>
            <div className="hero">
              <h1>Text to speech</h1>
              <p>Convert text into natural-sounding speech using AI voices across {Object.keys(locales).length || 9}+ languages.</p>
              {(text || audioUrl || selectedItem) && (
                <button className="new-chat-btn" onClick={handleNewChat} aria-label="Start a new chat">
                  <Icon name="sparkle" size={16} />
                  <span>New chat</span>
                </button>
              )}
            </div>

            {!user && (
              <div className="signin-card">
                <div className="signin-card-text">
                  <h3>Sign in to save your history</h3>
                  <p>Your generations will sync across devices and stay available after you sign out.</p>
                </div>
                <button className="btn-primary" onClick={() => setLoginOpen(true)}>
                  <Icon name="google" size={18} />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            <div className="card">
              <VoiceForm
                text={text}
                onTextChange={setText}
                locales={locales}
                locale={locale}
                onLocaleChange={(l) => { setLocale(l); setSpeaker(Object.keys(locales[l]?.speakers || {})[0] || ''); setEmotion(''); }}
                speaker={speaker}
                onSpeakerChange={(s) => { setSpeaker(s); setEmotion(''); }}
                emotion={emotion}
                onEmotionChange={setEmotion}
                loading={loading}
                onGenerate={handleGenerate}
              />
              <div ref={inputRef} />
              {error && <div className="error-banner">{error}</div>}
              {audioUrl && (
                <div className="meta-row">
                  <span className="meta-pill">
                    {lastCached ? '⚡ Served from cache' : `Generated in ${(lastDuration/1000).toFixed(1)}s`}
                  </span>
                  <span className="meta-pill">{(lastAudioSize/1024).toFixed(0)} KB</span>
                  {!user && <span className="meta-pill meta-pill-warn">Sign in to save history</span>}
                </div>
              )}
            </div>

            {audioUrl && <AudioOutput audioUrl={audioUrl} onDownload={handleDownload} />}

            <AdBanner slot="inline" className="ad-inline" />

            {!audioUrl && !loading && (
              <div className="features">
                <div className="feature">
                  <div className="feature-icon"><span>9+</span></div>
                  <h3>Languages</h3>
                  <p>English, Spanish, French, German, Mandarin, Italian, Vietnamese, Hindi, Japanese</p>
                </div>
                <div className="feature">
                  <div className="feature-icon"><span>15+</span></div>
              <h3>Voices</h3>
              <p>Multiple unique speakers per language for varied tone and style</p>
            </div>
            <div className="feature">
              <div className="feature-icon"><span>9</span></div>
                <h3>Emotions</h3>
                <p>From happy and calm to sad and angry, control the delivery</p>
              </div>
            </div>
          )}
          </>
        )}
        </main>

      <LoginModal
        open={loginOpen}
        onClose={() => { setLoginOpen(false); setAuthError(''); }}
        onSignIn={handleSignIn}
        loading={authLoading}
        error={authError}
        firebaseReady={firebaseReady}
      />

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirm?.confirmText}
        cancelText={confirm?.cancelText}
        danger={confirm?.danger}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />

      <AdBanner slot="footer" className="ad-footer" />

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Voice AI · Text to Speech</p>
      </footer>

    </div>
  );
}
