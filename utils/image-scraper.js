/**
 * Fetches food images using Google and backup APIs
 * @param {string} query - The search query
 * @param {number} count - Maximum number of images to return (default: 5)
 * @returns {Promise<string[]>} Array of image URLs
 */
import { getCached, setCached, cleanupCache } from './cache.js';
import { proxyFetch, proxyImage } from './proxy.js';

// Maximum number of entries to store in cache
const MAX_CACHE_ENTRIES = 100;

// API endpoints for image search
const GOOGLE_SEARCH_API = 'https://www.googleapis.com/customsearch/v1';

// Fallback image URLs if all else fails
const FALLBACK_FOOD_IMAGES = [
  'https://source.unsplash.com/random/300x300?food',
  'https://source.unsplash.com/featured/?food',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe'
];

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

    console.log('Fetching images for:', query);

    // Try to fetch from Google Images first
    let images = await fetchFromGoogleImages(query, count);

    // If Google fails, try generic food images
    if (images.length === 0) {
      console.log('Google image search failed, using fallback images');
      images = generateFallbackImages(count);
    }

    // If we got images, cache them
    if (images.length > 0) {
      setCached(query, images, MAX_CACHE_ENTRIES);
      return images;
    }

    // Return empty array if all APIs fail
    console.warn('All image fetching methods failed, returning empty array');
    return [];
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

/**
 * Fetches images from Google Custom Search API using our proxy
 * @param {string} query - The search query
 * @param {number} count - Number of images to fetch
 * @returns {Promise<string[]>} Array of image URLs
 */
async function fetchFromGoogleImages(query, count) {
  console.log('Trying to fetch from Google Images...');

  try {
    // Construct a Google image search URL
    const searchUrl = 'https://www.google.com/search?q=' +
                     encodeURIComponent(query + ' food') +
                     '&tbm=isch&safe=active';

    // Use our proxy to fetch HTML content
    const htmlContent = await fetchHtmlWithProxy(searchUrl);

    if (!htmlContent) {
      throw new Error('Failed to fetch HTML content from Google');
    }

    // Extract image URLs from the HTML content
    const imageUrls = extractImageUrlsFromHtml(htmlContent);

    // Return up to the requested count of images
    return imageUrls.slice(0, count);
  } catch (error) {
    console.warn('Error fetching from Google Images:', error);
    return [];
  }
}

/**
 * Extracts image URLs from Google Images HTML
 * @param {string} html - The HTML content from Google Images
 * @returns {Array<string>} Array of image URLs
 */
function extractImageUrlsFromHtml(html) {
  // This is a simplified extraction - in production you'd use more robust parsing
  const imageUrls = [];

  try {
    // Look for image URLs in the HTML
    const imgRegex = /"ou":"(https:\/\/[^"]+)"/g;
    let match;

    while ((match = imgRegex.exec(html)) !== null && imageUrls.length < 10) {
      if (match[1] && !match[1].includes('gstatic.com') &&
          !match[1].includes('google.com') &&
          (match[1].endsWith('.jpg') ||
           match[1].endsWith('.jpeg') ||
           match[1].endsWith('.png'))) {
        imageUrls.push(match[1]);
      }
    }

    // If the above regex didn't find anything, try another pattern
    if (imageUrls.length === 0) {
      const altRegex = /\["(https:\/\/[^"]+\.(?:jpg|jpeg|png)[^"]*)",\d+,\d+\]/g;

      while ((match = altRegex.exec(html)) !== null && imageUrls.length < 10) {
        if (match[1] && !match[1].includes('gstatic.com') && !match[1].includes('google.com')) {
          imageUrls.push(match[1]);
        }
      }
    }

    console.log(`Found ${imageUrls.length} images in Google search results`);
  } catch (error) {
    console.warn('Error extracting image URLs:', error);
  }

  return imageUrls;
}

/**
 * Fetches HTML content through our proxy
 * @param {string} url - The URL to fetch HTML from
 * @returns {Promise<string|null>} The HTML content or null if failed
 */
async function fetchHtmlWithProxy(url) {
  try {
    // First try direct fetch (might work inside extension)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (response.ok) {
      return await response.text();
    }

    throw new Error('Direct fetch failed, trying proxy');
  } catch (error) {
    console.log('Direct HTML fetch failed, trying proxy:', error.message);

    try {
      // Use our proxy to fetch the content
      const result = await proxyFetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (result && result.text) {
        return result.text;
      }

      return null;
    } catch (proxyError) {
      console.warn('Proxy HTML fetch also failed:', proxyError);
      return null;
    }
  }
}

/**
 * Generates fallback food images when APIs fail
 * @param {number} count - Number of images needed
 * @returns {Array<string>} Array of image URLs
 */
function generateFallbackImages(count) {
  // Repeat the fallback images if we need more than are available
  const images = [];
  for (let i = 0; i < count; i++) {
    images.push(FALLBACK_FOOD_IMAGES[i % FALLBACK_FOOD_IMAGES.length]);
  }
  return images;
}
