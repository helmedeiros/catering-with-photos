import { jest } from '@jest/globals';
import { getCached, setCached, cleanupCache } from '../../utils/cache.js';

describe('Cache Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset Date.now() to a fixed value
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCached', () => {
    it('returns null for non-existent query', () => {
      expect(getCached('nonexistent')).toBeNull();
    });

    it('returns cached images for existing query', () => {
      const images = ['image1.jpg', 'image2.jpg'];
      setCached('pasta', images);
      expect(getCached('pasta')).toEqual(images);
    });

    it('returns null for expired cache entry', () => {
      const images = ['image1.jpg', 'image2.jpg'];
      setCached('pasta', images);

      // Advance time by 25 hours (default TTL is 24 hours)
      jest.advanceTimersByTime(25 * 60 * 60 * 1000);

      expect(getCached('pasta')).toBeNull();
    });

    it('respects custom TTL', () => {
      const images = ['image1.jpg', 'image2.jpg'];
      setCached('pasta', images);

      // Advance time by 2 hours
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);

      // Should still be valid with 3-hour TTL
      expect(getCached('pasta', 3 * 60 * 60 * 1000)).toEqual(images);

      // Should be expired with 1-hour TTL
      expect(getCached('pasta', 60 * 60 * 1000)).toBeNull();
    });
  });

  describe('setCached', () => {
    it('stores images in cache', () => {
      const images = ['image1.jpg', 'image2.jpg'];
      setCached('pasta', images);
      expect(getCached('pasta')).toEqual(images);
    });

    it('overwrites existing cache entry', () => {
      setCached('pasta', ['old.jpg']);
      setCached('pasta', ['new.jpg']);
      expect(getCached('pasta')).toEqual(['new.jpg']);
    });

    it('stores timestamp with cache entry', () => {
      const images = ['image1.jpg'];
      setCached('pasta', images);

      const cacheStr = localStorage.getItem('cwph-cache');
      const cache = JSON.parse(cacheStr);

      expect(cache.pasta).toHaveProperty('timestamp');
      expect(cache.pasta.timestamp).toBe(Date.now());
    });
  });

  describe('cleanupCache', () => {
    it('removes expired entries', () => {
      // Set up some cache entries
      setCached('pasta', ['pasta1.jpg']);
      setCached('salad', ['salad1.jpg']);

      // Advance time by 25 hours
      jest.advanceTimersByTime(25 * 60 * 60 * 1000);

      // Add a new entry
      setCached('soup', ['soup1.jpg']);

      // Clean up expired entries
      cleanupCache();

      // Only the new entry should remain
      expect(getCached('pasta')).toBeNull();
      expect(getCached('salad')).toBeNull();
      expect(getCached('soup')).toEqual(['soup1.jpg']);
    });

    it('respects custom TTL', () => {
      // Set up cache entries
      setCached('pasta', ['pasta1.jpg']);
      setCached('salad', ['salad1.jpg']);

      // Advance time by 2 hours
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);

      // Clean up with 1-hour TTL
      cleanupCache(60 * 60 * 1000);

      // All entries should be removed
      expect(getCached('pasta')).toBeNull();
      expect(getCached('salad')).toBeNull();
    });

    it('handles empty cache', () => {
      expect(() => cleanupCache()).not.toThrow();
    });
  });
});
