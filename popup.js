/**
 * Popup script for Catering with Photos extension
 * Handles history loading and language preferences
 */

// Import cache utilities
import { clearCache } from './utils/cache.js';

// Constants for storage keys
const HISTORY_KEY = 'cwph-history';
const LANGUAGE_KEY = 'cwph-language';

// History state
let searchHistory = [];

/**
 * Loads search history from Chrome storage
 * @returns {Promise<Array>} The search history array
 */
async function loadHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(HISTORY_KEY, (result) => {
      const history = result[HISTORY_KEY] || [];
      resolve(history);
    });
  });
}

/**
 * Saves a search term to history
 * @param {string} query - The search query to save
 * @returns {Promise<void>}
 */
async function saveToHistory(query) {
  // Don't save empty queries
  if (!query.trim()) {
    return;
  }

  // Load current history
  const history = await loadHistory();

  // Remove the query if it already exists (to avoid duplicates)
  const filteredHistory = history.filter(item => item !== query);

  // Add the new query to the beginning
  const updatedHistory = [query, ...filteredHistory].slice(0, 10); // Keep only 10 most recent

  // Save back to storage
  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_KEY]: updatedHistory }, () => {
      // Update our local state
      searchHistory = updatedHistory;
      // Re-render the history list
      renderHistory(searchHistory);
      resolve();
    });
  });
}

/**
 * Renders the search history in the history list
 * @param {Array} history - Array of search terms to display
 */
function renderHistory(history) {
  const historyList = document.getElementById('history-list');

  // Clear existing list items
  historyList.innerHTML = '';

  if (history.length === 0) {
    // Show empty state
    const emptyItem = document.createElement('li');
    emptyItem.className = 'cwph-empty-history';
    emptyItem.textContent = 'No recent searches';
    historyList.appendChild(emptyItem);
    return;
  }

  // Add each history item to the list
  history.forEach(item => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    listItem.dataset.query = item;
    listItem.addEventListener('click', () => {
      // Set the search input value to the clicked history item
      document.getElementById('search-input').value = item;
      // Perform search with this item
      performSearch(item);
    });
    historyList.appendChild(listItem);
  });
}

/**
 * Performs a search by sending a message to the content script
 * @param {string} query - The search query
 * @returns {Promise<void>}
 */
async function performSearch(query) {
  if (!query.trim()) {
    return;
  }

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    // Check if we're on a supported domain
    const onSupportedDomain = await isOnSupportedDomain();
    if (!onSupportedDomain) {
      alert('This extension only works on Z-Catering (bestellung.z-catering.de)');
      return;
    }

    // Send message to content script
    await chrome.tabs.sendMessage(tab.id, { type: 'SEARCH', query });

    // Save to history
    await saveToHistory(query);
  } catch (error) {
    console.error('Error performing search:', error);
  }
}

/**
 * Checks if the current tab is on a supported domain
 * @returns {Promise<boolean>} True if the tab is on a supported domain
 */
async function isOnSupportedDomain() {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      return false;
    }

    // Check if the URL is from a supported domain
    const url = new URL(tab.url);
    return url.hostname === 'bestellung.z-catering.de' || url.hostname.includes('localhost');
  } catch (error) {
    console.error('Error checking domain:', error);
    return false;
  }
}

/**
 * Triggers the enhance menu action in the content script
 * @returns {Promise<void>}
 */
async function enhanceMenu() {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    // Check if we're on a supported domain
    const onSupportedDomain = await isOnSupportedDomain();
    if (!onSupportedDomain) {
      alert('This extension only works on Z-Catering (bestellung.z-catering.de)');
      return;
    }

    // Add try-catch to handle specific connection errors
    try {
      // Send ENHANCE message to content script
      await chrome.tabs.sendMessage(tab.id, { type: 'ENHANCE' });
      console.log('Enhance menu message sent successfully');
    } catch (connectionError) {
      console.error('Connection error:', connectionError);

      // Show an alert to the user
      alert('Cannot enhance menu: Make sure you are on a supported page (Z-Catering menu)');

      // Don't close the popup on error so user can see the message
      return;
    }

    // Close popup after successful action
    window.close();
  } catch (error) {
    console.error('Error enhancing menu:', error);
  }
}

/**
 * Loads the user's language preference
 * @returns {Promise<string>} The language code ('en' or 'de')
 */
async function loadLanguagePreference() {
  return new Promise((resolve) => {
    chrome.storage.local.get(LANGUAGE_KEY, (result) => {
      // Default to browser UI language or English if not set
      let language = result[LANGUAGE_KEY] || chrome.i18n.getUILanguage() || 'en';

      // Ensure we only use supported languages
      if (!['en', 'de'].includes(language)) {
        language = 'en';
      }

      resolve(language);
    });
  });
}

/**
 * Updates the language dropdown to reflect the current preference
 * @param {string} language - The language code ('en' or 'de')
 */
function updateLanguageUI(language) {
  const selector = document.getElementById('language-select');
  selector.value = language;
}

/**
 * Saves the language preference to storage
 * @param {string} language - The language code to save
 */
async function saveLanguagePreference(language) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [LANGUAGE_KEY]: language }, resolve);
  });
}

/**
 * Clears all cached images data and shows a confirmation
 */
async function clearImageCache() {
  try {
    console.log('Clearing image cache');

    // Clear the local cache using the util function
    const localSuccess = clearCache();
    console.log(`Local cache cleared: ${localSuccess}`);

    // Send message to content script to clear its cache too
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Only attempt to clear content script cache if on supported domain
      if (tab) {
        const onSupportedDomain = await isOnSupportedDomain();

        if (onSupportedDomain) {
          // Send clear cache message directly to content script
          console.log('Sending CLEAR_CACHE message to content script');
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_CACHE' });
          console.log('Content script cache clear response:', response);
        }
      } else {
        console.warn('No active tab found, only cleared local cache');
      }
    } catch (connectionError) {
      console.warn('Content script connection error (tab may not be a menu page):', connectionError);
      // Continue with confirmation even if content script isn't available
    }

    // Always show confirmation to user
    alert('Image cache cleared successfully!');
  } catch (error) {
    console.error('Error clearing cache:', error);
    alert('An error occurred while clearing the cache.');
  }
}

// Initialize popup when DOM content is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load and render search history
    searchHistory = await loadHistory();
    renderHistory(searchHistory);

    // Load and apply language preference
    const language = await loadLanguagePreference();
    updateLanguageUI(language);

    // Set up language selector event listener
    const languageSelector = document.getElementById('language-select');
    languageSelector.addEventListener('change', async (event) => {
      const newLanguage = event.target.value;
      await saveLanguagePreference(newLanguage);
      // In future tasks, we'll add code to update UI text based on language
    });

    // Set up search form submission
    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const input = document.getElementById('search-input');
      const query = input.value.trim();

      if (query) {
        await performSearch(query);
      }
    });

    // Set up enhance menu button
    const enhanceButton = document.getElementById('enhance-button');
    enhanceButton.addEventListener('click', async () => {
      await enhanceMenu();
    });

    // Set up clear cache button
    const clearCacheButton = document.getElementById('clear-cache-button');
    clearCacheButton.addEventListener('click', async () => {
      await clearImageCache();
    });

  } catch (error) {
    console.error('Error initializing popup:', error);
  }
});
