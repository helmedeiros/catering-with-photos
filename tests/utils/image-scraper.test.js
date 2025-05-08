import { jest } from '@jest/globals';

// Mock data for tests
const MOCK_IMAGES = [
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
];

// Mock the cache module
const mockGetCached = jest.fn();
const mockSetCached = jest.fn();
jest.unstable_mockModule('../../utils/cache.js', () => ({
  getCached: mockGetCached,
  setCached: mockSetCached
}));

// Import the module under test after mocking dependencies
let fetchImages;

describe('Image Scraper', () => {
  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset test environment flag
    global.window = { __CWPH_TEST__: false };
    // Mock fetch
    global.fetch = jest.fn();
    // Mock DOMParser
    global.DOMParser = jest.fn().mockImplementation(() => ({
      parseFromString: jest.fn().mockReturnValue({
        querySelectorAll: jest.fn().mockReturnValue([])
      })
    }));

    // Import the module under test
    const module = await import('../../utils/image-scraper.js');
    fetchImages = module.fetchImages;
  });

  it('returns cached images when available', async () => {
    const cachedImages = ['cached1.jpg', 'cached2.jpg'];
    mockGetCached.mockReturnValue(cachedImages);

    const result = await fetchImages('pasta', 2);

    expect(mockGetCached).toHaveBeenCalledWith('pasta');
    expect(result).toEqual(cachedImages.slice(0, 2));
    // Should not call setCached when using cache
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  it('fetches and caches images when not in cache', async () => {
    // Mock no cache hit
    mockGetCached.mockReturnValue(null);
    // Mock successful fetch
    global.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`
        <html>
          <body>
            <img src="http://example.com/img1.jpg">
            <img src="http://example.com/img2.jpg">
          </body>
        </html>
      `)
    });

    // Mock DOMParser to return our test images
    global.DOMParser = jest.fn().mockImplementation(() => ({
      parseFromString: jest.fn().mockReturnValue({
        querySelectorAll: jest.fn().mockReturnValue([
          { src: 'http://example.com/img1.jpg' },
          { src: 'http://example.com/img2.jpg' }
        ])
      })
    }));

    const result = await fetchImages('pasta');

    expect(mockGetCached).toHaveBeenCalledWith('pasta');
    expect(mockSetCached).toHaveBeenCalledWith('pasta', expect.any(Array));
    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(['http://example.com/img1.jpg', 'http://example.com/img2.jpg']);
  });

  it('returns empty array in test environment', async () => {
    global.window.__CWPH_TEST__ = true;
    mockGetCached.mockReturnValue(null);

    const result = await fetchImages('pasta', 2);

    expect(mockGetCached).toHaveBeenCalledWith('pasta');
    expect(result).toEqual([]);
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  it('handles fetch errors gracefully', async () => {
    mockGetCached.mockReturnValue(null);
    global.window.__CWPH_TEST__ = false;
    global.fetch.mockRejectedValue(new Error('Network error'));

    await expect(fetchImages('pasta')).rejects.toThrow('Network error');
    expect(mockSetCached).not.toHaveBeenCalled();
  });
});
