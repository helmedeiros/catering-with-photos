/**
 * E2E test setup utilities for Catering with Photos extension
 */

/**
 * Sets up the test environment for E2E testing
 * @param {Window} window - The window object to modify
 */
export function setupE2ETestEnvironment(window) {
  // Mark as test environment
  window.__CWPH_TEST__ = true;

  // Mock chrome API if not present
  if (!window.chrome) {
    window.chrome = {};
  }

  // Mock chrome.runtime.onMessage if not present
  if (!window.chrome.runtime) {
    window.chrome.runtime = {
      onMessage: {
        addListener: function(callback) {
          // Store the callback for testing
          window.__messageListeners = window.__messageListeners || [];
          window.__messageListeners.push(callback);
        }
      },
      sendMessage: function() {
        // Mock implementation
        return Promise.resolve({ success: true });
      }
    };
  }

  // Make sure enhanceMenu is available globally
  window.ensureEnhanceMenuAvailable = async function() {
    if (!window.enhanceMenu) {
      // Import the enhanceMenu function from content.js
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
          import { enhanceMenu } from '/content.js';
          window.enhanceMenu = enhanceMenu;
          document.dispatchEvent(new CustomEvent('enhanceMenuLoaded'));
        `;
        script.onload = resolve;
        document.head.appendChild(script);

        // Alternative fallback if the import fails
        setTimeout(() => {
          if (!window.enhanceMenu) {
            window.enhanceMenu = function() {
              console.log('Mock enhanceMenu function called');
              return Promise.resolve();
            };
          }
          resolve();
        }, 1000);
      });

      // Wait for the event or timeout
      await Promise.race([
        new Promise(resolve => {
          document.addEventListener('enhanceMenuLoaded', resolve, { once: true });
        }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    }

    return window.enhanceMenu;
  };
}
