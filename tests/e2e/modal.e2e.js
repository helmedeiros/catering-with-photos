import { jest } from '@jest/globals';
import puppeteer from 'puppeteer';

describe('Modal E2E Flow', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:5050/fixtures/menu.html');
  });

  afterEach(async () => {
    await page.close();
  });

  it('completes full modal interaction flow', async () => {
    // Wait for and click the "Add Images" button
    await page.waitForSelector('#cwph-add');
    await page.click('#cwph-add');

    // Wait for and verify 🔍 icons are present
    await page.waitForSelector('.cwph-icon');
    const icons = await page.$$('.cwph-icon');
    expect(icons.length).toBeGreaterThan(0);

    // Click the first 🔍 icon
    await icons[0].click();

    // Wait for modal to appear and verify its contents
    await page.waitForSelector('.cwph-modal');
    const modalTitle = await page.$eval('.cwph-modal h2', el => el.textContent);
    expect(modalTitle).toBeTruthy();

    // Verify modal has images
    const images = await page.$$('.cwph-modal-images img');
    expect(images.length).toBeGreaterThan(0);

    // Verify scroll is locked
    const bodyStyle = await page.$eval('body', el => el.style.overflow);
    expect(bodyStyle).toBe('hidden');

    // Click close button
    await page.click('.cwph-modal-close');

    // Verify modal is removed
    await page.waitForFunction(() => !document.querySelector('.cwph-modal'));

    // Verify scroll is restored
    const bodyStyleAfter = await page.$eval('body', el => el.style.overflow);
    expect(bodyStyleAfter).toBe('');
  }, 15000);

  it('handles keyboard navigation in modal', async () => {
    // Open modal
    await page.waitForSelector('#cwph-add');
    await page.click('#cwph-add');
    await page.waitForSelector('.cwph-icon');
    await page.click('.cwph-icon');

    // Wait for modal
    await page.waitForSelector('.cwph-modal');

    // Verify close button has focus
    const focusedElement = await page.evaluate(() => document.activeElement.className);
    expect(focusedElement).toContain('cwph-modal-close');

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await page.waitForFunction(() => !document.querySelector('.cwph-modal'));
  }, 15000);
});
