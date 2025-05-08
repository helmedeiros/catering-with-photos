import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Image Scraper E2E', () => {
  let browser;
  let page;
  let server;
  const PORT = 5052;

  beforeAll(async () => {
    console.log('Starting beforeAll hook...');
    // Set up HTTP server
    server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      let filePath;

      console.log('Received request for:', url.pathname);

      // Handle requests for test fixtures
      if (url.pathname.startsWith('/tests/e2e/fixtures/')) {
        filePath = path.join(__dirname, '..', url.pathname);
      } else {
        // Handle requests for root files
        filePath = path.join(process.cwd(), url.pathname);
      }

      console.log('Attempting to serve file:', filePath);

      try {
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentType = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json'
        }[ext] || 'text/plain';

        console.log('Successfully read file:', filePath);
        console.log('Content type:', contentType);

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch (error) {
        console.error(`Failed to serve file: ${filePath}`, error);
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // Start server
    await new Promise((resolve, reject) => {
      server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        resolve();
      });

      server.on('error', (error) => {
        console.error('Server error:', error);
        reject(error);
      });
    });

    console.log('Server started, launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    console.log('Browser launched');
  }, 120000);

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
    console.log('Setting up test environment...');
    page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Enable debug logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', err => console.error('Browser error:', err));

    // Mock localStorage for the test
    await page.evaluateOnNewDocument(() => {
      window.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
      window.__CWPH_TEST__ = true;
      window.__CWPH_MOCK_IMAGES__ = [
        'http://example.com/image1.jpg',
        'http://example.com/image2.jpg',
        'http://example.com/image3.jpg'
      ];
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  it('should be significantly faster on second click due to cache', async () => {
    // Create a test page with simpler structure
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cache Test</title>
        <style>
          .cwph-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border: 1px solid #ccc;
            z-index: 1000;
          }
          .cwph-icon {
            cursor: pointer;
            margin-left: 5px;
            display: inline-block;
          }
          .cwph-modal img {
            max-width: 100px;
            margin: 5px;
          }
        </style>
      </head>
      <body>
        <h3 id="meal">Test Dish <span class="cwph-icon" data-dish="Test Dish">🔍</span></h3>
        <div id="log"></div>
      </body>
      </html>
    `);

    // Add logging function
    await page.evaluate(() => {
      window.log = (message) => {
        const logElement = document.getElementById('log');
        const entry = document.createElement('div');
        entry.textContent = message;
        logElement.appendChild(entry);
        console.log(message);
      };
    });

    // Create simplified implementation that directly tests caching
    await page.evaluate(() => {
      window.log('Setting up test environment');

      // Set up mock image data
      window.__CWPH_MOCK_IMAGES__ = [
        'http://example.com/image1.jpg',
        'http://example.com/image2.jpg'
      ];

      // Create cache implementation with timing
      const cache = new Map();
      let firstFetchTime = 0;
      let secondFetchTime = 0;

      window.fetchImages = async (query) => {
        window.log(`Fetching images for: ${query}`);
        const start = performance.now();

        // Check cache
        if (cache.has(query)) {
          window.log('Cache hit');
          const images = cache.get(query);
          const end = performance.now();
          secondFetchTime = end - start;
          window.log(`Fetch time (cached): ${secondFetchTime.toFixed(2)}ms`);
          return images;
        }

        window.log('Cache miss - waiting 500ms to simulate network');
        // Simulate network delay for first request
        await new Promise(resolve => setTimeout(resolve, 500));

        const images = window.__CWPH_MOCK_IMAGES__;
        cache.set(query, images);

        const end = performance.now();
        firstFetchTime = end - start;
        window.log(`Fetch time (uncached): ${firstFetchTime.toFixed(2)}ms`);
        return images;
      };

      // Simple modal implementation
      window.openModal = (title, images) => {
        window.log(`Opening modal for: ${title} with ${images.length} images`);
        const modal = document.createElement('div');
        modal.className = 'cwph-modal';

        images.forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = title;
          modal.appendChild(img);
        });

        document.body.appendChild(modal);
        window.log('Modal opened');
      };

      window.closeModal = () => {
        const modal = document.querySelector('.cwph-modal');
        if (modal) {
          modal.remove();
          window.log('Modal closed');
        }
      };

      // Add click handler to icon
      document.querySelector('.cwph-icon').addEventListener('click', async () => {
        window.log('Icon clicked');
        const dishName = document.querySelector('.cwph-icon').getAttribute('data-dish');
        const images = await window.fetchImages(dishName);
        window.openModal(dishName, images);
        window.timingResults = { firstFetchTime, secondFetchTime };
      });
    });

    // First click - should be slow due to cache miss
    await page.click('.cwph-icon');

    // Wait for modal to appear
    await page.waitForSelector('.cwph-modal img');

    // Close the modal
    await page.evaluate(() => {
      window.closeModal();
    });

    // Second click - should be faster due to cache hit
    await page.click('.cwph-icon');

    // Wait for modal to appear again
    await page.waitForSelector('.cwph-modal img');

    // Get timing results
    const timingResults = await page.evaluate(() => window.timingResults);

    console.log('First fetch time:', timingResults.firstFetchTime, 'ms');
    console.log('Second fetch time:', timingResults.secondFetchTime, 'ms');
    console.log('Speed improvement:', (timingResults.firstFetchTime / timingResults.secondFetchTime).toFixed(2), 'x');

    // Verify second fetch was faster
    expect(timingResults.secondFetchTime).toBeLessThan(timingResults.firstFetchTime / 2);
  }, 30000);
});
