import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import { EMOTION_EMOJI } from '../utils';

export default function Sidebar({ open, onClose, history, user, loading, onSelectHistory, onDeleteHistory, onClearHistory, onLoginClick, onLogout, fetchAudio }) {
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [downloadId, setDownloadId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const audioRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    const onTime = () => {
      if (a.duration) {
        setProgress(a.currentTime / a.duration);
        setDuration(a.duration);
      }
    };
    const onEnded = () => { setPlayingId(null); setProgress(0); };
    const onPause = () => setPlayingId((p) => (p ? null : p));
    const onPlay = () => setError('');
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onTime);
    a.addEventListener('ended', onEnded);
    a.addEventListener('pause', onPause);
    a.addEventListener('play', onPlay);
    return () => {
      a.pause();
      a.src = '';
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onTime);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('play', onPlay);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const stopCurrent = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.pause(); a.currentTime = 0; }
    setPlayingId(null);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!open) stopCurrent();
  }, [open, stopCurrent]);

  const handlePlay = async (e, item) => {
    e.stopPropagation();
    if (loadingId) return;
    const a = audioRef.current;
    if (playingId === item.id) {
      a.pause();
      setPlayingId(null);
      return;
    }
    setLoadingId(item.id);
    setError('');
    try {
      const url = await fetchAudio(item);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      a.src = url;
      await a.play();
      setPlayingId(item.id);
    } catch (err) {
      setError(err.message || 'Playback failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (e, item) => {
    e.stopPropagation();
    if (downloadId) return;
    setDownloadId(item.id);
    setError('');
    try {
      const url = await fetchAudio(item);
      const safeText = (item.text || 'audio').replace(/[^a-z0-9]+/gi, '-').slice(0, 24).toLowerCase();
      const a = document.createElement('a');
      a.href = url;
      a.download = `voicegen-${safeText}-${item.id}.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError(err.message || 'Download failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDownloadId(null);
    }
  };

  const handleSelect = (item) => {
    stopCurrent();
    onSelectHistory(item);
  };

  const formatDuration = (s) => {
    if (!s || !isFinite(s)) return '';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Icon name="volume" size={20} />
            </div>
            <h2>VoiceGen</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        {user && (
          <div className="sidebar-user">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="sidebar-user-avatar" />
            ) : (
              <div className="sidebar-user-avatar sidebar-user-avatar-letter">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.displayName || 'Signed in'}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
            {onLogout && (
              <button
                className="sidebar-user-logout"
                onClick={onLogout}
                aria-label="Sign out"
                title="Sign out"
              >
                <Icon name="logout" size={18} />
              </button>
            )}
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h3>{user ? 'Your history' : 'Local history'}</h3>
            {history.length > 0 && !loading && (
              <button className="text-btn" onClick={onClearHistory}>Clear all</button>
            )}
          </div>
          {error && <div className="sidebar-error">{error}</div>}
          {history.length === 0 ? (
            <div className="sidebar-empty">
              {loading ? (
                <>
                  <span className="spinner spinner-lg" />
                  <p>Loading history</p>
                </>
              ) : (
                <>
                  <Icon name="history" size={32} />
                  <p>No generations yet</p>
                  <span>{user ? 'Your history will appear here' : 'Sign in to save history across devices'}</span>
                </>
              )}
            </div>
          ) : (
            <ul className="history-list">
              {history.map(item => {
                const isPlaying = playingId === item.id;
                const isLoading = loadingId === item.id;
                const isDownloading = downloadId === item.id;
                return (
                  <li key={item.id} className={`history-item ${isPlaying ? 'is-playing' : ''}`}>
                    <button className="history-item-btn" onClick={() => handleSelect(item)}>
                      <div className="history-item-icon">
                        <Icon name="volume" size={16} />
                      </div>
                      <div className="history-item-content">
                        <div className="history-item-text">{item.text}</div>
                        <div className="history-item-meta">
                          <span>{item.localeLabel}</span>
                          <span className="dot">&middot;</span>
                          <span>{item.speaker}</span>
                          {item.emotion && (
                            <>
                              <span className="dot">&middot;</span>
                              <span>{EMOTION_EMOJI[item.emotion] || ''} {item.emotion}</span>
                            </>
                          )}
                        </div>
                        <div className="history-item-time">{item.timeAgo}</div>
                        {isPlaying && (
                          <div className="history-item-progress">
                            <div className="history-item-progress-fill" style={{ width: `${progress * 100}%` }} />
                          </div>
                        )}
                        {isPlaying && duration > 0 && (
                          <div className="history-item-duration">
                            {formatDuration(audioRef.current?.currentTime)} / {formatDuration(duration)}
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="history-item-actions">
                      <button
                        className={`history-item-action history-item-play ${isPlaying ? 'is-playing' : ''}`}
                        onClick={(e) => handlePlay(e, item)}
                        disabled={isLoading || isDownloading}
                        aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                        title={isPlaying ? 'Pause' : 'Preview'}
                      >
                        {isLoading ? <span className="spinner" /> : <Icon name={isPlaying ? 'pause' : 'play'} size={16} />}
                      </button>
                      <button
                        className="history-item-action history-item-download"
                        onClick={(e) => handleDownload(e, item)}
                        disabled={isLoading || isDownloading}
                        aria-label="Download"
                        title="Download WAV"
                      >
                        {isDownloading ? <span className="spinner" /> : <Icon name="download" size={16} />}
                      </button>
                      <button
                        className="history-item-action history-item-delete"
                        onClick={(e) => { e.stopPropagation(); onDeleteHistory(item); }}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!user && (
          <div className="sidebar-footer">
            <button className="signin-promo" onClick={onLoginClick}>
              <Icon name="google" size={18} />
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
