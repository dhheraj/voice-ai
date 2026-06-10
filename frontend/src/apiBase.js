// API base URL — points to deployed backend on Vercel
// In dev: empty string (Vite proxy handles /api)
// In prod: full Vercel backend URL
export const API_BASE = import.meta.env.PROD
  ? 'https://backend-ten-ashy-35.vercel.app'
  : '';

// Build a full URL for an API call
export const apiUrl = (path) => `${API_BASE}${path}`;
