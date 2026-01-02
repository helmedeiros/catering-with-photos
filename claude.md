# Catering with Photos - Chrome Extension

## Project Overview

**Catering with Photos** is a Chrome extension (Manifest v3) that enhances the Z-Catering meal selection interface at https://bestellung.z-catering.de/app/menuplan by displaying food images next to menu items. It helps kids and parents make more informed meal choices by showing visual representations of dishes.

**Current Version:** 1.1.35

---

## Project Architecture

### File Structure

```
catering-with-photos/
├── manifest.json              # Extension manifest (v3)
├── background.js              # Service worker for CORS proxy
├── content-script.js          # Main content script (non-module version)
├── content.js                 # (Legacy/backup)
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup logic and event handlers
├── package.json               # NPM dependencies and scripts
├── babel.config.js            # Babel configuration for tests
├── jest-puppeteer.config.js   # Puppeteer configuration
├── scripts/
│   ├── build.js              # Build script (version updates, timestamps)
│   └── convert-module.js     # Converts content script to module format
├── tests/
│   ├── setupJest.js          # Jest setup
│   ├── utils/                # Test utilities
│   ├── components/           # Component tests
│   ├── e2e/                  # End-to-end tests with Puppeteer
│   └── *.test.js             # Unit tests
└── utils/                     # Utility modules (cache, image-scraper, etc.)
```

### Key Components

1. **content-script.js** - Main content script that:
   - Detects the Z-Catering menu page
   - Injects a "Show dishes" button
   - Adds image search icons (🔍) next to menu items
   - Opens modals with food images from Google Images
   - Manages image caching in localStorage
   - Handles navigation and DOM changes

2. **background.js** - Service worker that:
   - Acts as a CORS proxy for fetching Google Images
   - Handles proxy requests from content script

3. **popup.js** - Extension popup that provides:
   - Manual search functionality
   - Enhance menu button
   - Search history (last 10 searches)
   - Language toggle (EN/DE)
   - Clear cache button

4. **utils/** - Shared utilities:
   - `cache.js` - Image caching with 30-day expiration
   - `image-scraper.js` - Google Images scraping logic
   - `dom-utils.js` - DOM manipulation helpers
   - `proxy.js` - CORS proxy helpers

---

## How to Use the Project

### Installation (Development)

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Load the extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

### Using the Extension

1. Navigate to https://bestellung.z-catering.de/app/menuplan
2. Log in and select a student/date
3. Click the floating "Show dishes" button (bottom-right)
4. Click the 🔍 "View dish" icons to see food images
5. Use the extension icon in the toolbar for:
   - Manual searches
   - Enhanced menu viewing
   - Viewing search history
   - Clearing cache

---

## How to Build

### Build Command

```bash
npm run build
```

**What the build does:**
- Auto-increments patch version in `manifest.json`
- Updates version number in all files (content-script.js, popup.html, etc.)
- Updates build timestamp
- Converts content-script.js to module format for testing

### Build with Custom Version

```bash
npm run build -- --version=1.2.0
```

### Create Distribution Package

```bash
npm run package
```

**This runs:**
1. `npm run build` - Builds the extension
2. `npm run zip` - Creates a versioned zip file (e.g., `catering-with-photos-v1.1.35.zip`)

The zip excludes:
- `.git*` files
- `node_modules/`
- `*.zip` files
- Test files
- Build scripts

---

## How to Test

### Run All Tests

```bash
npm test
```

This runs both unit tests and E2E tests sequentially.

### Unit Tests Only

```bash
npm run test:unit
```

**What it tests:**
- DOM utilities
- Cache functions
- Image scraper
- Modal components
- Background script
- Popup logic
- Content script functions

### E2E Tests Only

```bash
npm run test:e2e
```

**What it tests:**
- Chrome extension loading
- Button injection
- Icon rendering
- Modal interactions
- Image scraping
- Navigation handling
- Re-injection scenarios

**Requirements:**
- Starts a local HTTP server on port 5050
- Uses Puppeteer to control headless Chrome
- Tests against fixture HTML files in `tests/e2e/fixtures/`

### Test Infrastructure

**Jest Configuration:**
- Two projects: "Unit Tests" and "E2E Tests"
- Unit tests use jsdom environment
- E2E tests use jest-puppeteer preset
- Setup file: `tests/setupJest.js`

**Test Scripts:**
- `test:with-script` - Prepares content script, runs tests, cleans up
- `prepare-tests` - Copies and converts content-script.js
- `clean-tests` - Removes temporary test files

---

## How to Deploy

### Manual Deployment to Chrome Web Store

1. **Build and package:**
   ```bash
   npm run package
   ```

2. **Upload to Chrome Web Store:**
   - Go to https://chrome.google.com/webstore/devconsole
   - Select your extension (or create new)
   - Upload the generated `.zip` file
   - Fill in store listing details
   - Submit for review

3. **Version management:**
   - Update version in `manifest.json` before building
   - Chrome Web Store requires incrementing version numbers

### CI/CD (GitHub Actions)

The project has a GitHub Actions workflow (`.github/workflows/test.yml`) that:
- Runs on push and PR to `main`
- Sets up Node.js 20
- Installs dependencies with `npm ci`
- Runs all tests

**Note:** There's no automated deployment. Tests must pass before manual deployment.

---

## Development Workflow

### Making Changes

1. **Edit source files** (content-script.js, popup.js, etc.)
2. **Run tests** to ensure nothing breaks:
   ```bash
   npm test
   ```
3. **Build** to update version and timestamps:
   ```bash
   npm run build
   ```
4. **Reload extension** in Chrome:
   - Go to `chrome://extensions`
   - Click the reload icon on your extension

### Adding Features

1. Update relevant source files
2. Write tests (unit and/or E2E)
3. Update `spec.md` if architecture changes
4. Run `npm test` to verify
5. Commit changes with descriptive message

### Debugging

**Content Script:**
- Open DevTools on the Z-Catering page
- Check console for logs (extension logs with green badge)
- Use `window.cwphEnhanceMenu()` to manually trigger enhancement

**Background Script:**
- Go to `chrome://extensions`
- Click "Service worker" link under your extension
- Check logs for CORS proxy activity

**Popup:**
- Right-click extension icon → "Inspect popup"
- Check console for popup.js logs

---

## Key Configuration

### Permissions (manifest.json)

- `activeTab` - Access to current tab
- `storage` - For caching and history

### Host Permissions

- `https://bestellung.z-catering.de/*` - Target site
- `http://localhost:*/*` - Local testing
- `https://*.google.com/*` - Google Images search
- `https://*.gstatic.com/*` - Google static content
- `https://source.unsplash.com/*` - Fallback images
- `https://images.unsplash.com/*` - Fallback images

### Storage Keys

- `cwph-cache` - Image cache (localStorage)
- `cwph-history` - Search history (chrome.storage.local)
- `cwph-language` - Language preference (chrome.storage.local)

---

## Important Notes

### Security Features

- **Domain restriction:** Only runs on `bestellung.z-catering.de` and localhost
- **SafeSearch:** Enabled for all Google Images searches
- **No telemetry:** All data stored locally
- **CORS proxy:** Background script bypasses CORS for image fetching

### Known Limitations

- Google Images scraping may break if Google changes HTML structure
- Cache limited to 100 entries (LRU eviction)
- No dark mode
- Extension disabled outside Z-Catering domain

### Browser Support

- Chrome/Chromium only (Manifest v3)
- Tested on Chrome 91+
- Node.js 20+ for development

---

## Troubleshooting

### Extension Not Loading
- Check manifest.json is valid JSON
- Verify permissions in manifest
- Check Chrome DevTools for errors

### Icons Not Appearing
- Check if on correct domain (bestellung.z-catering.de)
- Open console and look for page detection logs
- Try clicking "Show dishes" button manually

### Images Not Loading
- Check network tab for failed requests
- Verify CORS proxy is working (check service worker logs)
- Clear cache with "Clear cache" button in popup

### Tests Failing
- Run `npm ci` to ensure clean dependencies
- Check Node.js version (should be 20+)
- For E2E tests, ensure port 5050 is available

---

## Recent Changes

See git log for full history. Recent improvements include:
- Security restriction to Z-Catering domain only
- Improved clickability of "View dish" elements
- User-friendly button and label text updates
- Increased image search results from 5 to 15

---

## Contributing

1. Create a feature branch
2. Make changes and add tests
3. Ensure `npm test` passes
4. Submit PR to `main`
5. CI will run tests automatically

---

## Commit Guidelines

**IMPORTANT:** This repository must NOT include any references to AI assistance, Claude Code, Anthropic, or AI co-authorship in commits.

- Do NOT add "Co-Authored-By: Claude" or similar footers
- Do NOT mention AI tools in commit messages
- Do NOT include "Generated with Claude Code" badges or links
- All commits should appear as authored solely by the repository owner

---

## License

See LICENSE file in repository.
