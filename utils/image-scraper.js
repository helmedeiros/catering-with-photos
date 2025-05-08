/**
 * Fetches images from Google Images search with SafeSearch enabled
 * @param {string} query - The search query
 * @param {number} count - Maximum number of images to return (default: 5)
 * @returns {Promise<string[]>} Array of image URLs
 */
import { getCached, setCached, cleanupCache } from './cache.js';

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

    // In production, use Google Images search
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`;

    const response = await fetch(searchUrl, {
      mode: 'no-cors', // Handle CORS issues
      credentials: 'omit'
    });

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all image elements in the search results
    const images = Array.from(doc.querySelectorAll('img'))
      .map(img => img.src)
      .filter(src => src && src.startsWith('http')) // Ensure valid URLs
      .slice(0, count); // Limit to requested count

    // Cache the results if we found any
    if (images.length > 0) {
      setCached(query, images);
    }

    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}
