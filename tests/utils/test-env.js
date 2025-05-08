/**
 * Test environment utilities for handling test-specific setup and mocks
 */

// Mock data for tests
export const MOCK_IMAGES = [
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
];

/**
 * Sets up the test environment with necessary flags and mock data
 * @param {Window} window - The window object to modify
 * @param {Object} options - Configuration options
 * @param {string[]} [options.mockImages] - Mock images to use in test environment
 */
export function setupTestEnvironment(window, { mockImages = MOCK_IMAGES } = {}) {
  window.__CWPH_TEST__ = true;
  window.__CWPH_MOCK_IMAGES__ = mockImages;
}

/**
 * Test version of waitForMenu that resolves immediately
 * @param {Document|Element} root - The root element to observe, defaults to document
 * @returns {Promise<Element>} The found menu element or a new div element
 */
export function waitForMenuTest(root = document) {
  return Promise.resolve(root.querySelector('[class^="PlasmicMenuplanmanagement_"]') || document.createElement('div'));
}

/**
 * Injects styles for testing environment
 * @param {Window} window - The window object to modify
 * @param {string[]} styleFiles - Array of style file paths to inject
 * @returns {Promise<void>}
 */
export async function injectStylesForTesting(window, styleFiles) {
  try {
    const styles = await Promise.all(
      styleFiles.map(file => fetch(file).then(r => r.text()))
    );
    const style = window.document.createElement('style');
    style.textContent = styles.join('\n');
    window.document.head.appendChild(style);
  } catch (error) {
    console.error('Error injecting styles for testing:', error);
  }
}
