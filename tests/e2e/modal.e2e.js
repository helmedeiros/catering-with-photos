import { jest } from '@jest/globals';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import http from 'http';

describe('Modal E2E Flow', () => {
  let browser;
  let page;
  let server;

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

    await new Promise((resolve) => {
      server.listen(5050, resolve);
    });

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
  }, 30000);

  afterAll(async () => {
    await browser.close();
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000); // Increase default timeout for all operations

    // Set up test environment flag BEFORE loading the page
    await page.evaluateOnNewDocument(() => {
      window.__CWPH_TEST__ = true;
    });

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
    await page.goto('http://localhost:5050/fixtures/menu.html', {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    // Add script tags to the page
    await page.evaluate(() => {
      const scripts = [
        '/utils/dom-utils.js',
        '/utils/image-scraper.js',
        '/components/modal.js',
        '/content.js'
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

    // Call enhanceMenu() and wait for it to complete
    await page.addScriptTag({
      type: 'module',
      content: `
        import { enhanceMenu } from '/content.js';
        window.enhanceMenu = enhanceMenu;
      `
    });

    await page.evaluate(() => {
      window.enhanceMenu();
    });

    // Wait for the button to be injected with a more specific selector
    await page.waitForSelector('#cwph-add', {
      timeout: 30000,
      visible: true
    });
  }, 30000);

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
    const images = await page.$$('.cwph-modal-images img');
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
  }, 30000);

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
  }, 30000);
});
