describe('Chrome Extension Smoke Test', () => {
  beforeAll(async () => {
    await page.goto('about:blank');
  });

  it('should load blank page with empty title', async () => {
    const title = await page.title();
    expect(title).toBe('');
  });
});
