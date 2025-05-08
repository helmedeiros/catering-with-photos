import { jest } from '@jest/globals';
import { injectAddImagesButton, injectButtonStyles, enhanceMenu } from '../content.js';
import { injectStylesForTesting } from './utils/test-env.js';

// Mock chrome API
global.chrome = {
  scripting: {
    insertCSS: jest.fn()
  }
};

// Mock fetch for style files
global.fetch = jest.fn().mockImplementation((url) => {
  if (url === 'styles/button.css') {
    return Promise.resolve({
      text: () => Promise.resolve(`
        #cwph-add {
          border-radius: 4px;
        }
      `)
    });
  }
  if (url === 'styles/icon.css') {
    return Promise.resolve({
      text: () => Promise.resolve(`
        .cwph-icon {
          cursor: pointer;
          margin-left: 4px;
        }
      `)
    });
  }
  return Promise.reject(new Error('Not found'));
});

describe('content.js', () => {
  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = `
      <div class="sc-d-date-picker"></div>
      <div class="PlasmicMenuplanmanagement_container">
        <div class="meal-name">Pasta</div>
        <div class="meal-name">Salad</div>
      </div>
    `;
  });

  describe('injectAddImagesButton', () => {
    it('injects button into top bar', () => {
      injectAddImagesButton();
      const btn = document.getElementById('cwph-add');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('Add Images');
    });

    it('does not inject duplicate buttons', () => {
      injectAddImagesButton();
      injectAddImagesButton();
      const buttons = document.querySelectorAll('#cwph-add');
      expect(buttons.length).toBe(1);
    });

    it('adds click handler that injects icons', () => {
      injectAddImagesButton();
      const btn = document.getElementById('cwph-add');
      btn.click();
      const icons = document.querySelectorAll('.cwph-icon');
      expect(icons.length).toBe(2);
      expect(icons[0].textContent).toBe('🔍');
      expect(icons[0].getAttribute('data-dish')).toBe('Pasta');
    });
  });

  describe('injectButtonStyles', () => {
    it('uses chrome.scripting.insertCSS in extension context', async () => {
      await injectButtonStyles();
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 0 },
        files: ['styles/button.css', 'styles/icon.css']
      });
    });

    it('applies button styles with border-radius', async () => {
      await injectStylesForTesting(window, ['styles/button.css']);
      injectAddImagesButton();
      const btn = document.getElementById('cwph-add');
      const style = window.getComputedStyle(btn);
      expect(style.borderRadius).toBe('4px');
    });

    it('applies icon styles correctly', async () => {
      await injectStylesForTesting(window, ['styles/icon.css']);
      injectAddImagesButton();
      const btn = document.getElementById('cwph-add');
      btn.click();
      const icon = document.querySelector('.cwph-icon');
      const style = window.getComputedStyle(icon);
      expect(style.cursor).toBe('pointer');
      expect(style.marginLeft).toBe('4px');
    });
  });

  describe('enhanceMenu', () => {
    it('injects button and styles', async () => {
      await enhanceMenu();
      const btn = document.getElementById('cwph-add');
      expect(btn).toBeTruthy();
      expect(chrome.scripting.insertCSS).toHaveBeenCalled();
    });

    it('handles missing menu gracefully', async () => {
      document.body.innerHTML = '<div>No menu here</div>';
      await expect(enhanceMenu()).resolves.not.toThrow();
    }, 15000);

    it('re-injects button when menu is updated', async () => {
      await enhanceMenu();
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);

      const newMenu = document.createElement('div');
      newMenu.className = 'PlasmicMenuplanmanagement_container';
      root.appendChild(newMenu);

      // Wait for mutation observer
      await new Promise(resolve => setTimeout(resolve, 0));

      const btn = document.getElementById('cwph-add');
      expect(btn).toBeTruthy();
    });
  });
});
