import React, { useRef } from 'react';
import { EMOTION_EMOJI } from '../utils';
import { Icon } from './Icon';

export default function VoiceForm({
  text, onTextChange,
  locales,
  locale, onLocaleChange,
  speaker, onSpeakerChange,
  emotion, onEmotionChange,
  loading,
  onGenerate,
}) {
  const currentSpeakers = locales[locale]?.speakers || {};
  const currentEmotions = currentSpeakers[speaker] || [];
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="voice-form">
      <div className="voice-config">
        <div className="field">
          <label htmlFor="locale-select">Language</label>
          <div className="select-wrap">
            <select id="locale-select" value={locale} onChange={e => { onLocaleChange(e.target.value); }}>
              {Object.entries(locales).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <Icon name="chevron-down" size={18} className="select-chevron" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="speaker-select">Voice</label>
          <div className="select-wrap">
            <select id="speaker-select" value={speaker} onChange={e => onSpeakerChange(e.target.value)}>
              {Object.keys(currentSpeakers).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Icon name="chevron-down" size={18} className="select-chevron" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="emotion-select">Emotion</label>
          <div className="select-wrap">
            <select id="emotion-select" value={emotion} onChange={e => onEmotionChange(e.target.value)}>
              <option value="">None</option>
              {currentEmotions.map(e => (
                <option key={e} value={e}>{EMOTION_EMOJI[e] || ''} {e}</option>
              ))}
            </select>
            <Icon name="chevron-down" size={18} className="select-chevron" />
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="text-input">Text</label>
        <div className="textarea-wrap">
          <textarea
            id="text-input"
            ref={textareaRef}
            value={text}
            onChange={e => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text to synthesize..."
            rows={6}
            maxLength={10000}
          />
          <div className="textarea-footer">
            <span className="char-count">{text.length} / 10,000</span>
            <span className="shortcut">&#8984; + &#8629; to generate</span>
          </div>
        </div>
      </div>

      <button
        className="filled-btn generate-btn"
        onClick={onGenerate}
        disabled={loading || !text.trim()}
      >
        {loading ? (
          <span className="loading-bars">
            <span className="bar" /><span className="bar" /><span className="bar" /><span className="bar" /><span className="bar" />
          </span>
        ) : (
          <>
            <Icon name="sparkle" size={18} />
            <span>Generate speech</span>
          </>
        )}
      </button>
    </div>
  );
}
