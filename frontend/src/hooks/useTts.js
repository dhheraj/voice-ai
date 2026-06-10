import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/api';

export function useTts(user, addHistoryItem) {
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

  // Load voices on mount
  useEffect(() => {
    ApiService.getVoices()
      .then((data) => {
        setLocales(data.locales || {});
        const firstLocale = Object.keys(data.locales || {})[0] || 'EN-US';
        setLocale(firstLocale);
        const firstSpeaker = Object.keys(data.locales?.[firstLocale]?.speakers || {})[0] || '';
        setSpeaker(firstSpeaker);
      })
      .catch(() => {});
  }, []);

  const handleLocaleChange = useCallback((newLocale) => {
    setLocale(newLocale);
    const firstSpeaker = Object.keys(locales[newLocale]?.speakers || {})[0] || '';
    setSpeaker(firstSpeaker);
    setEmotion('');
  }, [locales]);

  const handleSpeakerChange = useCallback((newSpeaker) => {
    setSpeaker(newSpeaker);
    setEmotion('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || loading) return;
    
    setLoading(true);
    setError('');
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);

    const voiceName = emotion
      ? `Magpie-Multilingual.${locale}.${speaker}.${emotion}`
      : `Magpie-Multilingual.${locale}.${speaker}`;

    const [lang, region] = locale.split('-');
    const normalizedLocale = region ? `${lang.toLowerCase()}-${region}` : lang.toLowerCase();

    const start = Date.now();
    try {
      const res = await ApiService.generateTts(text.trim(), voiceName, normalizedLocale);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      const duration = Date.now() - start;
      const wasCached = res.headers.get('X-Cache') === 'HIT';
      
      setLastCached(wasCached);
      setLastDuration(duration);
      setLastAudioSize(blob.size);

      if (user?.uid && addHistoryItem) {
        addHistoryItem({
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
  }, [text, loading, locale, speaker, emotion, audioUrl, locales, user, addHistoryItem]);

  const resetAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setError('');
  }, [audioUrl]);

  return {
    text,
    setText,
    locales,
    locale,
    setLocale: handleLocaleChange,
    speaker,
    setSpeaker: handleSpeakerChange,
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
  };
}
