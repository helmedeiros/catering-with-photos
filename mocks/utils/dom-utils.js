import { jest } from '@jest/globals';

// Manual mock for dom-utils.js
export const waitForMenu = jest.fn(() => {
  return Promise.resolve();
});
