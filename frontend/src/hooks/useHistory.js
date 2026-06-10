import { useState, useCallback } from 'react';
import { ApiService } from '../services/api';

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

export function useHistory(user) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadServerHistory = useCallback(async (uid) => {
    if (!uid) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const items = await ApiService.getHistory(uid);
      setHistory(items.map(historyAdapter));
    } catch (e) {
      console.warn('History load failed:', e.message);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const addHistoryItem = useCallback(async (entry) => {
    if (!user?.uid) return;
    try {
      const saved = await ApiService.createHistoryEntry(user.uid, entry);
      setHistory((prev) => [historyAdapter(saved), ...prev].slice(0, 100));
    } catch (e) {
      console.warn('Save history failed:', e.message);
    }
  }, [user]);

  const deleteHistoryItem = useCallback(async (itemId) => {
    if (!user?.uid || !itemId) return;
    // optimistic update
    setHistory((prev) => prev.filter((h) => h.id !== itemId));
    try {
      await ApiService.deleteHistoryItem(itemId, user.uid);
    } catch (e) {
      console.warn('Delete failed:', e.message);
      // reload to sync with server if failed
      loadServerHistory(user.uid);
    }
  }, [user, loadServerHistory]);

  const clearAllHistory = useCallback(async () => {
    if (!user?.uid) return;
    setHistory([]);
    try {
      await ApiService.clearHistory(user.uid);
    } catch (e) {
      console.warn('Clear failed:', e.message);
      loadServerHistory(user.uid);
    }
  }, [user, loadServerHistory]);

  return {
    history,
    setHistory,
    historyLoading,
    selectedItem,
    setSelectedItem,
    loadServerHistory,
    addHistoryItem,
    deleteHistoryItem,
    clearAllHistory,
  };
}
