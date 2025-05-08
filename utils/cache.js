/**
 * Cache utility for storing and retrieving image search results with TTL and size limit support
 */

const CACHE_KEY = 'cwph-cache';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_MAX_ENTRIES = 100; // Maximum number of entries to store

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {string[]} images - Array of image URLs
 * @property {number} timestamp - Unix timestamp when the entry was cached
 * @property {number} lastAccessed - Unix timestamp when the entry was last accessed
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

    // Update last accessed time
    entry.lastAccessed = now;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

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
 * @param {number} [maxEntries=DEFAULT_MAX_ENTRIES] - Maximum number of entries to store
 */
export function setCached(query, images, maxEntries = DEFAULT_MAX_ENTRIES) {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache = cacheStr ? JSON.parse(cacheStr) : {};
    const now = Date.now();

    // Check if we need to evict entries
    if (Object.keys(cache).length >= maxEntries && !cache[query]) {
      // Find the least recently used entry
      const entries = Object.entries(cache)
        .sort(([, a], [, b]) => (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp));
      delete cache[entries[0][0]];
    }

    cache[query] = {
      images,
      timestamp: now,
      lastAccessed: now
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

/**
 * Gets the current number of entries in the cache
 * @returns {number} Number of entries in the cache
 */
export function getCacheSize() {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return 0;

    const cache = JSON.parse(cacheStr);
    return Object.keys(cache).length;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

/**
 * Clears all cached images data
 * @returns {boolean} True if cache was cleared successfully, false otherwise
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}
