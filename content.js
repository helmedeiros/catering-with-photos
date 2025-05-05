import { waitForMenu } from './utils/dom-utils.js';

(async function injectAddImagesButton() {
  try {
    await waitForMenu();
    const topBar = document.querySelector('.sc-d-date-picker');
    if (topBar && !document.getElementById('cwph-add')) {
      const btn = document.createElement('button');
      btn.id = 'cwph-add';
      btn.textContent = 'Add Images';
      topBar.appendChild(btn);
    }
  } catch (e) {
    // Optionally log or handle error
  }
})();
