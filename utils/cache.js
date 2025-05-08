/**
 * Cache utility for storing and retrieving image search results
 */

const CACHE_KEY = 'cwph-cache';

/**
 * Retrieves cached images for a given query
 * @param {string} query - The search query
 * @returns {string[]|null} Array of image URLs if found in cache, null otherwise
 */
export function getCached(query) {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cache = JSON.parse(cacheStr);
    return cache[query] || null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Stores images in cache for a given query
 * @param {string} query - The search query
 * @param {string[]} images - Array of image URLs to cache
 */
export function setCached(query, images) {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache = cacheStr ? JSON.parse(cacheStr) : {};
    cache[query] = images;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}
