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

  beforeEach(async () => {
    // Store original window object
    originalWindow = { ...window };

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
    // Restore original window object
    Object.assign(window, originalWindow);
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
    global.fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve(`
        <html>
          <img src="http://example.com/image1.jpg">
          <img src="http://example.com/image2.jpg">
        </html>
      `)
    });

    // Mock DOMParser
    const mockImages = [
      { src: 'http://example.com/image1.jpg' },
      { src: 'http://example.com/image2.jpg' }
    ];
    const mockQuerySelectorAll = jest.fn().mockReturnValue(mockImages);
    const mockParseFromString = jest.fn().mockReturnValue({
      querySelectorAll: mockQuerySelectorAll
    });
    global.DOMParser = jest.fn().mockImplementation(() => ({
      parseFromString: mockParseFromString
    }));

    const result = await fetchImages('pasta');
    expect(result).toEqual(['http://example.com/image1.jpg', 'http://example.com/image2.jpg']);
    expect(mockSetCached).toHaveBeenCalledWith(
      'pasta',
      ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
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
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchImages('pasta');
    expect(result).toEqual([]);
    expect(mockCleanupCache).toHaveBeenCalled();
  });
});
