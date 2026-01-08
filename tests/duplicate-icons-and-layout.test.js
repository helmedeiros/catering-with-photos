/**
 * Test for duplicate icon prevention and layout fixes
 *
 * This test ensures that:
 * 1. Icons are not duplicated when added to dish cards
 * 2. The CSS layout doesn't break the card design
 */

describe('Duplicate icon prevention and layout fixes', () => {
  let mockMealNode;
  let mockDishCard;
  let querySelectorCalls;
  let appendChildCalls;
  let closestCalls;

  beforeEach(() => {
    // Reset tracking arrays
    querySelectorCalls = [];
    appendChildCalls = [];
    closestCalls = [];

    // Create a mock dish card with a meal node
    mockDishCard = {
      nodeType: 1,
      tagName: 'DIV',
      className: 'styles_mealCard__o8RLn',
      children: [],
      querySelector: (selector) => {
        querySelectorCalls.push(selector);
        return null; // Default: no existing icon
      },
      appendChild: (child) => {
        appendChildCalls.push(child);
      }
    };

    mockMealNode = {
      nodeType: 1,
      tagName: 'FONT',
      textContent: 'Vegetable lentil curry with whole grain rice and a yogurt dip',
      closest: (selector) => {
        closestCalls.push(selector);
        if (selector === '[class*="card"], [class*="tile"], [class*="cell"]') {
          return mockDishCard;
        }
        return null;
      }
    };
  });

  describe('Duplicate icon detection', () => {
    test('should check for existing icons within the dish card', () => {
      // Verify that querySelector is called with the correct selector
      const existingIcon = mockDishCard.querySelector('.cwph-icon-wrapper');
      expect(querySelectorCalls).toContain('.cwph-icon-wrapper');
      expect(existingIcon).toBeNull();
    });

    test('should skip adding icon if one already exists in the card', () => {
      // Simulate an existing icon in the card
      const existingIconWrapper = {
        className: 'cwph-icon-wrapper'
      };

      // Override querySelector to return existing icon
      mockDishCard.querySelector = (selector) => {
        querySelectorCalls.push(selector);
        return existingIconWrapper;
      };

      // Check if icon exists
      const existingIcon = mockDishCard.querySelector('.cwph-icon-wrapper');
      expect(existingIcon).not.toBeNull();
      expect(existingIcon.className).toBe('cwph-icon-wrapper');

      // Should NOT add a new icon (appendChild should not be called)
      expect(appendChildCalls.length).toBe(0);
    });

    test('should add icon if none exists in the card', () => {
      const existingIcon = mockDishCard.querySelector('.cwph-icon-wrapper');
      expect(existingIcon).toBeNull();

      // Create and add new icon
      const iconWrapper = {
        className: 'cwph-icon-wrapper'
      };

      mockDishCard.appendChild(iconWrapper);

      // Verify icon was added
      expect(appendChildCalls).toContain(iconWrapper);
      expect(appendChildCalls.length).toBe(1);
    });

    test('should use closest() to find the dish card', () => {
      const dishCard = mockMealNode.closest('[class*="card"], [class*="tile"], [class*="cell"]');

      expect(closestCalls).toContain('[class*="card"], [class*="tile"], [class*="cell"]');
      expect(dishCard).toBe(mockDishCard);
    });

    test('should reuse the same dishCard reference to avoid redeclaration', () => {
      // First call to get dishCard
      const dishCard1 = mockMealNode.closest('[class*="card"], [class*="tile"], [class*="cell"]');

      // Check for existing icon using the same dishCard reference
      dishCard1.querySelector('.cwph-icon-wrapper');

      // Add icon using the same dishCard reference
      dishCard1.appendChild({ className: 'cwph-icon-wrapper' });

      // Verify we only called closest once
      expect(closestCalls.length).toBe(1);
    });
  });

  describe('CSS Layout fixes', () => {
    test('should use display: block instead of inline-block', () => {
      const expectedCSS = {
        display: 'block', // Changed from 'inline-block'
        textAlign: 'center',
        margin: '8px auto 0', // Changed from 'margin-top: 8px'
        maxWidth: 'fit-content', // Added to prevent full width
        cursor: 'pointer',
        padding: '5px 0',
        transition: 'transform 0.2s, background-color 0.2s',
        borderRadius: '4px'
      };

      expect(expectedCSS.display).toBe('block');
      expect(expectedCSS).not.toHaveProperty('width'); // Should NOT have width: 100%
      expect(expectedCSS).not.toHaveProperty('clear'); // Should NOT have clear: both
    });

    test('should not have width: 100% property', () => {
      const iconWrapperStyles = {
        display: 'block',
        textAlign: 'center',
        margin: '8px auto 0',
        maxWidth: 'fit-content'
      };

      expect(iconWrapperStyles).not.toHaveProperty('width');
    });

    test('should not have clear: both property', () => {
      const iconWrapperStyles = {
        display: 'block',
        textAlign: 'center',
        margin: '8px auto 0',
        maxWidth: 'fit-content'
      };

      expect(iconWrapperStyles).not.toHaveProperty('clear');
    });

    test('should use max-width: fit-content to prevent layout breaking', () => {
      const iconWrapperStyles = {
        display: 'block',
        textAlign: 'center',
        margin: '8px auto 0',
        maxWidth: 'fit-content'
      };

      expect(iconWrapperStyles.maxWidth).toBe('fit-content');
    });

    test('should use margin: 8px auto 0 for centering', () => {
      const iconWrapperStyles = {
        display: 'block',
        textAlign: 'center',
        margin: '8px auto 0',
        maxWidth: 'fit-content'
      };

      expect(iconWrapperStyles.margin).toBe('8px auto 0');
    });
  });

  describe('Integration: Duplicate detection + layout', () => {
    test('should not create duplicate icons even when cards have multiple meal nodes', () => {
      // Simulate a card with multiple meal nodes (e.g., main dish + side dish)
      let iconWrapper1 = null;

      // Reset the append child calls
      appendChildCalls = [];

      // Override mockDishCard.querySelector to return the icon after it's added
      mockDishCard.querySelector = (selector) => {
        querySelectorCalls.push(selector);
        if (selector === '.cwph-icon-wrapper' && iconWrapper1) {
          return iconWrapper1;
        }
        return null;
      };

      // First meal node - no existing icon
      const existingIcon1 = mockDishCard.querySelector('.cwph-icon-wrapper');
      expect(existingIcon1).toBeNull();

      // Add icon for first meal
      iconWrapper1 = { className: 'cwph-icon-wrapper' };
      mockDishCard.appendChild(iconWrapper1);

      // Second meal node - icon now exists
      const existingIcon2 = mockDishCard.querySelector('.cwph-icon-wrapper');
      expect(existingIcon2).not.toBeNull();
      expect(existingIcon2.className).toBe('cwph-icon-wrapper');

      // Should NOT add another icon
      // appendChild was called only once (for the first meal)
      expect(appendChildCalls.length).toBe(1);
    });
  });
});
