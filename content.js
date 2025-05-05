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

(async function main() {
  try {
    await waitForMenu();
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
})();
