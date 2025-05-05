describe('E2E: Add Images button reinjection (S1-5)', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:5050/tests/e2e/fixture-menu.html');
  });

  it('shows Add Images button after menu loads', async () => {
    await page.waitForSelector('#cwph-add', { timeout: 2000 });
    const btnText = await page.$eval('#cwph-add', el => el.textContent);
    expect(btnText).toBe('Add Images');
  });

  it('re-injects Add Images button after menu DOM is replaced', async () => {
    // Remove the button and menu, then add a new menu node
    await page.evaluate(() => {
      document.getElementById('cwph-add')?.remove();
      const oldMenu = document.querySelector('.PlasmicMenuplanmanagement_menu');
      if (oldMenu) oldMenu.remove();
      const newMenu = document.createElement('div');
      newMenu.className = 'PlasmicMenuplanmanagement_newmenu';
      document.getElementById('root').appendChild(newMenu);
    });
    // Wait for reinjection
    await page.waitForSelector('#cwph-add', { timeout: 2000 });
    const btnText = await page.$eval('#cwph-add', el => el.textContent);
    expect(btnText).toBe('Add Images');
  });
});
