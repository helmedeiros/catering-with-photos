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
    // Optionally, check that each icon is inside a meal node
    const allIconsInMeals = await page.$$eval('.meal-name', meals =>
      meals.every(meal => meal.querySelector('.cwph-icon'))
    );
    expect(allIconsInMeals).toBe(true);
  });
});
