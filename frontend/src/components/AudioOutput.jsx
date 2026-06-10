import React, { useRef, useState, useEffect } from 'react';
import { Icon } from './Icon';

export default function AudioOutput({ audioUrl, onDownload }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError('');
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => setError(e.message));
    }
  };

  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-output">
      <div className="audio-card">
        <button
          className="play-fab"
          onClick={togglePlay}
          disabled={!audioUrl}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={28} />
        </button>
        <div className="audio-info">
          <div className="audio-meta">
            <span className="audio-label">Generated audio</span>
            <span className="audio-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="audio-progress">
            <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={e => setDuration(e.target.duration)}
            onError={() => setError('Failed to load audio')}
          />
          {error && <div className="audio-error">{error}</div>}
        </div>
        <button
          className="icon-btn"
          onClick={onDownload}
          disabled={!audioUrl}
          aria-label="Download"
          title="Download WAV"
        >
          <Icon name="download" />
        </button>
      </div>
    </div>
  );
}
