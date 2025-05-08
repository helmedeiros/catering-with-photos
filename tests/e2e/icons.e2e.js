describe('E2E: Icon injection (S2-4)', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:5050/tests/e2e/fixture-menu.html');
  });

  it('injects a .cwph-icon for each meal node after clicking Add Images', async () => {
    await page.waitForSelector('#cwph-add', { timeout: 2000 });
    await page.click('#cwph-add');
    // Wait for icons to be injected
    await page.waitForSelector('.cwph-icon', { timeout: 2000 });
    const mealCount = await page.$$eval('.meal-name', nodes => nodes.length);
    const iconCount = await page.$$eval('.cwph-icon', nodes => nodes.length);
    expect(iconCount).toBe(mealCount);

    // Check that each icon is placed next to a meal node, not inside it
    const wrapperCount = await page.$$eval('.cwph-icon-wrapper', nodes => nodes.length);
    expect(wrapperCount).toBe(mealCount);

    // Check that the icon labels exist and have the correct text
    const labelCount = await page.$$eval('.cwph-icon-label', nodes => nodes.length);
    expect(labelCount).toBe(mealCount);

    const labelText = await page.$eval('.cwph-icon-label', el => el.textContent);
    expect(labelText).toBe('See Dish Photos');

    // Verify that icons are in wrappers next to meal nodes, not inside meal nodes
    const iconsNotInMeals = await page.$$eval('.meal-name', meals =>
      meals.every(meal => !meal.querySelector('.cwph-icon'))
    );
    expect(iconsNotInMeals).toBe(true);
  });

  it('prevents duplicate icons when clicking Add Images multiple times', async () => {
    await page.waitForSelector('#cwph-add', { timeout: 2000 });

    // Count the initial number of meal nodes
    const mealCount = await page.$$eval('.meal-name', nodes => nodes.length);

    // Click Add Images button multiple times
    for (let i = 0; i < 3; i++) {
      await page.click('#cwph-add');
      // Use a brief delay between clicks using setTimeout
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
});
