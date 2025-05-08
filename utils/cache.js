/**
 * Cache utility for storing and retrieving image search results with TTL support
 */

const CACHE_KEY = 'cwph-cache';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {string[]} images - Array of image URLs
 * @property {number} timestamp - Unix timestamp when the entry was cached
 */

/**
 * Retrieves cached images for a given query if they haven't expired
 * @param {string} query - The search query
 * @param {number} [ttl=DEFAULT_TTL] - Time to live in milliseconds
 * @returns {string[]|null} Array of image URLs if found and not expired, null otherwise
 */
export function getCached(query, ttl = DEFAULT_TTL) {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cache = JSON.parse(cacheStr);
    const entry = cache[query];

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      // Entry has expired, remove it
      delete cache[query];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return entry.images;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Stores images in cache for a given query with timestamp
 * @param {string} query - The search query
 * @param {string[]} images - Array of image URLs to cache
 */
export function setCached(query, images) {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache = cacheStr ? JSON.parse(cacheStr) : {};

    cache[query] = {
      images,
      timestamp: Date.now()
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Cleans up expired entries from the cache
 * @param {number} [ttl=DEFAULT_TTL] - Time to live in milliseconds
 */
export function cleanupCache(ttl = DEFAULT_TTL) {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return;

    const cache = JSON.parse(cacheStr);
    const now = Date.now();
    let hasChanges = false;

    Object.keys(cache).forEach(query => {
      if (now - cache[query].timestamp > ttl) {
        delete cache[query];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}
