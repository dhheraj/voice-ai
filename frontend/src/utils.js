const STORAGE_KEYS = {
  THEME: 'voiceai_theme',
  USER: 'voiceai_user',
};

export const getTheme = () => localStorage.getItem(STORAGE_KEYS.THEME) || 'light';

export const setTheme = (theme) => localStorage.setItem(STORAGE_KEYS.THEME, theme);

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.USER);
};

export const EMOTION_EMOJI = {
  Angry: '\u{1F620}', Calm: '\u{1F60C}', Disgust: '\u{1F922}',
  Disgusted: '\u{1F922}', Fearful: '\u{1F628}', Happy: '\u{1F60A}',
  Neutral: '\u{1F610}', PleasantSurprised: '\u{1F632}', Sad: '\u{1F622}',
};
