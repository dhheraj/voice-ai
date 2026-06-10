import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { API_BASE } from './apiBase';
import './App.css';

// In production, prepend the deployed backend URL to any /api fetch calls
if (import.meta.env.PROD && API_BASE) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return originalFetch(API_BASE + input, init);
    }
    if (input instanceof Request && input.url.startsWith('/api/')) {
      return originalFetch(new Request(API_BASE + input.url, input), init);
    }
    return originalFetch(input, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

