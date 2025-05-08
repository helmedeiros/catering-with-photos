import { jest } from '@jest/globals';
import { getCached, setCached } from '../../utils/cache.js';

describe('Cache Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('returns null for non-existent query', () => {
    const result = getCached('nonexistent');
    expect(result).toBeNull();
  });

  it('stores and retrieves images for a query', () => {
    const query = 'pasta';
    const images = ['url1.jpg', 'url2.jpg'];

    setCached(query, images);
    const result = getCached(query);

    expect(result).toEqual(images);
  });

  it('handles multiple queries in cache', () => {
    const query1 = 'pasta';
    const images1 = ['url1.jpg', 'url2.jpg'];
    const query2 = 'pizza';
    const images2 = ['url3.jpg', 'url4.jpg'];

    setCached(query1, images1);
    setCached(query2, images2);

    expect(getCached(query1)).toEqual(images1);
    expect(getCached(query2)).toEqual(images2);
  });

  it('overwrites existing cache entry', () => {
    const query = 'pasta';
    const images1 = ['url1.jpg'];
    const images2 = ['url2.jpg', 'url3.jpg'];

    setCached(query, images1);
    setCached(query, images2);

    expect(getCached(query)).toEqual(images2);
  });

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage.getItem to throw an error
    const mockGetItem = jest.spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('Storage error');
      });

    const result = getCached('pasta');
    expect(result).toBeNull();

    mockGetItem.mockRestore();
  });

  it('handles localStorage setItem errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Storage error');
      });

    // Should not throw
    expect(() => {
      setCached('pasta', ['url1.jpg']);
    }).not.toThrow();

    mockSetItem.mockRestore();
  });
});
