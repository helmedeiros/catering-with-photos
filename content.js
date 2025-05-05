import { waitForMenu } from './utils/dom-utils.js';

function injectAddImagesButton() {
  const topBar = document.querySelector('.sc-d-date-picker');
  if (topBar && !document.getElementById('cwph-add')) {
    const btn = document.createElement('button');
    btn.id = 'cwph-add';
    btn.textContent = 'Add Images';
    topBar.appendChild(btn);
  }
}

function injectButtonStyles() {
  if (window.chrome && chrome.scripting && chrome.scripting.insertCSS) {
    chrome.scripting.insertCSS({
      target: {tabId: window.tabId || 0}, // tabId is required in real extension context
      files: ['styles/button.css']
    });
  } else {
    // Fallback for JSDOM/testing: inject <style> tag
    fetch('styles/button.css')
      .then(r => r.text())
      .then(css => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      })
      .catch(() => {});
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
