/**
 * Internationalization utility for the Catering with Photos extension
 */

// Import language files
import en from '../i18n/en.json';
import de from '../i18n/de.json';

// Available languages
const languages = { en, de };

// Default language
const DEFAULT_LANGUAGE = 'en';

// Storage key for language preference
const LANGUAGE_PREF_KEY = 'cwph-language';

/**
 * Get the current language code from storage or Chrome UI
 * @returns {Promise<string>} Language code ('en' or 'de')
 */
export async function getCurrentLanguage() {
  try {
    // Check for user preference in storage
    const result = await chrome.storage.local.get(LANGUAGE_PREF_KEY);

    if (result[LANGUAGE_PREF_KEY]) {
      return result[LANGUAGE_PREF_KEY];
    }

    // Fall back to Chrome UI language
    const uiLanguage = chrome.i18n.getUILanguage();

    // Check if it's German, otherwise default to English
    return uiLanguage.startsWith('de') ? 'de' : DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('Error getting language preference:', error);
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Set the current language preference
 * @param {string} languageCode - 'en' or 'de'
 * @returns {Promise<void>}
 */
export async function setLanguage(languageCode) {
  if (!languages[languageCode]) {
    console.error(`Invalid language code: ${languageCode}`);
    return;
  }

  try {
    await chrome.storage.local.set({ [LANGUAGE_PREF_KEY]: languageCode });
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
}

/**
 * Get a translation by key path
 * @param {string} keyPath - Dot-notation path like 'content.addImages'
 * @param {string} [fallbackLanguage=DEFAULT_LANGUAGE] - Fallback language code
 * @returns {Promise<string>} Translated text
 */
export async function t(keyPath, fallbackLanguage = DEFAULT_LANGUAGE) {
  try {
    const currentLang = await getCurrentLanguage();

    // Get translation from the current language
    const translation = getNestedValue(languages[currentLang], keyPath);

    // If translation exists, return it
    if (translation) return translation;

    // Try fallback language
    const fallbackTranslation = getNestedValue(languages[fallbackLanguage], keyPath);

    // Return fallback or key path as last resort
    return fallbackTranslation || keyPath;
  } catch (error) {
    console.error(`Translation error for key ${keyPath}:`, error);
    return keyPath;
  }
}

/**
 * Synchronous version of the translation function
 * Uses a cached language value, may not be accurate if language changes
 * @param {string} keyPath - Dot-notation path like 'content.addImages'
 * @returns {string} Translated text or key path if not found
 */
let cachedLanguage = null;

export function tSync(keyPath) {
  // Use cached language or default to English
  const lang = cachedLanguage || DEFAULT_LANGUAGE;

  // Get translation
  const translation = getNestedValue(languages[lang], keyPath);

  // Return translation or key path as fallback
  return translation || getNestedValue(languages[DEFAULT_LANGUAGE], keyPath) || keyPath;
}

/**
 * Update the cached language for synchronous translations
 * Call this when the app initializes or language changes
 */
export async function updateCachedLanguage() {
  cachedLanguage = await getCurrentLanguage();
}

/**
 * Helper to get a nested value from an object using dot notation
 * @param {Object} obj - The object to traverse
 * @param {string} path - Dot notation path like 'a.b.c'
 * @returns {*} The value or undefined if not found
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }

  return current;
}

// Initialize cached language when module loads
updateCachedLanguage();
