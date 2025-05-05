import { waitForMenu } from '../utils/dom-utils';

describe('waitForMenu', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('resolves immediately if menu element already exists', async () => {
    // Setup
    const menuElement = document.createElement('div');
    menuElement.className = 'PlasmicMenuplanmanagement_container';
    container.appendChild(menuElement);

    // Test
    const result = await waitForMenu(container);
    expect(result).toBe(menuElement);
  });

  it('resolves when menu element is added dynamically', async () => {
    // Setup delayed element addition
    setTimeout(() => {
      const menuElement = document.createElement('div');
      menuElement.className = 'PlasmicMenuplanmanagement_item';
      container.appendChild(menuElement);
    }, 100);

    // Test
    const result = await waitForMenu(container, 1000);
    expect(result.className).toBe('PlasmicMenuplanmanagement_item');
  });

  it('rejects on timeout if menu element never appears', async () => {
    // Test
    await expect(waitForMenu(container, 100))
      .rejects
      .toThrow('Timeout waiting for menu element');
  });

  it('observes deeply nested elements', async () => {
    // Setup delayed nested element addition
    setTimeout(() => {
      const nested = document.createElement('div');
      nested.innerHTML = '<div><div class="PlasmicMenuplanmanagement_nested"></div></div>';
      container.appendChild(nested);
    }, 100);

    // Test
    const result = await waitForMenu(container, 1000);
    expect(result.className).toBe('PlasmicMenuplanmanagement_nested');
  });
});
