const BASE_URL = ''; // Same domain, relative paths

export class ApiService {
  static async getVoices() {
    const res = await fetch(`${BASE_URL}/api/tts/voices`);
    if (!res.ok) throw new Error('Failed to fetch voices');
    return res.json();
  }

  static async updatePreferences(firebaseUid, theme) {
    const res = await fetch(`${BASE_URL}/api/auth/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseUid, theme }),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  }

  static async getHistory(firebaseUid) {
    const res = await fetch(`${BASE_URL}/api/history?firebaseUid=${encodeURIComponent(firebaseUid)}`);
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  }

  static async syncUserToServer(idToken, rawUserData) {
    const res = await fetch(`${BASE_URL}/api/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, rawUserData }),
    });
    if (!res.ok) throw new Error('Server sync failed');
    return res.json();
  }

  static async createHistoryEntry(firebaseUid, entry) {
    const res = await fetch(`${BASE_URL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseUid, ...entry }),
    });
    if (!res.ok) throw new Error('Save history failed');
    return res.json();
  }

  static async generateTts(text, voice, languageCode) {
    const res = await fetch(`${BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, language_code: languageCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res;
  }

  static async deleteHistoryItem(id, firebaseUid) {
    const res = await fetch(`${BASE_URL}/api/history/${id}?firebaseUid=${encodeURIComponent(firebaseUid)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete history item');
    return res.json();
  }

  static async clearHistory(firebaseUid) {
    const res = await fetch(`${BASE_URL}/api/history?firebaseUid=${encodeURIComponent(firebaseUid)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  }
}
