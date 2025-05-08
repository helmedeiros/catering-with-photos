/**
 * Popup script for Catering with Photos extension
 * Handles history loading and language preferences
 */

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
    });
    historyList.appendChild(listItem);
  });
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

    // For now, we're not implementing form submission or enhance button
    // This will be done in S6-3 and S6-4

  } catch (error) {
    console.error('Error initializing popup:', error);
  }
});
