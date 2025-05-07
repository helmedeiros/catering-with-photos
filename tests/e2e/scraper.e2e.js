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
  const PORT = 5050;

  beforeAll(async () => {
    console.log('Starting beforeAll hook...');
    // Set up HTTP server
    server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      let filePath;

      console.log('Received request for:', url.pathname);

      // Handle requests for test fixtures
      if (url.pathname.startsWith('/tests/e2e/fixtures/')) {
        filePath = path.join(__dirname, url.pathname);
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
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  // Placeholder test to keep the test suite valid
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
