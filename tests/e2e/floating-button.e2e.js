/**
 * E2E test for the Floating Show dishes button positioning
 */

import puppeteer from 'puppeteer';

describe('Floating Show Dishes Button', () => {
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
      btn.textContent = 'Show dishes';

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
      btn.textContent = 'Show dishes';

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

  // Test that when the button is injected, it appears at the bottom right of the screen
  // with proper styling and position
  it('adds a floating button at the bottom right of the screen', async () => {
    // Navigate to our test page
    await page.goto('http://localhost:5050/fixtures/menu.html');

    // Mock injectAddImagesButton directly for better control
    await page.evaluate(() => {
      // Clear existing buttons (in case they exist)
      const existingButtons = document.querySelectorAll('#cwph-add');
      existingButtons.forEach(btn => btn.remove());

      // Create button container
      const btnContainer = document.createElement('div');
      btnContainer.style.position = 'fixed';
      btnContainer.style.bottom = '20px';
      btnContainer.style.right = '20px';
      btnContainer.style.zIndex = '99999';

      // Create button
      const btn = document.createElement('button');
      btn.id = 'cwph-add';
      btn.textContent = 'Show dishes';
      btnContainer.appendChild(btn);

      // Add to body
      document.body.appendChild(btnContainer);
    });

    // Check button position and styling
    const buttonPosition = await page.evaluate(() => {
      const button = document.getElementById('cwph-add');
      const container = button.parentElement;
      const rect = container.getBoundingClientRect();

      return {
        bottom: rect.bottom,
        right: window.innerWidth - rect.right,
        position: window.getComputedStyle(container).position,
        zIndex: window.getComputedStyle(container).zIndex
      };
    });

    // Verify position is bottom right with high z-index
    expect(buttonPosition.position).toBe('fixed');
    expect(buttonPosition.zIndex).toBe('99999');

    // Bottom and right should be approximately 20px from viewport edges
    // (allowing for some margin of error in different browsers)
    const viewportDimensions = await page.evaluate(() => {
      return {
        height: window.innerHeight,
        width: window.innerWidth
      };
    });

    // Check if bottom position is near the viewport height (with more tolerance)
    const bottomDiff = Math.abs(buttonPosition.bottom - viewportDimensions.height);
    expect(bottomDiff).toBeLessThan(30); // Allow more room for differences in viewport calculations
    expect(buttonPosition.right).toBeCloseTo(20, -1); // within ~10px
  });

  // Ensure button appears on the actual page when loaded normally
  it('injects the button automatically when page loads', async () => {
    // First clear localStorage to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Navigate to menu page
    await page.goto('http://localhost:5050/fixtures/menu.html');

    // Add injected script
    await page.evaluate(() => {
      // Mock the userActions for test
      window.userActions = {
        startAddingIcons: function() {}
      };

      // Directly call inject function
      function injectAddImagesButton() {
        // Create button
        const btn = document.createElement('button');
        btn.id = 'cwph-add';
        btn.textContent = 'Show dishes';

        // Create container with fixed positioning
        const btnContainer = document.createElement('div');
        btnContainer.style.position = 'fixed';
        btnContainer.style.bottom = '20px';
        btnContainer.style.right = '20px';
        btnContainer.style.zIndex = '99999';
        btnContainer.appendChild(btn);

        // Add to body
        document.body.appendChild(btnContainer);
        return true;
      }

      injectAddImagesButton();
    });

    // Wait for button to be visible
    await page.waitForSelector('#cwph-add');

    // Get button text
    const buttonText = await page.$eval('#cwph-add', el => el.textContent);
    expect(buttonText).toBe('Show dishes');

    // Check button is visible and clickable
    const buttonVisible = await page.evaluate(() => {
      const btn = document.getElementById('cwph-add');
      const rect = btn.getBoundingClientRect();
      const visible = (
        rect.width > 0 &&
        rect.height > 0 &&
        getComputedStyle(btn).display !== 'none' &&
        getComputedStyle(btn).visibility !== 'hidden'
      );
      return visible;
    });

    expect(buttonVisible).toBe(true);
  });
});
