// content-script.js - Module version of the content script
import { waitForMenu } from './utils/dom-utils.js';
import { openModal, closeModal } from './components/modal.js';
import { fetchImages } from './utils/image-scraper.js';

// Debug info
console.log('Catering with Photos extension loaded');

// Cache functions
function getCachedImages(query) {
  try {
    const cacheData = localStorage.getItem('cwph-cache');
    if (!cacheData) return null;

    const cache = JSON.parse(cacheData);
    const record = cache[query];

    if (!record) return null;

    // Check if expired (30 days)
    const now = Date.now();
    if (now - record.timestamp > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return record.images;
  } catch (error) {
    console.error('Error getting cached images:', error);
    return null;
  }
}

function setCachedImages(query, images) {
  try {
    const cacheData = localStorage.getItem('cwph-cache');
    const cache = cacheData ? JSON.parse(cacheData) : {};

    cache[query] = {
      images,
      timestamp: Date.now()
    };

    localStorage.setItem('cwph-cache', JSON.stringify(cache));
  } catch (error) {
    console.error('Error setting cached images:', error);
  }
}

// Main functions from content.js
function injectAddImagesButton() {
  console.log('Trying to inject Add Images button...');

  // Log all potential containers to help diagnose
  const allDivs = Array.from(document.querySelectorAll('div')).slice(0, 20);
  console.log('First 20 divs on page:', allDivs.map(div => ({
    className: div.className,
    id: div.id,
    children: div.children.length
  })));

  const topBar = document.querySelector('.sc-d-date-picker');
  console.log('Found top bar?', !!topBar);

  if (topBar && !document.getElementById('cwph-add')) {
    console.log('Injecting button into top bar');
    const btn = document.createElement('button');
    btn.id = 'cwph-add';
    btn.textContent = 'Add Images';
    topBar.appendChild(btn);
    btn.addEventListener('click', () => {
      const mealNodes = document.querySelectorAll('.PlasmicMenuplanmanagement_container .meal-name');
      mealNodes.forEach(mealNode => {
        if (!mealNode.querySelector('.cwph-icon')) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'cwph-icon';
          iconSpan.setAttribute('data-dish', mealNode.textContent.trim());
          iconSpan.textContent = '🔍';
          mealNode.appendChild(iconSpan);
        }
      });
    });
    return true;
  } else {
    // Try alternative methods if the top bar is not found
    console.log('Top bar not found, trying alternative methods');

    // Try to find a header or navigation element
    const possibleContainers = [
      document.querySelector('header'),
      document.querySelector('nav'),
      document.querySelector('.header'),
      document.querySelector('.navigation'),
      // Add other potential elements
      document.querySelector('body') // Last resort - add to body
    ];

    for (const container of possibleContainers) {
      if (container && !document.getElementById('cwph-add')) {
        console.log('Injecting button into alternative container', container);
        const btn = document.createElement('button');
        btn.id = 'cwph-add';
        btn.textContent = 'Add Images';
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '9999';
        container.appendChild(btn);
        btn.addEventListener('click', () => {
          const mealNodes = document.querySelectorAll('.PlasmicMenuplanmanagement_container .meal-name');
          mealNodes.forEach(mealNode => {
            if (!mealNode.querySelector('.cwph-icon')) {
              const iconSpan = document.createElement('span');
              iconSpan.className = 'cwph-icon';
              iconSpan.setAttribute('data-dish', mealNode.textContent.trim());
              iconSpan.textContent = '🔍';
              mealNode.appendChild(iconSpan);
            }
          });
        });
        return true;
      }
    }
  }

  console.log('Failed to inject button');
  return false;
}

function injectButtonStyles() {
  if (window.chrome && chrome.scripting && chrome.scripting.insertCSS) {
    chrome.scripting.insertCSS({
      target: { tabId: 0 },
      files: ['styles/button.css', 'styles/icon.css']
    });
  }
}

async function enhanceMenu() {
  try {
    console.log('Enhancing menu...');

    // Log the entire document structure for debugging
    console.log('Document structure:', {
      title: document.title,
      url: window.location.href,
      bodyChildren: document.body.children.length
    });

    // Don't wait for the menu if it might not be present
    try {
      await waitForMenu(document, 5000); // Shorter timeout
      console.log('Menu element found');
    } catch (e) {
      console.log('Menu waiting timed out, continuing anyway');
    }

    injectButtonStyles();
    const buttonInjected = injectAddImagesButton();

    if (!buttonInjected) {
      console.log('Could not inject button automatically. Adding a floating button.');
      // Create a floating button as a last resort
      const floatingBtn = document.createElement('button');
      floatingBtn.textContent = 'Add Images';
      floatingBtn.id = 'cwph-add-floating';
      floatingBtn.style.position = 'fixed';
      floatingBtn.style.bottom = '20px';
      floatingBtn.style.right = '20px';
      floatingBtn.style.zIndex = '10000';
      floatingBtn.style.padding = '10px 15px';
      floatingBtn.style.backgroundColor = '#4285f4';
      floatingBtn.style.color = 'white';
      floatingBtn.style.border = 'none';
      floatingBtn.style.borderRadius = '4px';
      floatingBtn.style.cursor = 'pointer';
      floatingBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

      floatingBtn.addEventListener('click', () => {
        const mealNodes = document.querySelectorAll('.PlasmicMenuplanmanagement_container .meal-name');
        mealNodes.forEach(mealNode => {
          if (!mealNode.querySelector('.cwph-icon')) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'cwph-icon';
            iconSpan.setAttribute('data-dish', mealNode.textContent.trim());
            iconSpan.textContent = '🔍';
            mealNode.appendChild(iconSpan);
          }
        });
      });

      document.body.appendChild(floatingBtn);
    }

    // Set up mutation observer to watch for DOM changes
    const root = document.getElementById('root');
    if (root) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (
              node.nodeType === 1 &&
              node.className &&
              typeof node.className === 'string' &&
              node.className.startsWith('PlasmicMenuplanmanagement_') &&
              !document.getElementById('cwph-add')
            ) {
              console.log('Menu changed, reinjecting button');
              injectAddImagesButton();
              return;
            }
          }
        }
      });
      observer.observe(root, { childList: true, subtree: true });

      // Store observer reference for cleanup in tests
      if (typeof window !== 'undefined' && window.__CWPH_TEST__) {
        root.__observer = observer;
      }
    }

    console.log('Menu enhancement complete');
  } catch (e) {
    console.error('Menu enhancement failed:', e);
  }
}

async function handleSearch(query) {
  if (!query || !query.trim()) {
    return;
  }

  try {
    const images = await fetchImages(query);
    if (images.length === 0) {
      openModal(query, [], 'No images found for this search term.');
    } else {
      openModal(query, images);
    }
  } catch (error) {
    openModal(query, [], 'Unable to load images. Please check your internet connection and try again.');
  }
}

// Log page structure for debugging
const hasMenu = !!document.querySelector('[class^="PlasmicMenuplanmanagement_"]');
const hasTopBar = !!document.querySelector('.sc-d-date-picker');
console.log('Page compatibility check:', {
  hasMenu,
  hasTopBar,
  url: window.location.href
});

// Make sure we can trigger enhancement manually from the console
window.cwphEnhanceMenu = enhanceMenu;

// For extension use, auto-run when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, enhancing menu');
    enhanceMenu().catch(err => {
      console.error('Error during initialization:', err);
    });
  });
} else {
  // DOM already loaded
  console.log('DOM already loaded, enhancing menu');
  enhanceMenu().catch(err => {
    console.error('Error during initialization:', err);
  });
}

// Add event delegation for icon clicks
document.body.addEventListener('click', async (event) => {
  const iconElement = event.target.closest('.cwph-icon');
  if (iconElement) {
    const dishName = iconElement.getAttribute('data-dish');
    try {
      const images = await fetchImages(dishName);
      if (images.length === 0) {
        openModal(dishName, [], 'No images found for this dish. Try a different search term.');
      } else {
        openModal(dishName, images);
      }
    } catch (error) {
      openModal(dishName, [], 'Unable to load images. Please check your internet connection and try again.');
    }
  }
});

// Handle retry event
document.addEventListener('cwph-retry', async (event) => {
  const { title } = event.detail;
  try {
    const images = await fetchImages(title);
    if (images.length === 0) {
      openModal(title, [], 'No images found for this dish. Try a different search term.');
    } else {
      openModal(title, images);
    }
  } catch (error) {
    openModal(title, [], 'Unable to load images. Please check your internet connection and try again.');
  }
});

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message from popup:', message);
    if (message.type === 'SEARCH' && message.query) {
      handleSearch(message.query);
      sendResponse({ success: true });
    } else if (message.type === 'ENHANCE') {
      console.log('Received ENHANCE message');
      enhanceMenu();
      sendResponse({ success: true });
    }
    return true; // Required for async sendResponse
  });
}

// Export functions for testing
export {
  injectAddImagesButton,
  injectButtonStyles,
  enhanceMenu,
  handleSearch,
  openModal,
  closeModal,
  fetchImages,
  waitForMenu
};
