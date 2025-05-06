import { jest } from '@jest/globals';
import { fetchImages } from '../../utils/image-scraper';

describe('Image Scraper', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
    // Mock DOMParser
    global.DOMParser = jest.fn().mockImplementation(() => ({
      parseFromString: jest.fn().mockReturnValue({
        querySelectorAll: jest.fn().mockReturnValue([
          { src: 'http://example.com/image1.jpg' },
          { src: 'http://example.com/image2.jpg' },
          { src: 'http://example.com/image3.jpg' },
          { src: 'http://example.com/image4.jpg' },
          { src: 'http://example.com/image5.jpg' }
        ])
      })
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches images from Google Images search', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: jest.fn().mockResolvedValue('<html><body><img src="test.jpg"></body></html>')
    });

    const images = await fetchImages('pasta');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/search?q=pasta&tbm=isch&safe=active'),
      {
        mode: 'no-cors',
        credentials: 'omit'
      }
    );
    expect(images).toHaveLength(5); // Default count
  });

  it('handles HTTP errors', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(fetchImages('pasta')).rejects.toThrow('HTTP error! status: 404');
  });

  it('handles network errors', async () => {
    // Mock network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchImages('pasta')).rejects.toThrow('Network error');
  });

  it('returns mock images in test environment', async () => {
    // Set test environment flag
    window.__CWPH_TEST__ = true;

    const images = await fetchImages('pasta', 2);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(images).toHaveLength(2);
    expect(images[0]).toMatch(/^data:image\/gif;base64,/);
  });
});
