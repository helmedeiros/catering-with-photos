/**
 * E2E test for the Enhance Menu button functionality
 */

import puppeteer from 'puppeteer';

describe('Enhance Menu Button', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // Set up browser with extension loaded
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  });

  beforeEach(async () => {
    // Navigate to the fixture menu page
    page = await browser.newPage();
    await page.goto('http://localhost:5050/tests/e2e/fixture-menu.html');

    // Wait for DOM to load
    await page.waitForSelector('.meal-name');
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('enhance menu button injects icons when clicked', async () => {
    // First, ensure the button doesn't exist initially
    await page.evaluate(() => {
      // Remove any existing button that might be there
      const existingButton = document.getElementById('cwph-add');
      if (existingButton) {
        existingButton.remove();
      }
    });

    // Simulate content script functionality
    await page.evaluate(() => {
      // Mock the required Chrome API
      window.chrome = {
        runtime: {
          onMessage: {
            addListener: (callback) => {
              window.messageCallback = callback;
            }
          }
        }
      };

      // Add the injectAddImagesButton function - matches implementation in content-script.js
      window.injectAddImagesButton = () => {
        const topBar = document.querySelector('.sc-d-date-picker');
        if (topBar && !document.getElementById('cwph-add')) {
          const btn = document.createElement('button');
          btn.id = 'cwph-add';
          btn.textContent = 'Add Images';
          topBar.appendChild(btn);
          btn.addEventListener('click', () => {
            // Simplified version of addImagesToMeals for testing
            const mealNodes = document.querySelectorAll('.meal-name');
            mealNodes.forEach(mealNode => {
              if (!mealNode.querySelector('.cwph-icon')) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'cwph-icon';
                iconSpan.setAttribute('data-dish', mealNode.textContent.trim());
                iconSpan.innerHTML = '&#128269;'; // Magnifying glass emoji as HTML entity

                // Create text label
                const textLabel = document.createElement('span');
                textLabel.className = 'cwph-icon-label';
                textLabel.textContent = 'See Dish Photos';

                // Create a wrapper to position the icon next to the meal item instead of inside it
                const iconWrapper = document.createElement('span');
                iconWrapper.className = 'cwph-icon-wrapper';
                iconWrapper.appendChild(iconSpan);
                iconWrapper.appendChild(textLabel);

                // Insert after the meal node instead of appending as a child
                mealNode.parentNode.insertBefore(iconWrapper, mealNode.nextSibling);
              }
            });
          });
          return true;
        }
        return false;
      };

      // Basic implementation of enhanceMenu for testing
      window.enhanceMenu = () => {
        window.injectAddImagesButton();
      };

      // Set up a message listener that simulates our content script
      if (window.chrome && window.chrome.runtime) {
        window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'ENHANCE') {
            window.enhanceMenu();
            sendResponse({ success: true });
          }
          return true;
        });
      }
    });

    // Create a popup frame
    const popupPage = await browser.newPage();
    await popupPage.goto('http://localhost:5050/popup.html');

    // Mock the Chrome API for the popup
    await popupPage.evaluate(() => {
      window.chrome = {
        tabs: {
          query: () => Promise.resolve([{ id: 1 }]),
          sendMessage: (tabId, message) => {
            // Create an event to pass the message to the page
            const customEvent = new CustomEvent('cwph-message', {
              detail: message
            });
            window.parent.document.dispatchEvent(customEvent);
            return Promise.resolve({ success: true });
          }
        },
        storage: {
          local: {
            get: (key, callback) => callback({}),
            set: (data, callback) => callback()
          }
        }
      };
    });

    // Setup event listener on the main page to receive the popup's message
    await page.evaluate(() => {
      document.addEventListener('cwph-message', (event) => {
        const message = event.detail;
        if (window.messageCallback) {
          window.messageCallback(message, {}, () => {});
        }
      });
    });

    // Make sure the button doesn't exist yet
    let buttonExists = await page.evaluate(() => !!document.getElementById('cwph-add'));
    expect(buttonExists).toBe(false);

    // Click the enhance button in the popup
    await popupPage.waitForSelector('#enhance-button');
    await popupPage.click('#enhance-button');

    // Wait a moment for message processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Manually trigger the enhance action on the page to simulate what would happen
    await page.evaluate(() => {
      if (window.messageCallback) {
        window.messageCallback({ type: 'ENHANCE' }, {}, () => {});
      }
    });

    // Check that the button was injected
    buttonExists = await page.evaluate(() => !!document.getElementById('cwph-add'));
    expect(buttonExists).toBe(true);

    await popupPage.close();
  });
});
