/**
 * Background script for Catering with Photos extension
 * Handles proxy requests to bypass CORS restrictions
 */

// Listen for proxy requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PROXY_REQUEST') {
    handleProxyRequest(request.url, request.options)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({
        success: false,
        error: error.message || 'Failed to fetch through proxy'
      }));
    return true; // Return true to indicate async response
  }
});

/**
 * Handles a proxy request to bypass CORS
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} The response data
 */
async function handleProxyRequest(url, options = {}) {
  console.log('CORS Proxy: Fetching', url);
  try {
    // Clone the options to avoid mutations
    const requestOptions = { ...options };

    // Force mode to 'cors' to bypass CORS restrictions
    requestOptions.mode = 'cors';

    // Add default headers if not present
    if (!requestOptions.headers) {
      requestOptions.headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
    }

    // Perform the fetch
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`Proxy request failed with status: ${response.status}`);
    }

    // Get content type to determine how to handle the response
    const contentType = response.headers.get('content-type') || '';

    // Handle response based on content type
    if (contentType.includes('application/json')) {
      // For JSON responses
      const data = await response.json();
      return data;
    } else if (contentType.includes('image/')) {
      // For image responses
      const blob = await response.blob();
      return {
        blob: true,
        url: URL.createObjectURL(blob),
        type: contentType
      };
    } else {
      // For text and HTML responses
      const text = await response.text();
      return { text };
    }
  } catch (error) {
    console.error('CORS Proxy Error:', error);
    throw error;
  }
}


// Build: 2025-05-08T21:21:34.122Z
