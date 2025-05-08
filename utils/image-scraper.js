/**
 * Fetches food images using the Foodish API (CORS-friendly)
 * @param {string} query - The search query
 * @param {number} count - Maximum number of images to return (default: 5)
 * @returns {Promise<string[]>} Array of image URLs
 */
import { getCached, setCached, cleanupCache } from './cache.js';

// Maximum number of entries to store in cache
const MAX_CACHE_ENTRIES = 100;

// The Foodish API provides random food images with CORS enabled
const FOODISH_API_URL = 'https://foodish-api.herokuapp.com/api';

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

    // Fetch food images from the Foodish API
    const images = [];

    // We have to fetch images one by one as this API returns a random image each time
    const fetchPromises = [];
    for (let i = 0; i < count; i++) {
      fetchPromises.push(
        fetch(FOODISH_API_URL)
          .then(response => response.json())
          .then(data => data.image)
          .catch(error => {
            console.warn('Error fetching from Foodish API:', error);
            return null;
          })
      );
    }

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);

    // Filter out any null results from failed fetches
    const validImages = results.filter(url => url !== null);

    if (validImages.length > 0) {
      // Cache the results
      setCached(query, validImages, MAX_CACHE_ENTRIES);
      return validImages;
    }

    // Fallback to default images if Foodish API fails
    console.warn('Foodish API failed, falling back to default images');
    const fallbackImages = [
      'https://img.freepik.com/free-photo/top-view-table-full-delicious-food-composition_23-2149141352.jpg',
      'https://img.freepik.com/free-photo/flat-lay-batch-cooking-composition_23-2149013906.jpg',
      'https://img.freepik.com/free-photo/chicken-wings-barbecue-sweetly-sour-sauce-picnic-summer-menu-tasty-food-top-view-flat-lay_2829-6471.jpg',
      'https://img.freepik.com/free-photo/top-view-food-frame-with-copy-space_23-2148723447.jpg',
      'https://img.freepik.com/free-photo/concept-indian-cuisine-baked-chicken-wings-legs-honey-mustard-sauce-serving-dishes-restaurant-black-plate-indian-spices-wooden-table-background-image_127425-18.jpg'
    ];

    setCached(query, fallbackImages, MAX_CACHE_ENTRIES);
    return fallbackImages.slice(0, count);
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}
