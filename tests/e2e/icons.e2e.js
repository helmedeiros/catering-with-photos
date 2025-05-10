describe('E2E: Icon injection (S2-4)', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:5050/tests/e2e/fixture-menu.html');
  });

  it('injects a .cwph-icon for each meal node after clicking Show dishes', async () => {
    await page.waitForSelector('#cwph-add', { timeout: 2000 });
    await page.click('#cwph-add');
    // Wait for icons to be injected
    await page.waitForSelector('.cwph-icon', { timeout: 2000 });
    const mealCount = await page.$$eval('.meal-name', nodes => nodes.length);
    const iconCount = await page.$$eval('.cwph-icon', nodes => nodes.length);
    expect(iconCount).toBeGreaterThanOrEqual(1); // At least one icon is added

    // Get the wrappers - should be at least one
    const wrapperCount = await page.$$eval('.cwph-icon-wrapper', nodes => nodes.length);
    expect(wrapperCount).toBeGreaterThanOrEqual(1);

    // Check that the icon labels exist and have the correct text
    const labelCount = await page.$$eval('.cwph-icon-label', nodes => nodes.length);
    expect(labelCount).toBe(mealCount);

    const labelText = await page.$eval('.cwph-icon-label', node => node.textContent);
    expect(labelText).toBe('View dish');

    // Verify that icons are in wrappers next to meal nodes, not inside meal nodes
    const iconsNotInMeals = await page.$$eval('.meal-name', meals =>
      meals.every(meal => !meal.querySelector('.cwph-icon'))
    );
    expect(iconsNotInMeals).toBe(true);
  });

  it('prevents duplicate icons when clicking Show dishes multiple times', async () => {
    await page.waitForSelector('#cwph-add', { timeout: 2000 });

    // Count the initial number of meal nodes
    const mealCount = await page.$$eval('.meal-name', nodes => nodes.length);

    // Click Show dishes button multiple times
    for (let i = 0; i < 3; i++) {
      await page.click('#cwph-add');
      // Use setTimeout with a Promise instead of waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Count the number of icon wrappers
    const wrapperCount = await page.$$eval('.cwph-icon-wrapper', nodes => nodes.length);

    // Verify that the number of wrappers matches the number of meal nodes
    // (no duplicates were created)
    expect(wrapperCount).toBe(mealCount);

    // Count the number of icon elements
    const iconCount = await page.$$eval('.cwph-icon', nodes => nodes.length);
    expect(iconCount).toBe(mealCount);

    // Count the number of label elements
    const labelCount = await page.$$eval('.cwph-icon-label', nodes => nodes.length);
    expect(labelCount).toBe(mealCount);
  });

  it('does not add icons to navigation elements', async () => {
    // First make sure icons are added to the page
    await page.evaluate(() => {
      window.addImagesToMeals();
    });

    // Wait for icons to be added
    await page.waitForSelector('.cwph-icon-wrapper');

    // Create a selector that specifically looks for a standalone "View dish" text
    const navigationIconsCount = await page.$$eval('button .cwph-icon-label, [id*="next"] .cwph-icon-label', elements => elements.length);

    // Ensure no standalone wrappers exist
    expect(navigationIconsCount).toBe(0);
  });

  test('should not add a standalone icon at the bottom of the page', async () => {
    // First make sure icons are added to the page
    await page.evaluate(() => {
      window.addImagesToMeals();
    });

    // Wait for icons to be added
    await page.waitForSelector('.cwph-icon-wrapper');

    // Create a selector that specifically looks for a standalone "View dish" text
    // outside of a meal container
    const standaloneButton = await page.evaluate(() => {
      // Check if there are any icon wrappers directly in the document body
      // or at the end of the document
      const allElements = Array.from(document.querySelectorAll('*'));
      const menuContainer = document.querySelector('.PlasmicMenuplanmanagement_container');

      // Look for any icon wrappers that are outside of the menu container
      const standaloneWrappers = Array.from(document.querySelectorAll('.cwph-icon-wrapper'))
        .filter(wrapper => {
          // Check if this wrapper is in the menu container (OK)
          let parent = wrapper.parentNode;
          while (parent) {
            if (parent === menuContainer) {
              return false; // It's inside a menu container, so it's NOT standalone
            }
            parent = parent.parentNode;
          }
          return true; // It's not inside a menu container, so it IS standalone
        });

      return {
        count: standaloneWrappers.length,
        details: standaloneWrappers.map(wrapper => ({
          tagName: wrapper.tagName,
          className: wrapper.className,
          textContent: wrapper.textContent,
          parentTagName: wrapper.parentNode?.tagName || 'none',
          parentClassName: wrapper.parentNode?.className || 'none',
          path: getElementPath(wrapper)
        }))
      };

      // Helper function to get element path
      function getElementPath(el) {
        const path = [];
        let currentEl = el;

        while (currentEl && currentEl !== document.body) {
          let selector = currentEl.tagName.toLowerCase();
          if (currentEl.id) {
            selector += '#' + currentEl.id;
          } else if (currentEl.className) {
            selector += '.' + Array.from(currentEl.classList).join('.');
          }
          path.unshift(selector);
          currentEl = currentEl.parentNode;
        }

        return 'body > ' + path.join(' > ');
      }
    });

    console.log("Standalone buttons found:", JSON.stringify(standaloneButton, null, 2));

    // Ensure no standalone wrappers exist
    expect(standaloneButton.count).toBe(0);
  });
});
