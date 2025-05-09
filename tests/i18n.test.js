/**
 * Tests for i18n localization files
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('i18n resource files', () => {
  // Load both language files
  const enPath = join(__dirname, '../i18n/en.json');
  const dePath = join(__dirname, '../i18n/de.json');

  let enJson, deJson;

  beforeAll(() => {
    enJson = JSON.parse(readFileSync(enPath, 'utf8'));
    deJson = JSON.parse(readFileSync(dePath, 'utf8'));
  });

  test('English localization file exists and is valid JSON', () => {
    expect(existsSync(enPath)).toBeTruthy();
    expect(() => JSON.parse(readFileSync(enPath, 'utf8'))).not.toThrow();
  });

  test('German localization file exists and is valid JSON', () => {
    expect(existsSync(dePath)).toBeTruthy();
    expect(() => JSON.parse(readFileSync(dePath, 'utf8'))).not.toThrow();
  });

  test('Both files have the same structure', () => {
    // Helper function to get all keys from nested object
    function getAllKeys(obj, prefix = '') {
      return Object.entries(obj).flatMap(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          return getAllKeys(value, newPrefix);
        }
        return newPrefix;
      });
    }

    const enKeys = getAllKeys(enJson).sort();
    const deKeys = getAllKeys(deJson).sort();

    expect(enKeys).toEqual(deKeys);
  });

  test('All required keys are present in English file', () => {
    expect(enJson.extension.title).toBeDefined();
    expect(enJson.extension.footer).toBeDefined();

    expect(enJson.popup.searchPlaceholder).toBeDefined();
    expect(enJson.popup.searchButton).toBeDefined();
    expect(enJson.popup.enhanceMenu).toBeDefined();
    expect(enJson.popup.clearCache).toBeDefined();
    expect(enJson.popup.recentSearches).toBeDefined();
    expect(enJson.popup.noRecentSearches).toBeDefined();

    expect(enJson.content.addImages).toBeDefined();
    expect(enJson.content.noImages).toBeDefined();
    expect(enJson.content.seeMore).toBeDefined();
    expect(enJson.content.closeModal).toBeDefined();

    expect(enJson.messages.cacheCleared).toBeDefined();
    expect(enJson.messages.connectionError).toBeDefined();
    expect(enJson.messages.tryAgain).toBeDefined();
  });

  test('All required keys are present in German file', () => {
    expect(deJson.extension.title).toBeDefined();
    expect(deJson.extension.footer).toBeDefined();

    expect(deJson.popup.searchPlaceholder).toBeDefined();
    expect(deJson.popup.searchButton).toBeDefined();
    expect(deJson.popup.enhanceMenu).toBeDefined();
    expect(deJson.popup.clearCache).toBeDefined();
    expect(deJson.popup.recentSearches).toBeDefined();
    expect(deJson.popup.noRecentSearches).toBeDefined();

    expect(deJson.content.addImages).toBeDefined();
    expect(deJson.content.noImages).toBeDefined();
    expect(deJson.content.seeMore).toBeDefined();
    expect(deJson.content.closeModal).toBeDefined();

    expect(deJson.messages.cacheCleared).toBeDefined();
    expect(deJson.messages.connectionError).toBeDefined();
    expect(deJson.messages.tryAgain).toBeDefined();
  });

  test('No empty translations exist', () => {
    // Helper function to check for empty strings in an object
    function checkForEmptyStrings(obj) {
      for (const key in obj) {
        if (typeof obj[key] === 'string' && obj[key].trim() === '') {
          return true;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkForEmptyStrings(obj[key])) {
            return true;
          }
        }
      }
      return false;
    }

    expect(checkForEmptyStrings(enJson)).toBe(false);
    expect(checkForEmptyStrings(deJson)).toBe(false);
  });
});
