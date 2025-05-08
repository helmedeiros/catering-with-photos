import { jest } from '@jest/globals';

// Mock data for tests
const MOCK_IMAGES = [
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
];

// Mock Foodish API response
const MOCK_FOODISH_RESPONSE = {
  image: 'https://foodish-api.herokuapp.com/images/biryani/biryani10.jpg'
};

// Mock cache module
const mockGetCached = jest.fn();
const mockSetCached = jest.fn();
const mockCleanupCache = jest.fn();

jest.unstable_mockModule('../../utils/cache.js', () => ({
  getCached: mockGetCached,
  setCached: mockSetCached,
  cleanupCache: mockCleanupCache
}));

describe('Image Scraper', () => {
  let fetchImages;
  let originalWindow;
  let originalFetch;

  beforeEach(async () => {
    // Store original window and fetch
    originalWindow = { ...window };
    originalFetch = global.fetch;

    // Mock fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(MOCK_FOODISH_RESPONSE)
      })
    );

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

  it('fetches and caches images from Foodish API when not in cache', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    const result = await fetchImages('pasta', 3);

    // Should make 3 API calls
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith('https://foodish-api.herokuapp.com/api');

    // Should return 3 image URLs
    expect(result.length).toBe(3);
    expect(result[0]).toBe(MOCK_FOODISH_RESPONSE.image);

    // Should cache the results
    expect(mockSetCached).toHaveBeenCalledWith(
      'pasta',
      result,
      100 // Default max entries
    );
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

  it('handles fetch errors gracefully and falls back to default images', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    // Mock fetch to fail
    global.fetch.mockRejectedValue(new Error('Network error'));

    // Spy on console.warn
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    console.warn = jest.fn();
    console.error = jest.fn();

    try {
      const result = await fetchImages('pasta');

      // Should still return images (fallback)
      expect(result.length).toBeGreaterThan(0);
      // Should warn about the failure
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('falling back to default images'));
      // Should cache the fallback images
      expect(mockSetCached).toHaveBeenCalled();
    } finally {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    }
  });
});
