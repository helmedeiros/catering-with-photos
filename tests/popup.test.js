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
