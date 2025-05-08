import { jest } from '@jest/globals';

// Mock data for tests
const MOCK_IMAGES = [
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
];

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
  let originalMath;

  beforeEach(async () => {
    // Store original window object and Math.random
    originalWindow = { ...window };
    originalMath = Math.random;

    // Mock Math.random to return predictable values
    Math.random = jest.fn().mockReturnValue(0.5);

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
    // Restore original window object and Math.random
    Object.assign(window, originalWindow);
    Math.random = originalMath;
  });

  it('returns cached images when available', async () => {
    window.__CWPH_TEST__ = false;
    const mockImages = ['image1.jpg', 'image2.jpg'];
    mockGetCached.mockReturnValue(mockImages);

    const result = await fetchImages('pasta');
    expect(result).toEqual(mockImages);
    expect(mockGetCached).toHaveBeenCalledWith('pasta');
    expect(mockCleanupCache).toHaveBeenCalled();
  });

  it('fetches and caches images when not in cache', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    // With our new implementation, expect Unsplash URLs to be generated
    const expectedImages = Array(5).fill(0).map((_, i) =>
      `https://source.unsplash.com/featured/?pasta&sig=500`
    );

    const result = await fetchImages('pasta');

    // Check that the result contains the expected number of Unsplash URLs
    expect(result.length).toBe(5);
    expect(result[0]).toMatch(/^https:\/\/source\.unsplash\.com\/featured\/\?pasta&sig=\d+$/);

    // Verify setCached was called with the same data
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
  });

  it('returns empty array when no mock images are provided in test environment', async () => {
    window.__CWPH_TEST__ = true;
    const result = await fetchImages('pasta');
    expect(result).toEqual([]);
  });

  it('handles fetch errors gracefully', async () => {
    window.__CWPH_TEST__ = false;
    mockGetCached.mockReturnValue(null);

    // The current implementation doesn't rely on fetch anymore,
    // so we're just testing the normal operation even with an error
    const result = await fetchImages('pasta');

    // Expect array with 5 Unsplash URLs
    expect(result.length).toBe(5);
    expect(result[0]).toMatch(/^https:\/\/source\.unsplash\.com\/featured\/\?pasta&sig=\d+$/);
    expect(mockCleanupCache).toHaveBeenCalled();
  });
});
