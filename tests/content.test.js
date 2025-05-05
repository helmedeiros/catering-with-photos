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
});
