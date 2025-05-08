/**
 * Utility functions for making proxied requests through the background script
 * to bypass CORS restrictions
 */

/**
 * Makes a fetch request through the extension's background script proxy
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} The response data
 */
export async function proxyFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'PROXY_REQUEST',
        url,
        options
      },
      response => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }

        if (!response || !response.success) {
          return reject(new Error(response?.error || 'Failed to fetch through proxy'));
        }

        resolve(response.data);
      }
    );
  });
}

/**
 * Fetches an image URL through the proxy and returns a usable URL
 * @param {string} imageUrl - The image URL to fetch
 * @returns {Promise<string>} A URL that can be used directly in img src
 */
export async function proxyImage(imageUrl) {
  try {
    const response = await proxyFetch(imageUrl);

    // If the response contains a blob URL, return it
    if (response && response.blob && response.url) {
      return response.url;
    }

    // Otherwise, return the original URL (it might work directly)
    return imageUrl;
  } catch (error) {
    console.error('Error proxying image:', error);
    return imageUrl; // Fall back to the original URL
  }
}
