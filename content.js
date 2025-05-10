
// Import fetchImages from the proper location
import { fetchImages } from './utils/image-scraper.js';
// content-script.js - Non-module version of the content script
// Build: 2025-05-10T08:40:17.890Z

// Debug info
console.log('%c Catering with Photos v1.1.16 ', 'background: #4CAF50; color: white; font-size: 12px; border-radius: 4px; padding: 2px 6px;');
console.log('Build time:', '2025-05-10T08:40:17.890Z');

// PAGE DETECTION - Determine which page we're on
function detectCurrentPage() {
  console.log('🔍 Detecting current page...');
  const url = window.location.href;
  const title = document.title;
  const h1Text = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map(el => el.textContent.trim())
    .join(' ');

  const hasWeekSelector = !!document.querySelector('[class*="weekSelector"]');
  const hasMealElements = document.querySelectorAll('[class*="meal"]').length > 0;
  const hasWelcomeText =
    document.body.textContent.includes('Willkommen') ||
    document.body.textContent.includes('Wählen Sie ein Kind');

  const isMenuPage = hasWeekSelector || hasMealElements;
  const isWelcomePage = hasWelcomeText && !isMenuPage;

  console.log('🔍 Page detection results:', {
    url,
    title,
    headings: h1Text,
    hasWeekSelector,
    hasMealElements,
    hasWelcomeText,
    isMenuPage,
    isWelcomePage
  });

  return { isMenuPage, isWelcomePage };
}

// Track user actions to prevent conflicts
const userActions = {
  addingIcons: false,  // Set to true when user clicks "Add Images"
  navigating: false,   // Set to true during navigation
  lastIconAddTime: 0,  // Track when icons were last added
  lastActivityTime: Date.now(), // NEW: Track when user was last active on page

  // NEW: Update last activity time
  updateActivity: function() {
    this.lastActivityTime = Date.now();
  },

  // Set when user is adding icons
  startAddingIcons: function() {
    this.addingIcons = true;
    this.lastIconAddTime = Date.now();
    this.lastActivityTime = Date.now(); // Update activity time
    console.log('👤 User is adding icons');

    // Reset after a reasonable time
    setTimeout(() => {
      this.addingIcons = false;
      console.log('👤 Icon adding session ended');
    }, 5000); // 5 seconds grace period
  },

  // Set when navigation is happening
  startNavigating: function() {
    this.navigating = true;
    console.log('👤 User is navigating');

    // Reset after navigation should be complete
    setTimeout(() => {
      this.navigating = false;
      console.log('👤 Navigation session ended');
    }, 2000);
  },

  // Check if we should avoid removing icons
  shouldPreserveIcons: function() {
    // Don't remove icons if user just added them (within last 30 seconds)
    const timeSinceAdd = Date.now() - this.lastIconAddTime;
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    const recentlyAdded = timeSinceAdd < 30000; // Increased from 10 to 30 seconds
    const recentActivity = timeSinceActivity < 60000; // 1 minute of inactivity

    // Check if any icon has been interacted with (hovered, clicked) recently
    const hasRecentInteraction = document.querySelector('.cwph-icon-wrapper:hover, .cwph-icon:hover, .cwph-icon-label:hover');

    // NEW: Check for active modals or photo viewing
    const isViewingPhotos = document.querySelector('.cwph-modal, .cwph-photo-viewer');

    if (this.addingIcons || recentlyAdded || hasRecentInteraction || isViewingPhotos || recentActivity) {
      console.log(`👤 Preserving icons - User adding: ${this.addingIcons}, Recently added: ${recentlyAdded}, Recently active: ${recentActivity}, Time since add: ${timeSinceAdd}ms, Active interaction: ${!!hasRecentInteraction}, Viewing photos: ${!!isViewingPhotos}`);
      return true;
    }

    return false;
  }
};

// MONITOR PAGE CHANGES - Watch for navigation between pages
(function pageChangeMonitor() {
  console.log('👀 Setting up page change monitor');

  let currentUrl = window.location.href;
  let currentTitle = document.title;
  let { isMenuPage } = detectCurrentPage();

  // Check for changes every second
  setInterval(() => {
    const newUrl = window.location.href;
    const newTitle = document.title;

    if (newUrl !== currentUrl || newTitle !== currentTitle) {
      console.log('📄 Page change detected!', {
        from: currentUrl,
        to: newUrl
      });

      currentUrl = newUrl;
      currentTitle = newTitle;

      // Re-detect the page type
      const { isMenuPage: newIsMenuPage } = detectCurrentPage();

      // If we've navigated to the menu page, enhance it
      if (newIsMenuPage && !isMenuPage) {
        console.log('📄 Navigated to menu page! Enhancing...');
        setTimeout(enhanceMenu, 1000);
      }

      isMenuPage = newIsMenuPage;
    }

    // Also check for menu elements appearing without URL change
    if (!isMenuPage) {
      const hasMenuElements = document.querySelectorAll('[class*="PlasmicMenuplanmanagement_"]').length > 0;
      if (hasMenuElements) {
        console.log('📄 Menu elements detected without page change. Enhancing...');
        isMenuPage = true;
        setTimeout(enhanceMenu, 1000);
      }
    }
  }, 1000);
})();

// CRITICAL FINAL FIX - Run immediately and override everything
(function criticalFix() {
  console.log('🚨 CRITICAL FIX: Adding direct navigation handlers and icon removers');

  // Set up activity tracking
  ['mousemove', 'click', 'keydown', 'scroll'].forEach(eventType => {
    document.addEventListener(eventType, () => {
      userActions.updateActivity();
    }, { passive: true });
  });

  // Destroy ALL icon elements using multiple approaches
  function nukeAllIcons(reason) {
    // Check if we should preserve icons first
    if (userActions.shouldPreserveIcons() && reason !== 'force') {
      console.log('🛡️ Skipping icon removal - user recently added icons');
      return;
    }

    console.log(`💣 CRITICAL: NUKING ALL ICONS (reason: ${reason})`);

    // 1. Remove by class name
    const iconWrappers = document.querySelectorAll('.cwph-icon-wrapper, .cwph-icon, .cwph-icon-label');
    console.log(`💥 Removing ${iconWrappers.length} elements with icon classes`);
    iconWrappers.forEach(el => el.remove());

    // 2. Remove by content (magnifying glass emoji)
    const allSpans = document.querySelectorAll('span');
    let emojiSpans = 0;
    allSpans.forEach(span => {
      if (span.textContent.includes('🔍') ||
          span.innerHTML.includes('&#128269;') ||
          span.textContent.includes('See Dish Photos')) {
        span.remove();
        emojiSpans++;
      }
    });
    console.log(`💥 Removed ${emojiSpans} spans with magnifying glass emoji or label text`);

    // 3. Remove any possible parent containers of icons
    const possibleContainers = document.querySelectorAll('.cwph-icon-wrapper');
    possibleContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    // 4. Find any spans next to meal text
    const mealCards = document.querySelectorAll('[class*="meal"]');
    let mealSpansRemoved = 0;
    mealCards.forEach(card => {
      // Check next siblings for any spans
      let sibling = card.nextElementSibling;
      while (sibling && sibling.tagName === 'SPAN') {
        sibling.remove();
        mealSpansRemoved++;
        sibling = card.nextElementSibling;
      }
    });
    console.log(`💥 Removed ${mealSpansRemoved} spans next to meal elements`);

    // 5. Final count check
    setTimeout(() => {
      const remaining = document.querySelectorAll('.cwph-icon-wrapper, .cwph-icon, .cwph-icon-label');
      console.log(`🔍 After cleanup: ${remaining.length} icon elements remain`);

      if (remaining.length > 0) {
        console.log('⚠️ Some icon elements were not removed. Trying alternative removal');
        remaining.forEach(el => {
          try {
            // Try various removal methods
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            } else {
              el.remove();
            }
          } catch (e) {
            console.error('Failed to remove element:', e);
          }
        });
      }
    }, 100);
  }

  // Create a MutationObserver to watch for changes
  const observer = new MutationObserver((mutations) => {
    // Look for date changes or navigation
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if new content was added that might indicate navigation
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 &&
              (node.className.includes('Plasmic') ||
               node.className.includes('menu'))) {
            console.log('🚨 CRITICAL: Detected content change - potential navigation');
            userActions.startNavigating();
            nukeAllIcons('navigation');
            return;
          }
        }
      }
    }
  });

  // Set up the observer
  observer.observe(document.body, { childList: true, subtree: true });

  // Direct interception of navigation buttons
  function setupNavigationHandlers() {
    // Handle any existing navigation buttons
    const svgButtons = document.querySelectorAll('button svg');

    svgButtons.forEach(svg => {
      const button = svg.closest('button');
      if (button && !button._hasCriticalHandler) {
        button._hasCriticalHandler = true;

        button.addEventListener('click', () => {
          console.log('🚨 CRITICAL: Navigation button clicked');
          userActions.startNavigating();
          nukeAllIcons('navigation button');

          // Double check after a delay to catch any DOM changes
          setTimeout(() => nukeAllIcons('delayed check'), 200);
          setTimeout(() => nukeAllIcons('delayed check'), 500);
          setTimeout(() => nukeAllIcons('delayed check'), 1000);
        }, { capture: true });
      }
    });

    // Also handle clicks directly on SVG and paths
    document.addEventListener('click', event => {
      const target = event.target;
      if (target.tagName === 'svg' || target.tagName === 'path' ||
          target.closest('svg')) {
        console.log('🚨 CRITICAL: SVG or path element clicked');
        userActions.startNavigating();
        nukeAllIcons('svg/path click');

        // Double check after a delay
        setTimeout(() => nukeAllIcons('delayed check'), 200);
        setTimeout(() => nukeAllIcons('delayed check'), 500);
      }
    }, { capture: true });

    console.log('🚨 CRITICAL: Navigation handlers installed');
  }

  // Set up handlers immediately and after short delays
  if (document.readyState !== 'loading') {
    setupNavigationHandlers();
  } else {
    document.addEventListener('DOMContentLoaded', setupNavigationHandlers);
  }

  // Also try after delays
  setTimeout(setupNavigationHandlers, 1000);
  setTimeout(setupNavigationHandlers, 3000);

  // Run initial nuke - but use force reason to ensure it runs
  setTimeout(() => nukeAllIcons('initial cleanup'), 5000);

  // Check periodically to see if there are any icons that should be removed
  // But only if we're not in an adding session and not recently added
  setInterval(() => {
    // Skip if user is actively adding icons
    if (userActions.shouldPreserveIcons()) {
      return;
    }

    // NEW: Check if user is actively viewing icons (modal is open)
    if (document.querySelector('.cwph-modal')) {
      console.log('⏱️ Skipping periodic check while modal is open');
      return;
    }

    const icons = document.querySelectorAll('.cwph-icon-wrapper, .cwph-icon, .cwph-icon-label');
    if (icons.length > 0) {
      console.log(`⏱️ Periodic check found ${icons.length} leftover icons`);
      nukeAllIcons('periodic check');
    }
  }, 15000); // Increased from 5000 to 15000 (15 seconds)

  // Override the addImagesToMeals function to add our hook
  const originalAddImagesToMeals = window.addImagesToMeals;
  window.addImagesToMeals = function() {
    console.log('🚨 CRITICAL: addImagesToMeals was called');

    // Mark that user is adding icons
    userActions.startAddingIcons();

    // Then call the original function
    if (typeof originalAddImagesToMeals === 'function') {
      return originalAddImagesToMeals.apply(this, arguments);
    }
  };
})();

// EMERGENCY FIXES FOR SPECIFIC BUTTONS - Run immediately
(function emergencyFix() {
  console.log('🚑 EMERGENCY FIX: Setting up direct path interceptors');

  // Directly wait for document to be interactive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEmergencyHandlers);
  } else {
    setupEmergencyHandlers();
  }

  // Check again after 1 second
  setTimeout(setupEmergencyHandlers, 1000);

  // And again after 3 seconds
  setTimeout(setupEmergencyHandlers, 3000);

  function setupEmergencyHandlers() {
    // The specific path strings we identified from the console logs
    const pathPatterns = [
      'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
      'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z'
    ];

    // Find all SVG paths
    const paths = document.querySelectorAll('path');

    paths.forEach(path => {
      const d = path.getAttribute('d');

      // If this is one of our navigation paths
      if (d && pathPatterns.some(pattern => d.includes(pattern.substring(0, 15)))) {
        console.log('🚑 EMERGENCY FIX: Found navigation path:', d);

        // Find the button containing this path
        const button = path.closest('button');
        if (button) {
          console.log('🚑 EMERGENCY FIX: Found button for navigation path');

          // Remove existing listeners and add our own
          button.addEventListener('click', function(e) {
            console.log('🚑 EMERGENCY FIX: Navigation button clicked!');
            // Force clearing all icons
            const iconWrappers = document.querySelectorAll('.cwph-icon-wrapper');
            console.log(`🚑 EMERGENCY FIX: Clearing ${iconWrappers.length} icons`);
            iconWrappers.forEach(wrapper => wrapper.remove());

            // Show a confirmation
            setTimeout(() => {
              console.log('🚑 EMERGENCY FIX: Check completed after navigation');
              const remainingIcons = document.querySelectorAll('.cwph-icon-wrapper');
              console.log(`🚑 EMERGENCY FIX: ${remainingIcons.length} icons remaining after navigation`);
            }, 500);
          }, { capture: true });
        }
      }
    });

    // Also try to find button containers with SVG children
    const svgButtons = document.querySelectorAll('button svg');
    svgButtons.forEach((svg, i) => {
      const button = svg.closest('button');
      if (button) {
        console.log(`🚑 EMERGENCY FIX: Found SVG button ${i}:`, button.outerHTML.substring(0, 100));

        button.addEventListener('click', function(e) {
          console.log('🚑 EMERGENCY FIX: SVG button clicked!');
          // Force clearing all icons
          const iconWrappers = document.querySelectorAll('.cwph-icon-wrapper');
          console.log(`🚑 EMERGENCY FIX: Clearing ${iconWrappers.length} icons`);
          iconWrappers.forEach(wrapper => wrapper.remove());

          // Show a confirmation
          setTimeout(() => {
            console.log('🚑 EMERGENCY FIX: Check completed after navigation');
            const remainingIcons = document.querySelectorAll('.cwph-icon-wrapper');
            console.log(`🚑 EMERGENCY FIX: ${remainingIcons.length} icons remaining after navigation`);
          }, 500);
        }, { capture: true });
      }
    });

    console.log('🚑 EMERGENCY FIX: Setup complete');
  }
})();

// DIAGNOSTIC SCRIPT - Run immediately to debug the navigation buttons
console.log('DIAGNOSTIC SCRIPT STARTING - THIS SHOULD BE VISIBLE IN CONSOLE');

(function diagnosePage() {
  console.log('🔎 DIAGNOSTIC: Analyzing page for navigation buttons');

  // Log all buttons on the page
  setTimeout(() => {
    console.log('DELAYED DIAGNOSTIC - Should appear after 2 seconds');

    const allButtons = document.querySelectorAll('button');
    console.log(`🔎 DIAGNOSTIC: Found ${allButtons.length} buttons on page`);

    allButtons.forEach((button, index) => {
      console.log(`🔎 DIAGNOSTIC: Button ${index}:`, {
        html: button.outerHTML.substring(0, 200),
        hasSvg: !!button.querySelector('svg'),
        text: button.textContent.trim(),
        classes: button.className,
        hasPath: !!button.querySelector('path')
      });

      // Force an ultra high-priority click listener on each button
      button.addEventListener('click', (e) => {
        console.log(`🚨 DIAGNOSTIC: Button ${index} was clicked!`, button.outerHTML.substring(0, 200));
        // Don't prevent default or stop propagation
      }, { capture: true });
    });
  }, 2000);

  // Add a global click listener to track ANY click on the page
  document.addEventListener('click', (e) => {
    console.log('🚨 DIAGNOSTIC: Click detected on element:', e.target, {
      tagName: e.target.tagName,
      className: e.target.className,
      id: e.target.id,
      innerHTML: e.target.innerHTML?.substring(0, 100)
    });
  }, { capture: true });
})();

// Simple function to clear all icons - direct implementation for diagnostic purposes
function clearAllIcons() {
  console.log('Clearing all icons directly');
  const iconWrappers = document.querySelectorAll('.cwph-icon-wrapper');
  iconWrappers.forEach(wrapper => wrapper.remove());
  console.log(`Removed ${iconWrappers.length} icons`);
}

// Direct global event handler for all buttons with svg - highest priority approach
window.addEventListener('load', () => {
  console.log('Window load event - attaching emergency handlers');

  // Find all SVG buttons after page is fully loaded
  setTimeout(() => {
    const allSvgButtons = document.querySelectorAll('button svg');
    console.log(`Found ${allSvgButtons.length} SVG buttons after window load`);

    allSvgButtons.forEach((svg, i) => {
      const button = svg.closest('button');
      if (button) {
        button.addEventListener('click', () => {
          console.log(`SVG Button ${i} clicked from window load handler!`);
          alert('SVG button clicked! This confirms the event was captured.');
          clearAllIcons();
        }, { capture: true });
      }
    });
  }, 1000);
});

// Track the current date to detect navigation
let currentDateText = '';
let lastWeekSelector = null;

// Function to clear all image icon buttons
function clearIcons(reason) {
  console.log(`🧹 Clearing icons: ${reason}`);
  const existingWrappers = document.querySelectorAll('.cwph-icon-wrapper');
  let count = 0;
  existingWrappers.forEach(wrapper => {
    wrapper.remove();
    count++;
  });
  console.log(`🧹 Removed ${count} icons from page`);
}

// Function to check if date has changed and update tracking
function checkForDateChange() {
  // Look for date elements in the header or week selector
  const weekSelector = document.querySelector('[class*="weekSelector"]');
  const dateText = weekSelector?.textContent?.trim() || '';

  console.log('Checking for date change. Current week selector:', weekSelector);

  // First check for changed week selector content
  if (lastWeekSelector && weekSelector && lastWeekSelector.textContent !== weekSelector.textContent) {
    console.log('📅 Week selector content changed from:', lastWeekSelector.textContent, 'to:', weekSelector.textContent);
    clearIcons('week selector content changed');
    lastWeekSelector = weekSelector;
    currentDateText = dateText;
    return true;
  }

  // Store reference to current week selector for future comparisons
  if (weekSelector) {
    lastWeekSelector = weekSelector;
  }

  // Look for date elements in any other places
  const dateElements = document.querySelectorAll('h3, .date-text, [class*="date"]');
  let newDateText = dateText;

  // Try to find a date-like element if week selector wasn't found
  if (!newDateText) {
    for (const el of dateElements) {
      const text = el.textContent?.trim();
      if (text && /\d{1,2}[./-]\d{1,2}[./-]?(\d{2,4})?/.test(text)) {
        newDateText = text;
        break;
      }
    }
  }

  // If date text has changed, remove icons
  if (currentDateText && newDateText && currentDateText !== newDateText) {
    console.log('📅 Date changed from', currentDateText, 'to', newDateText);
    clearIcons('date text changed');
    currentDateText = newDateText;
    return true;
  }

  // Update the current date text
  if (newDateText) {
    currentDateText = newDateText;
  }

  return false;
}

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

  // First approach: Try to find the week selector wrapper which contains both date and navigation
  const weekSelectorWrapper = document.querySelector('div[class*="weekSelector"], div[class*="plasmic_page_wrapper"]');

  // Create our button
  const btn = document.createElement('button');
  btn.id = 'cwph-add';
  btn.textContent = 'Add Images';

  // Create a floating button div that is positioned at the bottom right of the screen
  // This avoids conflict with the logo in the top right
  const btnContainer = document.createElement('div');
  btnContainer.style.position = 'fixed';
  btnContainer.style.bottom = '20px'; // Position at bottom instead of top
  btnContainer.style.right = '20px';
  btnContainer.style.zIndex = '99999';
  btnContainer.style.display = 'flex';
  btnContainer.style.alignItems = 'center';
  btnContainer.style.justifyContent = 'center';
  btnContainer.appendChild(btn);

  // Add event listener to the button
  btn.addEventListener('click', () => {
    // Tell our system user is intentionally adding icons
    if (typeof userActions !== 'undefined') {
      userActions.startAddingIcons();
    }

    // Then proceed with adding images
    addImagesToMeals();
  });

  // Add the container to the body
  document.body.appendChild(btnContainer);
  console.log('Added floating Add Images button to the page (bottom right)');
  return true;
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
      padding: 10px 16px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 14px;
      transition: background-color 0.2s, transform 0.1s;
    }

    #cwph-add:hover {
      background-color: #3367d6;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    }

    #cwph-add:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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

    // Check if we're on the menu page
    const { isMenuPage } = detectCurrentPage();
    if (!isMenuPage) {
      console.log('Not on menu page. Skipping menu enhancement.');
      return;
    }

    // Log the entire document structure for debugging
    console.log('Document structure:', {
      title: document.title,
      url: window.location.href,
      bodyChildren: document.body.children.length
    });

    // Check if date text exists and track it
    checkForDateChange();

    // Don't wait for the menu if it might not be present
    try {
      await waitForMenu(document, 5000); // Shorter timeout
      console.log('Menu element found');
    } catch (e) {
      console.log('Menu waiting timed out, continuing anyway');
    }

    injectButtonStyles();

    // Inject the button - since our new approach always succeeds, we don't need a fallback
    injectAddImagesButton();

    // Set up mutation observer to watch for DOM changes
    const root = document.getElementById('root') || document.body;
    if (root) {
      const observer = new MutationObserver((mutations) => {
        // Check if date has changed
        checkForDateChange();

        for (const mutation of mutations) {
          // Check for added nodes that might be a new menu after date change
          for (const node of mutation.addedNodes) {
            if (
              node.nodeType === 1 &&
              node.className &&
              typeof node.className === 'string' &&
              (
                node.className.startsWith('PlasmicMenuplanmanagement_') ||
                node.className.includes('Plasmic') ||
                node.className.includes('menu')
              )
            ) {
              console.log('Menu content changed, likely due to date navigation');
              // Remove all existing image wrappers first
              const existingWrappers = document.querySelectorAll('.cwph-icon-wrapper');
              existingWrappers.forEach(wrapper => wrapper.remove());

              // Then check if we need to re-add the "Add Images" button
              if (!document.getElementById('cwph-add')) {
              console.log('Menu changed, reinjecting button');
              injectAddImagesButton();
              }
              return;
            }
          }

          // Also check for changes in the dates in the header which might indicate date navigation
          if (mutation.target &&
              mutation.target.className &&
              typeof mutation.target.className === 'string' &&
              (mutation.target.className.includes('date') ||
               mutation.target.className.includes('navigation'))) {
            console.log('Date navigation detected');
            // Remove all existing image wrappers
            const existingWrappers = document.querySelectorAll('.cwph-icon-wrapper');
            existingWrappers.forEach(wrapper => wrapper.remove());
          }
        }
      });
      observer.observe(root, { childList: true, subtree: true, characterData: true });

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

// Export functions for testing
export {
  injectAddImagesButton,
  injectButtonStyles,
  enhanceMenu,
  handleSearch,
  addImagesToMeals,
  openModal,
  closeModal,
  fetchImages,
  waitForMenu
};
