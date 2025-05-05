import { jest } from '@jest/globals';

describe('content.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const topBar = document.createElement('div');
    topBar.className = 'sc-d-date-picker';
    document.body.appendChild(topBar);
    global.window.__CWPH_TEST__ = true;
    global.fetch = jest.fn(() => Promise.resolve({
      text: () => Promise.resolve('#cwph-add { border-radius: 4px; }'),
    }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    delete global.window.__CWPH_TEST__;
  });

  it('inserts the Add Images button into the top bar', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.unstable_mockModule('../utils/dom-utils.js', () => ({
        waitForMenu: jest.fn(() => Promise.resolve()),
      }));
      const { enhanceMenu } = await import('../content.js');
      await enhanceMenu();
      const btn = document.getElementById('cwph-add');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('Add Images');
      const topBar = document.querySelector('.sc-d-date-picker');
      expect(topBar.contains(btn)).toBe(true);
    });
  });

  it('re-injects the Add Images button when PlasmicMenuplanmanagement_ element is added and button is missing', async () => {
    await jest.isolateModulesAsync(async () => {
      document.getElementById('cwph-add')?.remove();
      let root = document.getElementById('root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);
      }
      let topBar = document.querySelector('.sc-d-date-picker');
      if (!topBar) {
        topBar = document.createElement('div');
        topBar.className = 'sc-d-date-picker';
        document.body.appendChild(topBar);
      }
      jest.unstable_mockModule('../utils/dom-utils.js', () => ({
        waitForMenu: jest.fn(() => Promise.resolve()),
      }));
      const { enhanceMenu } = await import('../content.js');
      await enhanceMenu();
      const newNode = document.createElement('div');
      newNode.className = 'PlasmicMenuplanmanagement_dynamic';
      root.appendChild(newNode);
      await new Promise((r) => setTimeout(r, 10));
      const btn = document.getElementById('cwph-add');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('Add Images');
      expect(topBar.contains(btn)).toBe(true);
    });
  });

  it('applies button styles with border-radius', async () => {
    await jest.isolateModulesAsync(async () => {
      let root = document.getElementById('root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);
      }
      let topBar = document.querySelector('.sc-d-date-picker');
      if (!topBar) {
        topBar = document.createElement('div');
        topBar.className = 'sc-d-date-picker';
        document.body.appendChild(topBar);
      }
      jest.unstable_mockModule('../utils/dom-utils.js', () => ({
        waitForMenu: jest.fn(() => Promise.resolve()),
      }));
      const { enhanceMenu } = await import('../content.js');
      await enhanceMenu();
      await new Promise((r) => setTimeout(r, 10));
      const btn = document.getElementById('cwph-add');
      const style = window.getComputedStyle(btn);
      expect(style.borderRadius).toBe('4px');
    });
  });
});
