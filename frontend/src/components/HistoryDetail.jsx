import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { EMOTION_EMOJI } from '../utils';

export default function HistoryDetail({ item, onClose, onUseSettings, onDelete, fetchAudio }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let createdUrl = null;
    setLoading(true);
    setError('');
    fetchAudio(item)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        createdUrl = url;
        setAudioUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load audio');
        setLoading(false);
      });
    return () => {
      cancelled = true;
      if (createdUrl) setTimeout(() => URL.revokeObjectURL(createdUrl), 1000);
    };
  }, [item.id]);

  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) { a.pause(); a.src = ''; }
    };
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) { a.pause(); }
    else { a.play().catch((e) => setError(e.message)); }
  };

  const handleDownload = async () => {
    if (downloading || !audioUrl) return;
    setDownloading(true);
    try {
      const safeText = (item.text || 'audio').replace(/[^a-z0-9]+/gi, '-').slice(0, 24).toLowerCase();
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `voicegen-${safeText}-${item.id}.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    onDelete();
    onClose();
  };

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const emotionEmoji = item.emotion ? (EMOTION_EMOJI[item.emotion] || '') : '';

  return (
    <div className="history-detail">
      <div className="history-detail-header">
        <button className="history-detail-back" onClick={onClose} aria-label="Back">
          <Icon name="chevron-right" size={20} style={{ transform: 'rotate(180deg)' }} />
          <span>Back</span>
        </button>
        <button className="history-detail-delete-btn" onClick={handleDelete} aria-label="Delete" title="Delete">
          <Icon name="trash" size={18} />
        </button>
      </div>

      <div className="chat">
        <div className="chat-message chat-user">
          <div className="chat-avatar chat-avatar-user">
            <Icon name="user" size={16} />
          </div>
          <div className="chat-bubble chat-bubble-user">
            <div className="chat-bubble-text">{item.fullText || item.text}</div>
            <div className="chat-bubble-time">{item.timeAgo}</div>
          </div>
        </div>

        <div className="chat-message chat-assistant">
          <div className="chat-avatar chat-avatar-assistant">
            <Icon name="volume" size={16} />
          </div>
          <div className="chat-bubble chat-bubble-assistant">
            <div className="chat-bubble-meta">
              {item.localeLabel} · {item.speaker}
              {item.emotion && (
                <span className="chat-bubble-emotion"> · {emotionEmoji} {item.emotion}</span>
              )}
            </div>
            {error ? (
              <div className="chat-bubble-error">{error}</div>
            ) : loading ? (
              <div className="chat-bubble-loading">
                <span className="spinner" />
                <span>Generating audio…</span>
              </div>
            ) : (
              <>
                <div className="chat-audio-player">
                  <button
                    className={`chat-play-btn ${isPlaying ? 'is-playing' : ''}`}
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    <Icon name={isPlaying ? 'pause' : 'play'} size={20} />
                  </button>
                  <div className="chat-audio-info">
                    <div className="chat-audio-progress" onClick={(e) => {
                      const a = audioRef.current;
                      if (!a || !a.duration) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      a.currentTime = Math.max(0, Math.min(1, ratio)) * a.duration;
                    }}>
                      <div className="chat-audio-progress-fill" style={{ width: `${progress * 100}%` }} />
                    </div>
                    <div className="chat-audio-time">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  <button
                    className="chat-download-btn"
                    onClick={handleDownload}
                    disabled={downloading}
                    aria-label="Download"
                    title="Download WAV"
                  >
                    {downloading ? <span className="spinner" /> : <Icon name="download" size={18} />}
                  </button>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => {
                      const a = e.currentTarget;
                      setCurrentTime(a.currentTime);
                      if (a.duration) setProgress(a.currentTime / a.duration);
                    }}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onError={() => setError('Failed to load audio')}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="history-detail-actions">
        <button className="btn-primary" onClick={() => onUseSettings(item)}>
          <Icon name="sparkle" size={18} />
          <span>Use these settings</span>
        </button>
      </div>
    </div>
  );
}
