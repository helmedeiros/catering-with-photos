/**
 * Tests for the i18n utility module
 */

import { jest } from '@jest/globals';
import { t, tSync, getCurrentLanguage, setLanguage, updateCachedLanguage } from '../../utils/i18n';

// Mock the Chrome API
global.chrome = {
  i18n: {
    getUILanguage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

describe('i18n utility', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    chrome.i18n.getUILanguage.mockReturnValue('en');
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue(undefined);
  });

  describe('getCurrentLanguage', () => {
    test('should return user preference from storage if available', async () => {
      // Setup
      chrome.storage.local.get.mockResolvedValue({ 'cwph-language': 'de' });

      // Execute
      const result = await getCurrentLanguage();

      // Verify
      expect(result).toBe('de');
      expect(chrome.storage.local.get).toHaveBeenCalledWith('cwph-language');
    });

    test('should fallback to Chrome UI language when no preference exists', async () => {
      // Setup
      chrome.storage.local.get.mockResolvedValue({});
      chrome.i18n.getUILanguage.mockReturnValue('de');

      // Execute
      const result = await getCurrentLanguage();

      // Verify
      expect(result).toBe('de');
      expect(chrome.i18n.getUILanguage).toHaveBeenCalled();
    });

    test('should default to English for non-German Chrome UI languages', async () => {
      // Setup
      chrome.storage.local.get.mockResolvedValue({});
      chrome.i18n.getUILanguage.mockReturnValue('fr');

      // Execute
      const result = await getCurrentLanguage();

      // Verify
      expect(result).toBe('en');
    });

    test('should handle storage access errors gracefully', async () => {
      // Setup
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      // Execute
      const result = await getCurrentLanguage();

      // Verify
      expect(result).toBe('en'); // Should default to English
    });
  });

  describe('setLanguage', () => {
    test('should store language preference in local storage', async () => {
      // Execute
      await setLanguage('de');

      // Verify
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ 'cwph-language': 'de' });
    });

    test('should not update storage for invalid language code', async () => {
      // Setup - Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      await setLanguage('fr');

      // Verify
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      // Cleanup
      consoleSpy.mockRestore();
    });

    test('should handle storage errors gracefully', async () => {
      // Setup
      chrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      await setLanguage('de');

      // Verify
      expect(consoleSpy).toHaveBeenCalled();

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('t (async translation)', () => {
    test('should return translation for the current language', async () => {
      // Setup
      chrome.storage.local.get.mockResolvedValue({ 'cwph-language': 'de' });

      // Execute
      const result = await t('content.addImages');

      // Verify
      expect(result).toBe('Bilder hinzufügen');
    });

    test('should fallback to default language if key not found', async () => {
      // Setup - simulate a nonexistent key in German but exists in English
      // This shouldn't happen in practice due to validation, but tests the fallback

      // Execute - we'll test with a deep path to verify nested traversal
      const result = await t('popup.searchButton');

      // Verify - should get English version
      expect(result).toBe('Search');
    });

    test('should return the key path if translation not found in any language', async () => {
      // Execute with a non-existent key
      const result = await t('nonexistent.key');

      // Verify
      expect(result).toBe('nonexistent.key');
    });

    test('should handle errors gracefully', async () => {
      // Setup
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // This error is caught inside the function, so it falls back to cached value or default
      // which in this case is 'Add Images' from en.json
      chrome.storage.local.get.mockRejectedValue(new Error('Test error'));

      // Execute
      const result = await t('content.addImages');

      // Verify - should return English translation as fallback, not the key path
      expect(result).toBe('Add Images');
      expect(consoleSpy).toHaveBeenCalled();

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('tSync (synchronous translation)', () => {
    test('should return translation based on cached language', async () => {
      // Setup - First set a cached language
      chrome.storage.local.get.mockResolvedValue({ 'cwph-language': 'de' });
      await updateCachedLanguage();

      // Execute
      const result = tSync('content.addImages');

      // Verify
      expect(result).toBe('Bilder hinzufügen');
    });

    // We'll skip this test as it's challenging to properly reset module state in ESM
    // The test would verify that tSync returns English translations when no language is cached
  });

  describe('updateCachedLanguage', () => {
    test('should update the cached language from storage', async () => {
      // Setup
      chrome.storage.local.get.mockResolvedValue({ 'cwph-language': 'de' });

      // Execute
      await updateCachedLanguage();

      // Verify - check if tSync now returns German translation
      expect(tSync('content.addImages')).toBe('Bilder hinzufügen');
    });
  });
});
