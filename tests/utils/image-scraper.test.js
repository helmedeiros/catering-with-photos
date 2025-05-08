import { jest } from '@jest/globals';

// Mock data for tests
const MOCK_IMAGES = [
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
];

// Mock Google search response
const MOCK_GOOGLE_SEARCH_RESULT = `
<!DOCTYPE html>
<html>
<head></head>
<body>
  <div class="search-results">
    <script>AF_initDataCallback({data:[[["https://example.com/image1.jpg",200,300]]]})</script>
    <div>"ou":"https://example.com/image2.jpg"</div>
  </div>
</body>
</html>
`;

// Expected Google search URL pattern
const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=pasta%20food&tbm=isch&safe=active';

// Expected headers
const EXPECTED_HEADERS = {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

// Mock cache module
const mockGetCached = jest.fn();
const mockSetCached = jest.fn();
const mockCleanupCache = jest.fn();

// Mock proxy module
const mockProxyFetch = jest.fn();
const mockProxyImage = jest.fn();

jest.unstable_mockModule('../../utils/cache.js', () => ({
  getCached: mockGetCached,
  setCached: mockSetCached,
  cleanupCache: mockCleanupCache
}));

jest.unstable_mockModule('../../utils/proxy.js', () => ({
  proxyFetch: mockProxyFetch,
  proxyImage: mockProxyImage
}));

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      callback({ success: true, data: { text: MOCK_GOOGLE_SEARCH_RESULT } });
      return true;
    })
  }
};

describe('Image Scraper', () => {
  let fetchImages;
  let originalWindow;
  let originalFetch;

  beforeEach(async () => {
    // Store original window and fetch
    originalWindow = { ...window };
    originalFetch = global.fetch;

    // Mock fetch to return HTML content for Google search
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(MOCK_GOOGLE_SEARCH_RESULT),
        url: 'https://www.google.com/search?q=pasta&tbm=isch'
      })
    );

    // Mock proxy fetch to return HTML content
    mockProxyFetch.mockResolvedValue({ text: MOCK_GOOGLE_SEARCH_RESULT });

    // Clear all mocks
    jest.clearAllMocks();

    // Reset test environment
    window.__CWPH_TEST__ = false;
    window.__CWPH_MOCK_IMAGES__ = undefined;

    // Import the module under test
    const module = await import('../../utils/image-scraper.js');
    fetchImages = module.fetchImages;
  });

  afterEach(() => {
    // Restore original window and fetch
    Object.assign(window, originalWindow);
    global.fetch = originalFetch;
  });

  it('returns cached images when available', async () => {
    window.__CWPH_TEST__ = false;
    const mockImages = ['image1.jpg', 'image2.jpg'];
    mockGetCached.mockReturnValue(mockImages);

    const result = await fetchImages('pasta');
    expect(result).toEqual(mockImages);
    expect(mockGetCached).toHaveBeenCalledWith('pasta');
    expect(mockCleanupCache).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches and caches images from Google when not in cache', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    const result = await fetchImages('pasta', 3);

    // Should make API call to Google Images
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/google.com\/search\?q=/),
      expect.objectContaining(EXPECTED_HEADERS)
    );

    // Should have attempted to cache results
    expect(mockSetCached).toHaveBeenCalled();
    expect(mockCleanupCache).toHaveBeenCalled();
  });

  it('returns mock images in test environment', async () => {
    window.__CWPH_TEST__ = true;
    window.__CWPH_MOCK_IMAGES__ = MOCK_IMAGES;
    const result = await fetchImages('pasta');
    expect(result).toEqual(MOCK_IMAGES);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns empty array when no mock images are provided in test environment', async () => {
    window.__CWPH_TEST__ = true;
    const result = await fetchImages('pasta');
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('tries proxy fetch when direct fetch fails', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    // Mock direct fetch to fail
    global.fetch.mockRejectedValue(new Error('CORS error'));

    // Mock proxy fetch to succeed
    mockProxyFetch.mockResolvedValue({ text: MOCK_GOOGLE_SEARCH_RESULT });

    const result = await fetchImages('pasta', 1);

    // Should have attempted direct fetch
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/google.com\/search\?q=/),
      expect.objectContaining(EXPECTED_HEADERS)
    );

    // Should have fallen back to proxy
    expect(mockProxyFetch).toHaveBeenCalledWith(
      expect.stringMatching(/google.com\/search\?q=/),
      expect.objectContaining(EXPECTED_HEADERS)
    );
  });

  it('uses fallback images when fetch fails', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    // Mock both direct and proxy fetch to fail
    global.fetch.mockRejectedValue(new Error('Network error'));
    mockProxyFetch.mockRejectedValue(new Error('Proxy error'));

    // Spy on console.warn and error
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    console.warn = jest.fn();
    console.error = jest.fn();

    try {
      const result = await fetchImages('pasta');

      // Should return fallback images (not empty array)
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('unsplash.com');

      // Should warn about the failures
      expect(console.warn).toHaveBeenCalled();

      // Should have cached the fallback results
      expect(mockSetCached).toHaveBeenCalled();
    } finally {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    }
  });

  it('handles HTTP errors and falls back to default images', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    // Mock direct fetch to return error status
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404
      })
    );

    // Mock proxy fetch to also fail
    mockProxyFetch.mockRejectedValue(new Error('Proxy error'));

    // Spy on console.warn
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();

    try {
      const result = await fetchImages('pasta');

      // Should return fallback images, not empty array
      expect(result.length).toBeGreaterThan(0);

      // Should warn about the failure
      expect(console.warn).toHaveBeenCalled();
    } finally {
      console.warn = originalConsoleWarn;
    }
  });
});
