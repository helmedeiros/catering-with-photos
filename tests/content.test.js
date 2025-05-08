/**
 * Test for content.js functionality
 */
import { jest } from '@jest/globals';

describe('content.js', () => {
  let mockDomUtils;
  let mockModal;
  let mockImageScraper;
  let content;

  beforeEach(async () => {
    // Create manual mocks
    mockDomUtils = {
      waitForMenu: jest.fn().mockResolvedValue({})
    };

    mockModal = {
      openModal: jest.fn(),
      closeModal: jest.fn()
    };

    mockImageScraper = {
      fetchImages: jest.fn().mockResolvedValue(['image1.jpg', 'image2.jpg'])
    };

    // Mock the import() calls
    jest.unstable_mockModule('../utils/dom-utils.js', () => mockDomUtils);
    jest.unstable_mockModule('../components/modal.js', () => mockModal);
    jest.unstable_mockModule('../utils/image-scraper.js', () => mockImageScraper);

    // Set up DOM
    document.body.innerHTML = `
      <div id="root">
        <div class="sc-d-date-picker"></div>
        <div class="PlasmicMenuplanmanagement_container">
          <div class="meal-name">Pasta Carbonara</div>
          <div class="meal-name">Chicken Curry</div>
        </div>
      </div>
    `;

    // Mock chrome API
    global.chrome = {
      scripting: {
        insertCSS: jest.fn()
      },
      runtime: {
        onMessage: {
          addListener: jest.fn()
        }
      }
    };

    // Set flag for test environment
    global.__CWPH_TEST__ = true;

    // Use fake timers
    jest.useFakeTimers();

    // Import content module after mocks are set up
    content = await import('../content.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    jest.useRealTimers();
    delete global.__CWPH_TEST__;
    delete global.chrome;
    jest.resetModules();
  });

  // Test the exports
  it('exports the expected functions', () => {
    expect(typeof content.injectAddImagesButton).toBe('function');
    expect(typeof content.injectButtonStyles).toBe('function');
    expect(typeof content.enhanceMenu).toBe('function');
    expect(typeof content.handleSearch).toBe('function');
  });

  describe('injectAddImagesButton', () => {
    it('injects button to the topBar', () => {
      content.injectAddImagesButton();
      const btn = document.getElementById('cwph-add');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('Add Images');
    });

    it('does not inject duplicate buttons', () => {
      content.injectAddImagesButton();
      content.injectAddImagesButton();
      const btns = document.querySelectorAll('#cwph-add');
      expect(btns.length).toBe(1);
    });

    it('adds icons when button is clicked', () => {
      content.injectAddImagesButton();
      const btn = document.getElementById('cwph-add');
      btn.click();
      const icons = document.querySelectorAll('.cwph-icon');
      expect(icons.length).toBe(2);
      expect(icons[0].getAttribute('data-dish')).toBe('Pasta Carbonara');
      expect(icons[1].getAttribute('data-dish')).toBe('Chicken Curry');
    });
  });

  describe('injectButtonStyles', () => {
    it('calls chrome.scripting.insertCSS with correct parameters', () => {
      content.injectButtonStyles();
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 0 },
        files: ['styles/button.css', 'styles/icon.css']
      });
    });
  });

  describe('enhanceMenu', () => {
    it('calls waitForMenu during execution', async () => {
      await content.enhanceMenu();
      expect(mockDomUtils.waitForMenu).toHaveBeenCalled();
    });

    it('adds the button after waiting for menu', async () => {
      await content.enhanceMenu();
      const btn = document.getElementById('cwph-add');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('Add Images');
    });

    it('handles missing menu gracefully', async () => {
      mockDomUtils.waitForMenu.mockRejectedValueOnce(new Error('Timeout'));
      const promise = content.enhanceMenu();
      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('handleSearch', () => {
    it('calls fetchImages and openModal with the query', async () => {
      await content.handleSearch('test query');
      expect(mockImageScraper.fetchImages).toHaveBeenCalledWith('test query');
      expect(mockModal.openModal).toHaveBeenCalledWith('test query', ['image1.jpg', 'image2.jpg']);
    });

    it('handles empty queries gracefully', async () => {
      await content.handleSearch('');
      expect(mockImageScraper.fetchImages).not.toHaveBeenCalled();
      expect(mockModal.openModal).not.toHaveBeenCalled();
    });

    it('shows error modal when fetchImages fails', async () => {
      mockImageScraper.fetchImages.mockRejectedValueOnce(new Error('Network error'));
      await content.handleSearch('error test');
      expect(mockImageScraper.fetchImages).toHaveBeenCalledWith('error test');
      expect(mockModal.openModal).toHaveBeenCalledWith(
        'error test',
        [],
        'Unable to load images. Please check your internet connection and try again.'
      );
    });

    it('shows error modal when no images are found', async () => {
      mockImageScraper.fetchImages.mockResolvedValueOnce([]);
      await content.handleSearch('no images');
      expect(mockImageScraper.fetchImages).toHaveBeenCalledWith('no images');
      expect(mockModal.openModal).toHaveBeenCalledWith(
        'no images',
        [],
        'No images found for this search term.'
      );
    });
  });

  describe('event handling', () => {
    it('registers a message listener for search requests', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('handles icon clicks', async () => {
      // Setup icon and click handler
      document.body.innerHTML = `
        <div class="cwph-icon" data-dish="Lasagna">🔍</div>
      `;

      // Get the icon and click it
      const icon = document.querySelector('.cwph-icon');
      icon.click();

      // Expect fetchImages to be called with the dish name
      expect(mockImageScraper.fetchImages).toHaveBeenCalledWith('Lasagna');
    });

    it('handles retry events', async () => {
      // Create and dispatch retry event
      const event = new CustomEvent('cwph-retry', {
        detail: { title: 'Retry Dish' }
      });
      document.dispatchEvent(event);

      // Expect fetchImages to be called with the title
      expect(mockImageScraper.fetchImages).toHaveBeenCalledWith('Retry Dish');
    });
  });
});
