/**
 * Test for content.js functionality
 */
import { jest } from '@jest/globals';

describe('content.js', () => {
  let content;

  beforeEach(async () => {
    // Clean up between tests
    jest.resetModules();

    // Mock document body for DOM manipulation tests
    document.body.innerHTML = '';

    // Import the content module
    content = await import('../content.js');
  });

  // Test the exports
  it('exports the expected functions', () => {
    // Verify the module exports all required functions
    expect(typeof content.injectAddImagesButton).toBe('function');
    expect(typeof content.injectButtonStyles).toBe('function');
    expect(typeof content.enhanceMenu).toBe('function');
    expect(typeof content.handleSearch).toBe('function');
    expect(typeof content.openModal).toBe('function');
    expect(typeof content.closeModal).toBe('function');
    expect(typeof content.waitForMenu).toBe('function');
    expect(typeof content.fetchImages).toBe('function');
  });

  // Test that conversion works correctly
  it('imports fetchImages from image-scraper', async () => {
    // We should see import in the source code
    const fs = await import('fs');
    const path = await import('path');

    const contentJs = fs.readFileSync(path.resolve('content.js'), 'utf8');
    expect(contentJs).toContain("import { fetchImages } from './utils/image-scraper.js'");
  });

  // Test the new floating button implementation
  it('creates a fixed-position floating button', () => {
    // Call the inject button function
    content.injectAddImagesButton();

    // Verify the button was created and properly positioned
    const button = document.getElementById('cwph-add');
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Add Images');

    // Check that the container has the right positioning styles
    const container = button.parentElement;
    expect(container.style.position).toBe('fixed');
    expect(container.style.bottom).toBe('20px');
    expect(container.style.right).toBe('20px');
    expect(container.style.zIndex).toBe('99999');
  });
});
