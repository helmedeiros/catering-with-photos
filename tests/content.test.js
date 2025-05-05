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

  test('adds 🔍 icons to meal nodes', async () => {
    await jest.isolateModulesAsync(async () => {
      // Set up top bar
      const topBar = document.createElement('div');
      topBar.className = 'sc-d-date-picker';
      document.body.appendChild(topBar);

      // Set up meal nodes
      const menuContainer = document.createElement('div');
      menuContainer.className = 'PlasmicMenuplanmanagement_container';
      for (let i = 0; i < 3; i++) {
        const mealNode = document.createElement('div');
        mealNode.className = 'meal-name';
        mealNode.textContent = `Meal ${i + 1}`;
        menuContainer.appendChild(mealNode);
      }
      document.body.appendChild(menuContainer);

      jest.unstable_mockModule('../utils/dom-utils.js', () => ({
        waitForMenu: jest.fn(() => Promise.resolve()),
      }));

      const { enhanceMenu } = await import('../content.js');
      await enhanceMenu();

      const addButton = document.getElementById('cwph-add');
      expect(addButton).toBeTruthy();
      addButton.click();

      const mealNodes = document.querySelectorAll('.PlasmicMenuplanmanagement_container .meal-name');
      const iconNodes = document.querySelectorAll('.cwph-icon');
      expect(iconNodes.length).toBe(mealNodes.length);
      expect(iconNodes.length).toBe(3);

      // Verify data-dish attributes
      iconNodes.forEach((icon, index) => {
        expect(icon.getAttribute('data-dish')).toBe(`Meal ${index + 1}`);
      });
    });
  });

  test('clicking an icon opens modal with placeholder images', async () => {
    await jest.isolateModulesAsync(async () => {
      // Mock the modal module
      const mockOpenModal = jest.fn().mockReturnValue({
        title: 'Test Meal',
        images: ['placeholder1.jpg', 'placeholder2.jpg', 'placeholder3.jpg']
      });

      jest.unstable_mockModule('../components/modal.js', () => ({
        openModal: mockOpenModal,
        closeModal: jest.fn()
      }));

      jest.unstable_mockModule('../utils/dom-utils.js', () => ({
        waitForMenu: jest.fn(() => Promise.resolve()),
      }));

      // Set up the DOM
      const topBar = document.createElement('div');
      topBar.className = 'sc-d-date-picker';
      document.body.appendChild(topBar);

      const menuContainer = document.createElement('div');
      menuContainer.className = 'PlasmicMenuplanmanagement_container';
      const mealNode = document.createElement('div');
      mealNode.className = 'meal-name';
      mealNode.textContent = 'Test Meal';
      menuContainer.appendChild(mealNode);
      document.body.appendChild(menuContainer);

      // Import and initialize content
      const { enhanceMenu } = await import('../content.js');
      await enhanceMenu();

      // Click the Add Images button to add icons
      document.getElementById('cwph-add').click();

      // Find and click the icon
      const icon = document.querySelector('.cwph-icon');
      icon.click();

      // Verify modal was opened with correct arguments
      expect(mockOpenModal).toHaveBeenCalledWith('Test Meal', []);
      const result = mockOpenModal.mock.results[0].value;
      expect(result.images).toHaveLength(3);
      expect(result.images).toEqual([
        'placeholder1.jpg',
        'placeholder2.jpg',
        'placeholder3.jpg'
      ]);
    });
  });
});
