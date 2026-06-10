const crypto = require('crypto');

const CACHE_MAX = 100;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const cache = new Map();

function generateCacheKey(text, voice, locale) {
  return crypto.createHash('sha1').update(`${locale}|${voice}|${text}`).digest('hex');
}

function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // LRU update: delete and re-set
  cache.delete(key);
  cache.set(key, entry);
  return entry.audio;
}

function set(key, audio) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { ts: Date.now(), audio });
}

function getStats() {
  return {
    size: cache.size,
    max: CACHE_MAX
  };
}

module.exports = {
  generateCacheKey,
  get,
  set,
  getStats
};
