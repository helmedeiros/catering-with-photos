/**
 * Waits for a menu element to appear in the DOM
 * @param {Document|Element} root - The root element to observe, defaults to document
 * @param {number} timeout - Maximum time to wait in milliseconds, defaults to 10000
 * @returns {Promise<Element>} The found menu element
 * @throws {Error} If timeout is reached before finding the element
 */
export async function waitForMenu(root = document, timeout = 10000) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const existingElement = root.querySelector('[class^="PlasmicMenuplanmanagement_"]');
    if (existingElement) {
      return resolve(existingElement);
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout waiting for menu element'));
    }, timeout);

    // Create observer
    const observer = new MutationObserver((mutations, obs) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const menuElement = root.querySelector('[class^="PlasmicMenuplanmanagement_"]');
          if (menuElement) {
            clearTimeout(timeoutId);
            obs.disconnect();
            resolve(menuElement);
            return;
          }
        }
      }
    });

    // Start observing
    observer.observe(root, {
      childList: true,
      subtree: true
    });
  });
}
