import './content.js';
import { waitForMenu } from '../utils/dom-utils.js';

jest.mock('../utils/dom-utils.js', () => ({
  waitForMenu: jest.fn(() => Promise.resolve()),
}));

describe('content.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const topBar = document.createElement('div');
    topBar.className = 'sc-d-date-picker';
    document.body.appendChild(topBar);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('inserts the Add Images button into the top bar', async () => {
    // Re-import to trigger the IIFE
    await import('../content.js');
    const btn = document.getElementById('cwph-add');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe('Add Images');
    const topBar = document.querySelector('.sc-d-date-picker');
    expect(topBar.contains(btn)).toBe(true);
  });

  it('re-injects the Add Images button when PlasmicMenuplanmanagement_ element is added and button is missing', async () => {
    // Remove button if present
    document.getElementById('cwph-add')?.remove();
    // Set up #root
    let root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
    // Set up top bar
    let topBar = document.querySelector('.sc-d-date-picker');
    if (!topBar) {
      topBar = document.createElement('div');
      topBar.className = 'sc-d-date-picker';
      document.body.appendChild(topBar);
    }
    // Re-import to trigger the IIFE and observer
    await import('../content.js');
    // Simulate dynamic addition
    const newNode = document.createElement('div');
    newNode.className = 'PlasmicMenuplanmanagement_dynamic';
    root.appendChild(newNode);
    // Wait for MutationObserver to react
    await new Promise((r) => setTimeout(r, 10));
    const btn = document.getElementById('cwph-add');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe('Add Images');
    expect(topBar.contains(btn)).toBe(true);
  });
});
