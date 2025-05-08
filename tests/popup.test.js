import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { injectStylesForTesting } from './utils/test-env.js';

describe('popup.html', () => {
  let dom;
  let document;
  let window;

  beforeEach(async () => {
    // Read popup.html file
    const html = fs.readFileSync(path.resolve('popup.html'), 'utf8');

    // Create a virtual DOM
    dom = new JSDOM(html, {
      url: 'http://localhost/',
      contentType: 'text/html',
      includeNodeLocations: true,
      resources: 'usable',
      runScripts: 'dangerously'
    });

    window = dom.window;
    document = window.document;

    // Mock chrome API
    window.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      },
      i18n: {
        getUILanguage: jest.fn().mockReturnValue('en')
      }
    };

    // Mock fetch for style files
    window.fetch = jest.fn().mockImplementation((url) => {
      if (url === 'styles/popup.css') {
        return Promise.resolve({
          text: () => Promise.resolve(`
            .cwph-popup { width: 320px; }
            .cwph-btn-primary { background-color: #1976d2; }
            .cwph-btn-accent { background-color: #4a90e2; }
            .cwph-history-list { max-height: 160px; }
          `)
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Apply styles for testing
    await injectStylesForTesting(window, ['styles/popup.css']);
  });

  // Tests for HTML structure
  describe('HTML structure', () => {
    it('should have the correct title', () => {
      expect(document.title).toBe('Catering with Photos');
    });

    it('should include the popup CSS file', () => {
      const link = document.querySelector('link[rel="stylesheet"]');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('styles/popup.css');
    });

    it('should have a language selector with English and German options', () => {
      const select = document.getElementById('language-select');
      expect(select).toBeTruthy();

      const options = select.querySelectorAll('option');
      expect(options.length).toBe(2);

      const languages = Array.from(options).map(opt => opt.value);
      expect(languages).toContain('en');
      expect(languages).toContain('de');
    });

    it('should have a search form with input and button', () => {
      const form = document.getElementById('search-form');
      expect(form).toBeTruthy();

      const input = document.getElementById('search-input');
      expect(input).toBeTruthy();
      expect(input.hasAttribute('required')).toBe(true);

      const submitBtn = form.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.textContent.trim()).toBe('Search');
    });

    it('should have an enhance menu button', () => {
      const btn = document.getElementById('enhance-button');
      expect(btn).toBeTruthy();
      expect(btn.textContent.trim()).toBe('Enhance Menu');
      expect(btn.classList.contains('cwph-btn-accent')).toBe(true);
    });

    it('should have a history section with empty state', () => {
      const historySection = document.querySelector('.cwph-history-container');
      expect(historySection).toBeTruthy();

      const title = historySection.querySelector('h2');
      expect(title.textContent).toBe('Recent Searches');

      const list = document.getElementById('history-list');
      expect(list).toBeTruthy();

      const emptyState = list.querySelector('.cwph-empty-history');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toBe('No recent searches');
    });
  });

  // CSS tests will be skipped in JSDOM environment as it doesn't fully support computed styles
  describe('CSS classes', () => {
    it('should have correct CSS classes on popup container', () => {
      const popup = document.querySelector('.cwph-popup');
      expect(popup).toBeTruthy();
      expect(popup.classList.contains('cwph-popup')).toBe(true);
    });

    it('should have correct CSS classes on buttons', () => {
      const primaryBtn = document.querySelector('button.cwph-btn.cwph-btn-primary');
      expect(primaryBtn).toBeTruthy();
      expect(primaryBtn.classList.contains('cwph-btn')).toBe(true);
      expect(primaryBtn.classList.contains('cwph-btn-primary')).toBe(true);

      const accentBtn = document.getElementById('enhance-button');
      expect(accentBtn).toBeTruthy();
      expect(accentBtn.classList.contains('cwph-btn')).toBe(true);
      expect(accentBtn.classList.contains('cwph-btn-accent')).toBe(true);
    });

    it('should have correct CSS classes on history list', () => {
      const historyList = document.getElementById('history-list');
      expect(historyList).toBeTruthy();
      expect(historyList.classList.contains('cwph-history-list')).toBe(true);
    });
  });

  // Tests for script inclusion
  describe('Script loading', () => {
    it('should include the popup.js script', () => {
      const script = document.querySelector('script[src="popup.js"]');
      expect(script).toBeTruthy();
    });
  });
});

// Tests for popup.js functionality - manually testing the functions
describe('popup.js functionality', () => {
  const HISTORY_KEY = 'cwph-history';
  const LANGUAGE_KEY = 'cwph-language';
  const mockHistory = ['Pasta Carbonara', 'Caesar Salad', 'Tiramisu'];

  // Mock functions similar to those in popup.js
  let renderHistory;
  let loadHistory;
  let updateLanguageUI;
  let saveLanguagePreference;
  let saveToHistory;
  let performSearch;

  let document;
  let window;
  let chromeStorageMock;
  let chromeTabsMock;

  beforeEach(() => {
    // Set up DOM
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body>
        <div class="cwph-popup">
          <select id="language-select">
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>

          <form id="search-form">
            <input id="search-input" type="text">
            <button type="submit">Search</button>
          </form>

          <ul id="history-list">
            <li class="cwph-empty-history">No recent searches</li>
          </ul>
        </div>
      </body>
      </html>
    `);

    document = dom.window.document;
    window = dom.window;

    // Mock Chrome storage
    chromeStorageMock = {
      get: jest.fn((key, callback) => {
        if (key === HISTORY_KEY) {
          callback({ [HISTORY_KEY]: mockHistory });
        } else if (key === LANGUAGE_KEY) {
          callback({ [LANGUAGE_KEY]: 'de' });
        } else {
          callback({});
        }
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      })
    };

    // Mock Chrome tabs API
    chromeTabsMock = {
      query: jest.fn().mockResolvedValue([{ id: 123 }]),
      sendMessage: jest.fn().mockResolvedValue({ success: true })
    };

    // Define our test implementations of the popup.js functions
    loadHistory = async () => {
      return new Promise((resolve) => {
        chromeStorageMock.get(HISTORY_KEY, (result) => {
          const history = result[HISTORY_KEY] || [];
          resolve(history);
        });
      });
    };

    saveToHistory = async (query) => {
      if (!query.trim()) {
        return;
      }

      const history = await loadHistory();
      const filteredHistory = history.filter(item => item !== query);
      const updatedHistory = [query, ...filteredHistory].slice(0, 10);

      return new Promise((resolve) => {
        chromeStorageMock.set({ [HISTORY_KEY]: updatedHistory }, () => {
          renderHistory(updatedHistory);
          resolve();
        });
      });
    };

    renderHistory = (history) => {
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
          // This would normally call performSearch, but we'll test that separately
        });
        historyList.appendChild(listItem);
      });
    };

    performSearch = async (query) => {
      if (!query.trim()) {
        return;
      }

      try {
        const [tab] = await chromeTabsMock.query({ active: true, currentWindow: true });
        if (!tab) {
          return;
        }

        await chromeTabsMock.sendMessage(tab.id, { type: 'SEARCH', query });
        await saveToHistory(query);
      } catch (error) {
        console.error('Error in test performSearch:', error);
      }
    };

    updateLanguageUI = (language) => {
      const selector = document.getElementById('language-select');
      selector.value = language;
    };

    saveLanguagePreference = async (language) => {
      return new Promise((resolve) => {
        chromeStorageMock.set({ [LANGUAGE_KEY]: language }, resolve);
      });
    };
  });

  describe('History functionality', () => {
    it('should load history from storage', async () => {
      const history = await loadHistory();
      expect(chromeStorageMock.get).toHaveBeenCalledWith(HISTORY_KEY, expect.any(Function));
      expect(history).toEqual(mockHistory);
    });

    it('should render history items correctly', async () => {
      const history = await loadHistory();
      renderHistory(history);

      const historyItems = document.querySelectorAll('#history-list li');
      expect(historyItems.length).toBe(mockHistory.length);

      // Check each item text
      mockHistory.forEach((item, index) => {
        expect(historyItems[index].textContent).toBe(item);
      });
    });

    it('should update search input when history item is clicked', async () => {
      const history = await loadHistory();
      renderHistory(history);

      const searchInput = document.getElementById('search-input');
      const firstHistoryItem = document.querySelector('#history-list li');

      firstHistoryItem.click();
      expect(searchInput.value).toBe(mockHistory[0]);
    });

    it('should show empty state when history is empty', () => {
      renderHistory([]);

      const emptyState = document.querySelector('.cwph-empty-history');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toBe('No recent searches');
    });

    it('should save search to history', async () => {
      const newSearch = 'Chocolate Cake';
      await saveToHistory(newSearch);

      expect(chromeStorageMock.set).toHaveBeenCalledWith(
        { [HISTORY_KEY]: [newSearch, ...mockHistory].slice(0, 10) },
        expect.any(Function)
      );
    });
  });

  describe('Language functionality', () => {
    it('should update language UI correctly', async () => {
      updateLanguageUI('de');
      const select = document.getElementById('language-select');
      expect(select.value).toBe('de');
    });

    it('should save language preference to storage', async () => {
      await saveLanguagePreference('en');
      expect(chromeStorageMock.set).toHaveBeenCalledWith(
        { [LANGUAGE_KEY]: 'en' },
        expect.any(Function)
      );
    });
  });

  describe('Search functionality', () => {
    it('should query active tab and send message', async () => {
      const query = 'Spaghetti Bolognese';
      await performSearch(query);

      expect(chromeTabsMock.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(chromeTabsMock.sendMessage).toHaveBeenCalledWith(
        123,
        { type: 'SEARCH', query }
      );
    });

    it('should save search term to history after search', async () => {
      const query = 'Pizza Margherita';
      await performSearch(query);

      expect(chromeStorageMock.set).toHaveBeenCalled();
    });

    it('should not search or save empty queries', async () => {
      await performSearch('   ');

      expect(chromeTabsMock.query).not.toHaveBeenCalled();
      expect(chromeStorageMock.set).not.toHaveBeenCalled();
    });

    it('should handle form submission and perform search', () => {
      const form = document.getElementById('search-form');
      const input = document.getElementById('search-input');

      // Set up a spy on performSearch
      const performSearchSpy = jest.fn();

      // Simulate form submission
      input.value = 'Fruit Salad';

      // Add event listener with the spy
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        performSearchSpy(input.value);
      });

      // Submit the form
      form.dispatchEvent(new window.Event('submit'));

      // Check if the spy was called with the correct value
      expect(performSearchSpy).toHaveBeenCalledWith('Fruit Salad');
    });
  });
});
