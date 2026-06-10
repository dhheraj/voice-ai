import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import VoiceForm from './components/VoiceForm';
import AudioOutput from './components/AudioOutput';
import HistoryDetail from './components/HistoryDetail';
import ConfirmModal from './components/ConfirmModal';
import { Icon } from './components/Icon';

// Commented out ad components as requested
// import AdBanner from './components/AdBanner';
// import AdRail from './components/AdRail';
// import SocialBar from './components/SocialBar';

import { getTheme, setTheme } from './utils';
import { useAuth } from './hooks/useAuth';
import { useHistory } from './hooks/useHistory';
import { useTts } from './hooks/useTts';
import { ApiService } from './services/api';

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

export default function App() {
  const [theme, setThemeState] = useState(getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const inputRef = useRef(null);

  // Sync theme to document and user profile on changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setTheme(theme);
    if (user?.uid) {
      ApiService.updatePreferences(user.uid, theme).catch(() => {});
    }
  }, [theme]);

  // Auth Hook
  const {
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
  } = useAuth(useCallback((syncedTheme) => {
    setThemeState(syncedTheme);
  }, []));

  // History Hook
  const {
    history,
    setHistory,
    historyLoading,
    selectedItem,
    setSelectedItem,
    loadServerHistory,
    addHistoryItem,
    deleteHistoryItem,
    clearAllHistory,
  } = useHistory(user);

  // TTS Hook
  const {
    text,
    setText,
    locales,
    locale,
    setLocale,
    speaker,
    setSpeaker,
    emotion,
    setEmotion,
    loading,
    audioUrl,
    setAudioUrl,
    error,
    setError,
    lastCached,
    lastDuration,
    lastAudioSize,
    handleGenerate,
    resetAudio,
  } = useTts(user, addHistoryItem);

  // Sync history when user changes
  useEffect(() => {
    if (user?.uid) {
      loadServerHistory(user.uid);
    } else {
      setHistory([]);
    }
  }, [user, loadServerHistory, setHistory]);

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
    resetAudio();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const fetchHistoryAudio = async (item) => {
    const voiceName = item.emotion
      ? `Magpie-Multilingual.${item.locale}.${item.speaker}.${item.emotion}`
      : `Magpie-Multilingual.${item.locale}.${item.speaker}`;
    const [lang, region] = (item.locale || 'EN-US').split('-');
    const normalizedLocale = region ? `${lang.toLowerCase()}-${region}` : lang.toLowerCase();
    
    const res = await ApiService.generateTts(item.fullText || item.text, voiceName, normalizedLocale);
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
    deleteHistoryItem(item.id);
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
    clearAllHistory();
  };

  const handleSignOut = async () => {
    const ok = await askConfirm({
      title: 'Sign out?',
      message: 'You can sign back in anytime. Your saved history will stay linked to your account.',
      confirmText: 'Sign out',
      danger: false,
    });
    if (!ok) return;
    handleSignOutLocal();
    setHistory([]);
    setSelectedItem(null);
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

      {/* <AdBanner slot="header" className="ad-header" /> */}

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
                onLocaleChange={setLocale}
                speaker={speaker}
                onSpeakerChange={setSpeaker}
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

            {/* <AdBanner slot="inline" className="ad-inline" /> */}

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

      {/* <AdBanner slot="footer" className="ad-footer" /> */}

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Voice AI · Text to Speech</p>
      </footer>
    </div>
  );
}
