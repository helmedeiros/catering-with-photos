import { jest } from '@jest/globals';
import { fetchImages } from '../../utils/image-scraper.js';

// Mock fetch and DOMParser
global.fetch = jest.fn();
global.DOMParser = jest.fn().mockImplementation(() => ({
  parseFromString: jest.fn().mockReturnValue({
    querySelectorAll: jest.fn().mockReturnValue([
      { src: 'http://example.com/image1.jpg' },
      { src: 'http://example.com/image2.jpg' },
      { src: 'http://example.com/image3.jpg' },
      { src: 'http://example.com/image4.jpg' },
      { src: 'http://example.com/image5.jpg' },
      { src: 'http://example.com/image6.jpg' }
    ])
  })
}));

describe('Image Scraper', () => {
  let originalConsoleError;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<html>...</html>')
    });

    // Store original console.error and mock it
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  it('fetches images from Google Images search', async () => {
    const images = await fetchImages('pasta');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/search?q=pasta&tbm=isch&safe=active')
    );
    expect(images).toHaveLength(5); // Default count
    expect(images[0]).toBe('http://example.com/image1.jpg');
  });

  it('respects the count parameter', async () => {
    const images = await fetchImages('pasta', 3);
    expect(images).toHaveLength(3);
  });

  it('handles HTTP errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404
    });

    await expect(fetchImages('pasta')).rejects.toThrow('HTTP error! status: 404');
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching images:',
      expect.any(Error)
    );
  });

  it('handles network errors', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    await expect(fetchImages('pasta')).rejects.toThrow('Network error');
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching images:',
      expect.any(Error)
    );
  });

  it('filters out invalid image URLs', async () => {
    global.DOMParser.mockImplementation(() => ({
      parseFromString: jest.fn().mockReturnValue({
        querySelectorAll: jest.fn().mockReturnValue([
          { src: 'http://example.com/valid1.jpg' },
          { src: 'invalid-url' },
          { src: 'http://example.com/valid2.jpg' }
        ])
      })
    }));

    const images = await fetchImages('pasta');
    expect(images).toHaveLength(2);
    expect(images).not.toContain('invalid-url');
  });
});
