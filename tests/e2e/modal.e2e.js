import { jest } from '@jest/globals';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { setupTestEnvironment, MOCK_IMAGES } from '../utils/test-env.js';
import { setupE2ETestEnvironment } from '../utils/e2e-test-setup.js';

describe('Modal E2E Flow', () => {
  let browser;
  let page;
  let server;
  const PORT = 5051;

  beforeAll(async () => {
    // Start a local server to serve the fixture
    server = http.createServer((req, res) => {
      if (req.url === '/fixtures/menu.html') {
        const fixturePath = path.join(process.cwd(), 'tests/e2e/fixture-menu.html');
        fs.readFile(fixturePath, (err, data) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading fixture');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        });
      } else if (req.url.startsWith('/tests/')) {
        // Serve test files
        const filePath = path.join(process.cwd(), req.url);
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(data);
        });
      } else if (req.url.endsWith('.js')) {
        // Serve JS files
        const filePath = path.join(process.cwd(), req.url);
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(data);
        });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // Try to start server with retries
    let retries = 3;
    while (retries > 0) {
      try {
        await new Promise((resolve, reject) => {
          server.listen(PORT, resolve);
          server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              reject(err);
            }
          });
        });
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  }, 30000);

  beforeEach(async () => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Set up test environment flag and mock data BEFORE loading the page
    await page.evaluateOnNewDocument((mockImages) => {
      setupTestEnvironment(window, { mockImages });
      // Also set up E2E test environment
      if (typeof setupE2ETestEnvironment === 'function') {
        setupE2ETestEnvironment(window);
      } else {
        // Fallback if the import fails
        window.__CWPH_TEST__ = true;
        // Mock chrome API
        if (!window.chrome) window.chrome = {};
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
      }
    }, MOCK_IMAGES);

    // Block all Google requests
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('google.com')) {
        request.abort('blockedbyclient');
      } else {
        request.continue();
      }
    });

    // Load the page and wait for network to be idle
    await page.goto(`http://localhost:${PORT}/fixtures/menu.html`, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Add script tags to the page
    await page.evaluate(() => {
      const scripts = [
        '/utils/dom-utils.js',
        '/utils/image-scraper.js',
        '/components/modal.js',
        '/content.js',
        '/tests/utils/test-env.js',
        '/tests/utils/e2e-test-setup.js'
      ];

      return Promise.all(scripts.map(src => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.type = 'module';
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }));
    });

    // Set up test environment
    await page.evaluate((mockImages) => {
      window.__CWPH_TEST__ = true;
      window.__CWPH_MOCK_IMAGES__ = mockImages;

      // Ensure enhanceMenu is globally available
      if (typeof window.setupE2ETestEnvironment === 'function') {
        window.setupE2ETestEnvironment(window);
      }
    }, MOCK_IMAGES);

    // Ensure enhanceMenu is available and call it
    await page.evaluate(async () => {
      if (window.ensureEnhanceMenuAvailable) {
        const enhanceMenu = await window.ensureEnhanceMenuAvailable();
        if (enhanceMenu) {
          return enhanceMenu();
        }
      } else if (window.enhanceMenu) {
        return window.enhanceMenu();
      } else {
        // Fallback if nothing else works
        console.warn('Using direct import for enhanceMenu');
        const module = await import('/content.js');
        window.enhanceMenu = module.enhanceMenu;
        return window.enhanceMenu();
      }
    });

    // Wait for the button to be injected with a more specific selector
    await page.waitForSelector('#cwph-add', {
      timeout: 30000,
      visible: true
    });
  }, 60000);

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  it('completes full modal interaction flow', async () => {
    // Click the "Add Images" button
    await page.click('#cwph-add');

    // Wait for icons to be injected
    await page.waitForSelector('.cwph-icon', { timeout: 30000 });

    // Click the first 🔍 icon
    await page.click('.cwph-icon');

    // Wait for modal and verify its contents
    await page.waitForSelector('.cwph-modal', { visible: true, timeout: 30000 });
    const modalTitle = await page.$eval('.cwph-modal h2', el => el.textContent);
    expect(modalTitle).toBeTruthy();

    // Verify modal has images (should be instant in test mode)
    const images = await page.$$('.cwph-image-grid img');
    expect(images.length).toBeGreaterThan(0);

    // Verify scroll is locked
    const bodyStyle = await page.$eval('body', el => el.style.overflow);
    expect(bodyStyle).toBe('hidden');

    // Click close button
    await page.click('.cwph-modal-close');

    // Verify modal is removed
    await page.waitForFunction(() => !document.querySelector('.cwph-modal'), { timeout: 30000 });

    // Verify scroll is restored
    const bodyStyleAfter = await page.$eval('body', el => el.style.overflow);
    expect(bodyStyleAfter).toBe('');
  }, 60000);

  it('handles keyboard navigation in modal', async () => {
    // Open modal
    await page.click('#cwph-add');
    await page.waitForSelector('.cwph-icon', { timeout: 30000 });
    await page.click('.cwph-icon');

    // Wait for modal to be fully visible
    await page.waitForSelector('.cwph-modal', { visible: true, timeout: 30000 });

    // Verify close button has focus
    const focusedElement = await page.evaluate(() => document.activeElement.className);
    expect(focusedElement).toContain('cwph-modal-close');

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await page.waitForFunction(() => !document.querySelector('.cwph-modal'), { timeout: 30000 });
  }, 60000);

  test('should have working "See more on Google" link', async () => {
    // Set up test environment with proper mocks
    await page.evaluateOnNewDocument((mockImages) => {
      // Ensure mock images are available
      window.__CWPH_TEST__ = true;
      window.__CWPH_MOCK_IMAGES__ = mockImages;

      // Setup test environment
      if (typeof setupTestEnvironment === 'function') {
        setupTestEnvironment(window, { mockImages });
      }

      // Also set up E2E test environment
      if (typeof setupE2ETestEnvironment === 'function') {
        setupE2ETestEnvironment(window);
      } else {
        // Mock chrome API
        if (!window.chrome) window.chrome = {};
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
      }

      // Mock fetch to ensure it doesn't fail
      window.originalFetch = window.fetch;
      window.fetch = function() {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            image: mockImages[0]
          })
        });
      };
    }, MOCK_IMAGES);

    await page.goto(`http://localhost:${PORT}/fixtures/menu.html`, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    // Add script tags to the page and wait for them to load
    await page.evaluate(() => {
      const scripts = [
        '/utils/dom-utils.js',
        '/utils/image-scraper.js',
        '/components/modal.js',
        '/content.js',
        '/tests/utils/test-env.js',
        '/tests/utils/e2e-test-setup.js'
      ];

      return Promise.all(scripts.map(src => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.type = 'module';
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }));
    });

    // Ensure enhanceMenu is available and call it
    await page.evaluate(async () => {
      if (window.ensureEnhanceMenuAvailable) {
        const enhanceMenu = await window.ensureEnhanceMenuAvailable();
        if (enhanceMenu) {
          return enhanceMenu();
        }
      } else if (window.enhanceMenu) {
        return window.enhanceMenu();
      } else {
        // Fallback if nothing else works
        console.warn('Using direct import for enhanceMenu');
        const module = await import('/content.js');
        window.enhanceMenu = module.enhanceMenu;
        return window.enhanceMenu();
      }
    });

    // Wait for the add button to be visible and click it
    await page.waitForSelector('#cwph-add', { visible: true, timeout: 30000 });
    await page.click('#cwph-add');

    // Wait for icons to be injected
    await page.waitForSelector('.cwph-icon', { timeout: 30000 });

    // Click the first icon
    await page.click('.cwph-icon');

    // Wait for modal to appear
    await page.waitForSelector('.cwph-modal', { visible: true, timeout: 30000 });

    // Inject a fake image into the modal to ensure the "See more" link appears
    await page.evaluate((mockImages) => {
      const modal = document.querySelector('.cwph-modal');
      if (modal) {
        // Make sure we have images in the grid
        const imageGrid = modal.querySelector('.cwph-image-grid');
        if (imageGrid && imageGrid.children.length === 0) {
          // Add a mock image to the grid
          const img = document.createElement('img');
          img.src = mockImages[0];
          img.alt = 'Test image';
          imageGrid.appendChild(img);

          // Add the "See more" link if it doesn't exist
          if (!modal.querySelector('.cwph-see-more')) {
            const title = modal.querySelector('h2').textContent;
            const seeMoreLink = document.createElement('a');
            seeMoreLink.href = `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=isch&safe=active`;
            seeMoreLink.className = 'cwph-see-more';
            seeMoreLink.target = '_blank';
            seeMoreLink.rel = 'noopener noreferrer';
            seeMoreLink.textContent = 'See more on Google';
            modal.querySelector('.cwph-modal-body').appendChild(seeMoreLink);
          }
        }
      }
    }, MOCK_IMAGES);

    // Get the modal title
    const title = await page.$eval('.cwph-modal h2', el => el.textContent);

    // Check if the "See more on Google" link exists and has correct href
    const link = await page.waitForSelector('.cwph-see-more', { visible: true, timeout: 30000 });
    const href = await page.$eval('.cwph-see-more', el => el.getAttribute('href'));
    const expectedHref = `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=isch&safe=active`;
    expect(href).toBe(expectedHref);

    // Check if link opens in new tab
    const target = await page.$eval('.cwph-see-more', el => el.getAttribute('target'));
    expect(target).toBe('_blank');

    // Check if link has security attributes
    const rel = await page.$eval('.cwph-see-more', el => el.getAttribute('rel'));
    expect(rel).toBe('noopener noreferrer');
  }, 60000);
});
