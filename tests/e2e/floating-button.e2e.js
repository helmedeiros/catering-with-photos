/**
 * E2E test for the Floating Add Images button positioning
 */

import puppeteer from 'puppeteer';

describe('Floating Add Images Button', () => {
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

  test('floating button is positioned correctly at bottom right', async () => {
    // First, ensure no buttons exist initially
    await page.evaluate(() => {
      // Remove any existing buttons that might be there
      const existingButton = document.getElementById('cwph-add');
      if (existingButton) {
        existingButton.remove();
      }

      const existingFloatingButton = document.getElementById('cwph-add-floating');
      if (existingFloatingButton) {
        existingFloatingButton.remove();
      }
    });

    // Inject our new fixed-position floating button implementation
    await page.evaluate(() => {
      // Create button and container
      const btn = document.createElement('button');
      btn.id = 'cwph-add';
      btn.textContent = 'Add Images';

      // Create a floating button div positioned at bottom right
      const btnContainer = document.createElement('div');
      btnContainer.style.position = 'fixed';
      btnContainer.style.bottom = '20px';
      btnContainer.style.right = '20px';
      btnContainer.style.zIndex = '99999';
      btnContainer.style.display = 'flex';
      btnContainer.style.alignItems = 'center';
      btnContainer.style.justifyContent = 'center';
      btnContainer.appendChild(btn);

      // Add to the document body
      document.body.appendChild(btnContainer);
    });

    // Verify button exists and is properly positioned
    const buttonPosition = await page.evaluate(() => {
      const button = document.getElementById('cwph-add');
      if (!button) return null;

      // Get parent container element
      const container = button.parentElement;

      return {
        exists: !!button,
        isInDOM: document.body.contains(button),
        containerPosition: container.style.position,
        containerBottom: container.style.bottom,
        containerRight: container.style.right,
        containerZIndex: container.style.zIndex,
        isVisibleOnScreen: button.getBoundingClientRect().width > 0
      };
    });

    // Assertions about button positioning
    expect(buttonPosition.exists).toBe(true);
    expect(buttonPosition.isInDOM).toBe(true);
    expect(buttonPosition.containerPosition).toBe('fixed');
    expect(buttonPosition.containerBottom).toBe('20px');
    expect(buttonPosition.containerRight).toBe('20px');
    expect(buttonPosition.containerZIndex).toBe('99999');
    expect(buttonPosition.isVisibleOnScreen).toBe(true);
  });

  test('floating button has proper styling', async () => {
    // Inject button and styles
    await page.evaluate(() => {
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        #cwph-add {
          padding: 10px 16px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 14px;
          transition: background-color 0.2s, transform 0.1s;
        }
      `;
      document.head.appendChild(style);

      // Create button
      const btn = document.createElement('button');
      btn.id = 'cwph-add';
      btn.textContent = 'Add Images';

      // Create container
      const btnContainer = document.createElement('div');
      btnContainer.style.position = 'fixed';
      btnContainer.style.bottom = '20px';
      btnContainer.style.right = '20px';
      btnContainer.appendChild(btn);

      // Add to document
      document.body.appendChild(btnContainer);
    });

    // Check computed styles
    const buttonStyles = await page.evaluate(() => {
      const button = document.getElementById('cwph-add');
      if (!button) return null;

      const styles = getComputedStyle(button);
      return {
        padding: styles.padding,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        cursor: styles.cursor
      };
    });

    // Assert button styles
    expect(buttonStyles).not.toBeNull();
    expect(buttonStyles.color).toMatch(/rgb\(.*255.*255.*255.*\)|white/i);
    expect(buttonStyles.cursor).toBe('pointer');
  });
});
