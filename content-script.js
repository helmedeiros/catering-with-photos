// content-script.js - Non-module version of the content script
// Build: 2025-05-08T21:21:34.122Z

// Debug info
console.log('%c Catering with Photos v1.1.5 ', 'background: #4CAF50; color: white; font-size: 12px; border-radius: 4px; padding: 2px 6px;');
console.log('Build time:', '2025-05-08T21:21:34.122Z');

// Utility functions from dom-utils.js
async function waitForMenu(root = document, timeout = 10000) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const existingElement = root.querySelector('[class^="PlasmicMenuplanmanagement_"]');
    if (existingElement) {
      return resolve(existingElement);
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout waiting for menu element'));
    }, timeout);

    // Create observer
    const observer = new MutationObserver((mutations, obs) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const menuElement = root.querySelector('[class^="PlasmicMenuplanmanagement_"]');
          if (menuElement) {
            clearTimeout(timeoutId);
            obs.disconnect();
            resolve(menuElement);
            return;
          }
        }
      }
    });

    // Start observing
    observer.observe(root, {
      childList: true,
      subtree: true
    });
  });
}

// Simplified modal functions
function openModal(title, images, errorMessage = '') {
  const modal = document.createElement('div');
  modal.className = 'cwph-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');

  const modalContent = document.createElement('div');
  modalContent.className = 'cwph-modal-content';

  const modalHeader = document.createElement('div');
  modalHeader.className = 'cwph-modal-header';

  const modalTitle = document.createElement('h2');
  modalTitle.id = 'modal-title';
  modalTitle.textContent = title;

  const closeButton = document.createElement('button');
  closeButton.className = 'cwph-modal-close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close modal');

  const modalBody = document.createElement('div');
  modalBody.className = 'cwph-modal-body';

  // Add error message if needed
  if (errorMessage) {
    const errorEl = document.createElement('p');
    errorEl.className = 'cwph-error';
    errorEl.textContent = errorMessage;
    modalBody.appendChild(errorEl);
  }

  // Add image grid
  const imageGrid = document.createElement('div');
  imageGrid.className = 'cwph-image-grid cwph-modal-images';

  // Handle empty images array case
  if (!images || images.length === 0) {
    const noImagesMessage = document.createElement('p');
    noImagesMessage.className = 'cwph-no-images';
    noImagesMessage.textContent = 'No images available for this item.';
    modalBody.appendChild(noImagesMessage);
  } else {
    // Add images
    images.forEach(img => {
      const imgEl = document.createElement('img');
      const imgUrl = img.url || img;

      // Add error handler to try proxy if direct image load fails
      imgEl.onerror = function() {
        console.log('Image failed to load directly, trying proxy:', imgUrl);
        // Try loading through proxy
        chrome.runtime.sendMessage(
          {
            type: 'PROXY_REQUEST',
            url: imgUrl
          },
          response => {
            if (response && response.success && response.data && response.data.blob && response.data.url) {
              // Use the blob URL from the proxy
              imgEl.src = response.data.url;
            }
          }
        );
      };

      imgEl.src = imgUrl;
      imgEl.alt = img.alt || title;
      imageGrid.appendChild(imgEl);
    });

    modalBody.appendChild(imageGrid);
  }

  // Add "See more" link if there are images
  if (images && images.length > 0) {
    const seeMoreLink = document.createElement('a');
    seeMoreLink.href = `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=isch&safe=active`;
    seeMoreLink.className = 'cwph-see-more';
    seeMoreLink.target = '_blank';
    seeMoreLink.rel = 'noopener noreferrer';
    seeMoreLink.textContent = 'See more on Google';
    modalBody.appendChild(seeMoreLink);
  }

  // Assemble the modal
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);

  // Add to document
  document.body.appendChild(modal);

  // Trap focus within modal
  document.body.style.overflow = 'hidden';

  // Add close handler
  closeButton.addEventListener('click', () => {
    closeModal();
  });

  // Focus the close button
  closeButton.focus();

  // Close on escape key
  const keyHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', keyHandler);

  // Store keyHandler for cleanup
  modal.__keyHandler = keyHandler;
}

function closeModal() {
  const modal = document.querySelector('.cwph-modal');
  if (modal) {
    // Remove event listener if stored
    if (modal.__keyHandler) {
      document.removeEventListener('keydown', modal.__keyHandler);
    }

    modal.remove();
    // Restore scroll
    document.body.style.overflow = '';
  }
}

// Improved image scraper function
async function fetchImages(query) {
  try {
    // Check cache first
    const cachedImages = getCachedImages(query);
    if (cachedImages) {
      console.log('Using cached images for:', query);
      return cachedImages;
    }

    console.log('Fetching images for:', query);

    // Try to fetch from Google Images
    const images = [];

    // Build the Google Images search URL - use a simpler URL format
    const searchUrl = 'https://www.google.com/search?tbm=isch&q=' +
                     encodeURIComponent(query + ' food');

    // Try to fetch HTML content and extract image URLs
    let htmlContent = null;

    try {
      // Skip direct fetch and go straight to proxy for Google searches
      console.log('Using proxy for Google search');

      // Use the background script proxy
      const proxyResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'PROXY_REQUEST',
            url: searchUrl,
            options: {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            }
          },
          response => {
            if (chrome.runtime.lastError) {
              return reject(new Error(chrome.runtime.lastError.message));
            }

            if (!response || !response.success) {
              return reject(new Error(response?.error || 'Proxy request failed'));
            }

            resolve(response.data);
          }
        );
      });

      if (proxyResponse && proxyResponse.text) {
        htmlContent = proxyResponse.text;
        console.log('Successfully received HTML content from proxy');
      }
    } catch (proxyError) {
      console.error('Proxy fetch also failed:', proxyError);
    }

    // Extract image URLs from HTML if we got any
    if (htmlContent) {
      // Look for image URLs in the HTML using regex patterns
      const extractedUrls = extractImageUrls(htmlContent);

      if (extractedUrls.length > 0) {
        for (const url of extractedUrls.slice(0, 5)) {
          images.push({ url, alt: query });
        }
      }
    }

    // If no images found, use fallback URLs
    if (images.length === 0) {
      console.log('No images found, using fallback images');
      const fallbackUrls = [
        'https://source.unsplash.com/random/300x300?food',
        'https://source.unsplash.com/featured/?food',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe'
      ];

      for (let i = 0; i < 3; i++) {
        images.push({ url: fallbackUrls[i % fallbackUrls.length], alt: query });
      }
    }

    // Save to cache if we have images
    if (images.length > 0) {
      setCachedImages(query, images);
    }

    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

// Helper function to extract image URLs from Google search results
function extractImageUrls(html) {
  const imageUrls = [];

  try {
    // Multiple patterns to try to catch image URLs in different formats

    // Pattern 1: Look for "ou" URLs (Original URL)
    const pattern1 = /"ou":"(https?:\/\/[^"]+)"/g;
    let match;

    while ((match = pattern1.exec(html)) !== null && imageUrls.length < 10) {
      if (match[1] && !match[1].includes('gstatic.com') && !match[1].includes('google.com')) {
        imageUrls.push(match[1]);
      }
    }

    // Pattern 2: Alternative format with array notation
    if (imageUrls.length === 0) {
      const pattern2 = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)",\d+,\d+\]/g;

      while ((match = pattern2.exec(html)) !== null && imageUrls.length < 10) {
        if (match[1] && !match[1].includes('gstatic.com') && !match[1].includes('google.com')) {
          imageUrls.push(match[1]);
        }
      }
    }

    // Pattern 3: Look for image URLs in src attributes
    if (imageUrls.length === 0) {
      const pattern3 = /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/g;

      while ((match = pattern3.exec(html)) !== null && imageUrls.length < 10) {
        const url = match[1];
        if (url && !url.includes('gstatic.com') &&
            !url.includes('google.com') &&
            !url.includes('favicon') &&
            !url.includes('icon')) {
          imageUrls.push(url);
        }
      }
    }

    // Pattern 4: Look for URLs in data-src attributes (for lazy loading)
    if (imageUrls.length === 0) {
      const pattern4 = /data-src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/g;

      while ((match = pattern4.exec(html)) !== null && imageUrls.length < 10) {
        const url = match[1];
        if (url && !url.includes('gstatic.com') && !url.includes('google.com')) {
          imageUrls.push(url);
        }
      }
    }

    // Pattern 5: Simple URL pattern for any remaining image URLs
    if (imageUrls.length === 0) {
      const pattern5 = /(https?:\/\/[^\s"]+\.(?:jpg|jpeg|png|gif|webp)[^\s"]*)/g;

      while ((match = pattern5.exec(html)) !== null && imageUrls.length < 10) {
        const url = match[1];
        if (url && !url.includes('gstatic.com') && !url.includes('google.com')) {
          imageUrls.push(url);
        }
      }
    }

    console.log(`Found ${imageUrls.length} images in search results`);
  } catch (error) {
    console.warn('Error extracting image URLs:', error);
  }

  return imageUrls;
}

// Cache functions
function getCachedImages(query) {
  try {
    const cacheData = localStorage.getItem('cwph-cache');
    if (!cacheData) return null;

    const cache = JSON.parse(cacheData);
    const record = cache[query];

    if (!record) return null;

    // Check if expired (30 days)
    const now = Date.now();
    if (now - record.timestamp > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return record.images;
  } catch (error) {
    console.error('Error getting cached images:', error);
    return null;
  }
}

function setCachedImages(query, images) {
  try {
    const cacheData = localStorage.getItem('cwph-cache');
    const cache = cacheData ? JSON.parse(cacheData) : {};

    cache[query] = {
      images,
      timestamp: Date.now()
    };

    localStorage.setItem('cwph-cache', JSON.stringify(cache));
  } catch (error) {
    console.error('Error setting cached images:', error);
  }
}

// Main functions from content.js
function injectAddImagesButton() {
  console.log('Trying to inject Add Images button...');

  // Log all potential containers to help diagnose
  const allDivs = Array.from(document.querySelectorAll('div')).slice(0, 20);
  console.log('First 20 divs on page:', allDivs.map(div => ({
    className: div.className,
    id: div.id,
    children: div.children.length
  })));

  const topBar = document.querySelector('.sc-d-date-picker');
  console.log('Found top bar?', !!topBar);

  if (topBar && !document.getElementById('cwph-add')) {
    console.log('Injecting button into top bar');
    const btn = document.createElement('button');
    btn.id = 'cwph-add';
    btn.textContent = 'Add Images';
    topBar.appendChild(btn);
    btn.addEventListener('click', () => {
      addImagesToMeals();
    });
    return true;
  } else {
    // Try alternative methods if the top bar is not found
    console.log('Top bar not found, trying alternative methods');

    // Try to find a header or navigation element
    const possibleContainers = [
      document.querySelector('header'),
      document.querySelector('nav'),
      document.querySelector('.header'),
      document.querySelector('.navigation'),
      // Add other potential elements
      document.querySelector('body') // Last resort - add to body
    ];

    for (const container of possibleContainers) {
      if (container && !document.getElementById('cwph-add')) {
        console.log('Injecting button into alternative container', container);
        const btn = document.createElement('button');
        btn.id = 'cwph-add';
        btn.textContent = 'Add Images';
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '9999';
        container.appendChild(btn);
        btn.addEventListener('click', () => {
          addImagesToMeals();
        });
        return true;
      }
    }
  }

  console.log('Failed to inject button');
  return false;
}

// Separate the action of adding images to meals
function addImagesToMeals() {
  console.log('Adding image icons to meals');
  // Try multiple selectors to find meal elements
  const mealSelectors = [
    '.PlasmicMenuplanmanagement_container .meal-name',
    '.meal-name',
    '.meal',
    // Add other potential selectors
    'div[class*="meal"]',
    'span[class*="meal"]'
  ];

  let mealNodes = [];

  for (const selector of mealSelectors) {
    const nodes = document.querySelectorAll(selector);
    console.log(`Found ${nodes.length} elements with selector: ${selector}`);
    if (nodes.length > 0) {
      mealNodes = Array.from(nodes);
      break;
    }
  }

  if (mealNodes.length === 0) {
    console.log('No meal nodes found. Trying to find text nodes that might be meals');
    // As a last resort, look for elements that might contain food names
    const textNodes = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6'))
      .filter(el => el.textContent && el.textContent.trim().length > 0 && el.textContent.trim().length < 50 && !el.querySelector('*'));

    console.log(`Found ${textNodes.length} potential text nodes that could be meals`);
    mealNodes = textNodes;
  }

  mealNodes.forEach(mealNode => {
    console.log('Processing meal node:', mealNode.textContent.trim());

    // Check if this meal already has an icon wrapper as a sibling
    const existingWrapper = mealNode.nextElementSibling;
    if (existingWrapper && existingWrapper.classList.contains('cwph-icon-wrapper')) {
      console.log('Icon already exists for:', mealNode.textContent.trim());
      return; // Skip this meal node as it already has an icon
    }

    // Also check if there's a wrapper anywhere after this node with the same dish name
    const parentNode = mealNode.parentNode;
    if (parentNode) {
      const allWrappers = parentNode.querySelectorAll('.cwph-icon-wrapper');
      for (const wrapper of allWrappers) {
        const icon = wrapper.querySelector('.cwph-icon');
        if (icon && icon.getAttribute('data-dish') === mealNode.textContent.trim()) {
          console.log('Icon already exists for this dish elsewhere:', mealNode.textContent.trim());
          return; // Skip this meal node as it already has an icon
        }
      }
    }

    // No existing icon found, create a new one
    const iconSpan = document.createElement('span');
    iconSpan.className = 'cwph-icon';
    iconSpan.setAttribute('data-dish', mealNode.textContent.trim());
    iconSpan.innerHTML = '&#128269;'; // Magnifying glass emoji as HTML entity

    // Create text label
    const textLabel = document.createElement('span');
    textLabel.className = 'cwph-icon-label';
    textLabel.textContent = 'See Dish Photos';

    // Create a wrapper to position the icon next to the meal item instead of inside it
    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'cwph-icon-wrapper';
    iconWrapper.appendChild(iconSpan);
    iconWrapper.appendChild(textLabel);

    // Insert after the meal node instead of appending as a child
    mealNode.parentNode.insertBefore(iconWrapper, mealNode.nextSibling);

    console.log('Added icon to:', mealNode.textContent.trim());
  });

  if (mealNodes.length === 0) {
    alert('No meal items found on the page. Make sure you are on the menu page.');
  }
}

function injectButtonStyles() {
  // Add basic styles inline since we can't reference the CSS files directly
  const style = document.createElement('style');
  style.textContent = `
    #cwph-add {
      margin-left: 10px;
      padding: 5px 10px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .cwph-icon {
      margin-left: 5px;
      cursor: pointer;
      display: inline-block;
      font-size: 14px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .cwph-icon:hover {
      opacity: 1;
    }

    .cwph-icon-label {
      margin-left: 4px;
      font-size: 13px;
      color: #4285f4;
      font-weight: 500;
    }

    .cwph-icon-wrapper {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      position: relative;
      z-index: 10; /* Ensure icon is above other elements */
      vertical-align: middle;
      pointer-events: auto; /* Ensure clicks on icon are captured */
      cursor: pointer;
    }

    .cwph-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .cwph-modal-content {
      background-color: white;
      border-radius: 8px;
      max-width: 80%;
      max-height: 80%;
      overflow: auto;
      padding: 20px;
    }

    .cwph-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cwph-modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    }

    .cwph-image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 15px;
    }

    .cwph-image-grid img {
      width: 100%;
      height: auto;
      border-radius: 4px;
    }

    .cwph-see-more {
      display: block;
      margin-top: 15px;
      text-align: center;
    }

    .cwph-error {
      color: red;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

async function enhanceMenu() {
  try {
    console.log('Enhancing menu...');

    // Log the entire document structure for debugging
    console.log('Document structure:', {
      title: document.title,
      url: window.location.href,
      bodyChildren: document.body.children.length
    });

    // Don't wait for the menu if it might not be present
    try {
      await waitForMenu(document, 5000); // Shorter timeout
      console.log('Menu element found');
    } catch (e) {
      console.log('Menu waiting timed out, continuing anyway');
    }

    injectButtonStyles();
    const buttonInjected = injectAddImagesButton();

    if (!buttonInjected) {
      console.log('Could not inject button automatically. Adding a floating button.');
      // Create a floating button as a last resort
      const floatingBtn = document.createElement('button');
      floatingBtn.textContent = 'Add Images';
      floatingBtn.id = 'cwph-add-floating';
      floatingBtn.style.position = 'fixed';
      floatingBtn.style.bottom = '20px';
      floatingBtn.style.right = '20px';
      floatingBtn.style.zIndex = '10000';
      floatingBtn.style.padding = '10px 15px';
      floatingBtn.style.backgroundColor = '#4285f4';
      floatingBtn.style.color = 'white';
      floatingBtn.style.border = 'none';
      floatingBtn.style.borderRadius = '4px';
      floatingBtn.style.cursor = 'pointer';
      floatingBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

      floatingBtn.addEventListener('click', () => {
        addImagesToMeals();
      });

      document.body.appendChild(floatingBtn);
    }

    // Set up mutation observer to watch for DOM changes
    const root = document.getElementById('root');
    if (root) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (
              node.nodeType === 1 &&
              node.className &&
              typeof node.className === 'string' &&
              (
                node.className.startsWith('PlasmicMenuplanmanagement_') ||
                node.className.includes('Plasmic') ||
                node.className.includes('menu')
              ) &&
              !document.getElementById('cwph-add')
            ) {
              console.log('Menu changed, reinjecting button');
              injectAddImagesButton();
              return;
            }
          }
        }
      });
      observer.observe(root, { childList: true, subtree: true });

      // Store observer reference for cleanup in tests
      if (typeof window !== 'undefined' && window.__CWPH_TEST__) {
        root.__observer = observer;
      }
    }

    console.log('Menu enhancement complete');
  } catch (e) {
    console.error('Menu enhancement failed:', e);
  }
}

async function handleSearch(query) {
  if (!query || !query.trim()) {
    return;
  }

  try {
    const images = await fetchImages(query);
    if (images.length === 0) {
      openModal(query, [], 'No images found for this search term.');
    } else {
      openModal(query, images);
    }
  } catch (error) {
    openModal(query, [], 'Unable to load images. Please check your internet connection and try again.');
  }
}

// Log page structure for debugging
const hasMenu = !!document.querySelector('[class^="PlasmicMenuplanmanagement_"]');
const hasTopBar = !!document.querySelector('.sc-d-date-picker');
console.log('Page compatibility check:', {
  hasMenu,
  hasTopBar,
  url: window.location.href
});

// Make sure we can trigger enhancement manually from the console
window.cwphEnhanceMenu = enhanceMenu;

// For extension use, auto-run when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, enhancing menu');
    enhanceMenu().catch(err => {
      console.error('Error during initialization:', err);
    });
  });
} else {
  // DOM already loaded
  console.log('DOM already loaded, enhancing menu');
  enhanceMenu().catch(err => {
    console.error('Error during initialization:', err);
  });
}

// Add event delegation for icon clicks
document.body.addEventListener('click', async (event) => {
  // Check if click is on icon wrapper or any of its children
  const iconWrapper = event.target.closest('.cwph-icon-wrapper');
  if (iconWrapper) {
    event.stopPropagation(); // Stop event from propagating to parent elements
    const iconElement = iconWrapper.querySelector('.cwph-icon');
    const dishName = iconElement.getAttribute('data-dish');
    try {
      const images = await fetchImages(dishName);
      if (images.length === 0) {
        openModal(dishName, [], 'No images found for this dish. Try a different search term.');
      } else {
        openModal(dishName, images);
      }
    } catch (error) {
      openModal(dishName, [], 'Unable to load images. Please check your internet connection and try again.');
    }
  }
});

// Handle retry event
document.addEventListener('cwph-retry', async (event) => {
  const { title } = event.detail;
  try {
    const images = await fetchImages(title);
    if (images.length === 0) {
      openModal(title, [], 'No images found for this dish. Try a different search term.');
    } else {
      openModal(title, images);
    }
  } catch (error) {
    openModal(title, [], 'Unable to load images. Please check your internet connection and try again.');
  }
});

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message from popup:', message);
    if (message.type === 'SEARCH' && message.query) {
      handleSearch(message.query);
      sendResponse({ success: true });
    } else if (message.type === 'ENHANCE') {
      console.log('Received ENHANCE message');
      enhanceMenu();
      sendResponse({ success: true });
    }
    return true; // Required for async sendResponse
  });
}
