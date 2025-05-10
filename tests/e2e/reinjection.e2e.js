import { setupE2ETestEnvironment } from '../utils/e2e-test-setup.js';

describe('E2E: Show dishes button reinjection (S1-5)', () => {
  beforeAll(async () => {
    // Set up the necessary Chrome API mocks before navigating
    await page.evaluateOnNewDocument(() => {
      // Set up test environment
      window.__CWPH_TEST__ = true;

      // Mock chrome API
      if (!window.chrome) {
        window.chrome = {};
      }

      // Ensure chrome.runtime.onMessage is available
      if (!window.chrome.runtime) {
        window.chrome.runtime = {
          onMessage: {
            addListener: function(callback) {
              window.__messageListeners = window.__messageListeners || [];
              window.__messageListeners.push(callback);
            }
          }
        };
      }

      // Mock chrome.scripting for insertCSS
      if (!window.chrome.scripting) {
        window.chrome.scripting = {
          insertCSS: function() {
            return Promise.resolve();
          }
        };
      }
    });

    await page.goto('http://localhost:5050/tests/e2e/fixture-menu.html');

    // Ensure enhanceMenu is properly exposed
    await page.addScriptTag({
      type: 'module',
      content: `
        import { enhanceMenu } from '/content.js';
        window.enhanceMenu = enhanceMenu;

        // Ensure it gets called
        if (!document.getElementById('cwph-add')) {
          window.enhanceMenu();
        }
      `
    });
  });

  it('shows Show dishes button after menu loads', async () => {
    await page.waitForSelector('#cwph-add', { timeout: 2000 });
    const btnText = await page.$eval('#cwph-add', el => el.textContent);
    expect(btnText).toBe('Show dishes');
  });

  it('re-injects Show dishes button after menu DOM is replaced', async () => {
    // Remove the button and menu, then add a new menu node
    await page.evaluate(() => {
      document.getElementById('cwph-add')?.remove();
      const oldMenu = document.querySelector('.PlasmicMenuplanmanagement_menu');
      if (oldMenu) oldMenu.remove();
      const newMenu = document.createElement('div');
      newMenu.className = 'PlasmicMenuplanmanagement_newmenu';
      document.getElementById('root').appendChild(newMenu);
    });
    // Wait for reinjection
    await page.waitForSelector('#cwph-add', { timeout: 2000 });
    const btnText = await page.$eval('#cwph-add', el => el.textContent);
    expect(btnText).toBe('Show dishes');

    // Verify button is present again
    await page.waitForSelector('#cwph-add', { timeout: 5000 });
    const btnTextAgain = await page.$eval('#cwph-add', el => el.textContent);
    expect(btnTextAgain).toBe('Show dishes');
  });
});
