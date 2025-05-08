import { waitForMenu } from './utils/dom-utils.js';
import { openModal, closeModal } from './components/modal.js';
import { fetchImages } from './utils/image-scraper.js';

export function injectAddImagesButton() {
  const topBar = document.querySelector('.sc-d-date-picker');
  if (topBar && !document.getElementById('cwph-add')) {
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
  }
}

export function injectButtonStyles() {
  if (window.chrome && chrome.scripting && chrome.scripting.insertCSS) {
    chrome.scripting.insertCSS({
      target: {tabId: window.tabId || 0}, // tabId is required in real extension context
      files: ['styles/button.css', 'styles/icon.css']
    });
  }
}

export async function enhanceMenu() {
  try {
    await waitForMenu();
    injectButtonStyles();
    injectAddImagesButton();
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
              injectAddImagesButton();
              return;
            }
          }
        }
      });
      observer.observe(root, { childList: true, subtree: true });
    }
  } catch (e) {
    // Optionally log or handle error
  }
}

// For extension use, auto-run
if (typeof window !== 'undefined' && !window.__CWPH_TEST__) {
  enhanceMenu();
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
