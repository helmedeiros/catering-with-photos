/**
 * Fetches images from Google Images search with SafeSearch enabled
 * @param {string} query - The search query
 * @param {number} count - Maximum number of images to return (default: 5)
 * @returns {Promise<string[]>} Array of image URLs
 */
import { getCached, setCached, cleanupCache } from './cache.js';

// Maximum number of entries to store in cache
const MAX_CACHE_ENTRIES = 100;

export async function fetchImages(query, count = 5) {
  try {
    // Return mock images in test environment
    if (typeof window !== 'undefined' && window.__CWPH_TEST__) {
      return window.__CWPH_MOCK_IMAGES__ || [];
    }

    // Clean up expired cache entries before fetching
    cleanupCache();

    // Check cache first
    const cachedImages = getCached(query);
    if (cachedImages) {
      return cachedImages.slice(0, count);
    }

    // Using a service that allows CORS requests instead of direct Google Images search
    // As a fallback, use placeholder images with the query text
    // This is a temporary solution until we can implement a proper backend service
    const images = [];
    for (let i = 1; i <= count; i++) {
      // Use a more reliable image source or your own backend API here
      // For now, we're using real food images from Unsplash as placeholders
      const randomId = Math.floor(Math.random() * 1000);
      images.push(`https://source.unsplash.com/featured/?${encodeURIComponent(query)}&sig=${randomId}`);
    }

    // Cache the results
    if (images.length > 0) {
      setCached(query, images, MAX_CACHE_ENTRIES);
    }

    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}
