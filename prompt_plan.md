# 📝 Prompt Plan — _Catering with Photos_ Chrome Extension

This document is a **blueprint for driving an LLM‑powered, test‑driven implementation** of the Chrome extension described in **SPEC.md**.
It progresses from high‑level milestones ➜ smaller iterative chunks ➜ atomic “right‑sized” development steps, each accompanied by a **prompt** you can feed to a code‑generation LLM (e.g., GPT‑4o) to create or update code **with accompanying tests**.

---

## 1 · High‑Level Milestones

|  Milestone                   |  Goal                                                     |  Why                            |
| ---------------------------- | --------------------------------------------------------- | ------------------------------- |
|  **M0 • Project Scaffold**   |  Repo skeleton, manifest v3, Jest+Puppeteer test harness  |  Establish dev & test baseline  |
|  **M1 • Content Detection**  |  Detect menu DOM & inject “Add Images” button             |  Foundation for UI enhancement  |
|  **M2 • Icon Injection**     |  Scan meals & add 🔍 icons                                |  User entry point per dish      |
|  **M3 • Modal Viewer**       |  Clickable icon opens centered modal w/ dummy data        |  UX shell before scraping       |
|  **M4 • Image Scraper**      |  Fetch & parse Google Images w/ SafeSearch                |  Core data acquisition          |
|  **M5 • Caching Layer**      |  `localStorage` read/write with TTL stubs                 |  Performance & quota guard      |
|  **M6 • Toolbar Popup**      |  Floating panel with manual search & language toggle      |  Global UX entry                |
|  **M7 • Localization**       |  i18n JSON & runtime switcher                             |  English & German support       |
|  **M8 • Error Handling**     |  Graceful messages for all failure cases                  |  Robustness                     |
|  **M9 • End‑to‑End Polish**  |  Visual styles, accessibility, final E2E tests            |  Ship‑ready extension           |

---

## 2 · Iterative Chunks → Smaller Steps

Below each milestone is **broken into steps** that can be completed in under ~30 min and validated by tests.

### M0 • Project Scaffold

1. Create `package.json` + lint config
2. Add `manifest.json` with minimal fields
3. Add Jest + Puppeteer setup for headless Chrome
4. Add GitHub Actions CI running tests on PR

### M1 • Content Detection

1. Add empty `content.js`, register in manifest
2. In `content.js`, wait for DOM _body_ load event
3. Implement `waitForMenu()` util using `MutationObserver`
4. Inject placeholder button after menu detected
5. Jest‑Puppeteer test: verify button appears

### M2 • Icon Injection

1. Parse visible meal items on demand
2. Append icon `<span>` outside each checkbox/label
3. Delegate click handler via event bubbling
4. Add basic styling to icon (cursor pointer, margin‑left)
5. Unit + E2E tests verify icons rendered

### M3 • Modal Viewer

1. Create overlay & modal components
2. Render hard‑coded images + close button
3. Implement focus trap and scroll lock
4. Style modal per design spec
5. Unit + E2E tests for open/close lifecycle

### M4 • Image Scraper

1. Write fetch util using SafeSearch URL
2. HTML‑parse thumbnails
3. Integrate scraper into modal flow
4. Add “See more on Google” link
5. Handle network/empty results gracefully
6. Unit tests with fixture HTML & mocks

### M5 • Caching Layer

1. Implement localStorage read/write helpers
2. Integrate cache in scraper path
3. Add TTL support constant (30 days)
4. Unit tests for cache hits, misses, expiry

### M6 • Toolbar Popup

1. Build popup.html UI skeleton
2. Wire popup.js to Chrome APIs
3. Implement manual search + enhance action
4. Render history list from storage
5. E2E test opening popup and actions

### M7 • Localization

1. Add i18n JSON resource files
2. Build translation util with fallback
3. Replace strings in content & popup
4. Add language selector UI
5. Tests for language switching

### M8 • Error Handling

1. Central error display util
2. Wrap async flows in try/catch + show errors
3. Style error banner red, dismissible
4. Unit tests for each error path

### M9 • End‑to‑End Polish

1. Final CSS tweaks & shadows
2. Accessibility audit via axe‑core
3. Full E2E workflow test suite
4. Build script bundling extension zip
5. CI pipeline, README badges, release notes

---

## 3 · Atomic Step Matrix

|  Step ID  |  Milestone  |  Description                     |  Tests                                          |
| --------- | ----------- | -------------------------------- | ----------------------------------------------- |
|  S0‑1     |  M0         |  Init repo & `package.json`      |  `npm test` passes (no tests yet)               |
|  S0‑2     |  M0         |  Add `manifest.json` skeleton    |  JSON schema validation                         |
|  S0‑3     |  M0         |  Add Jest+Puppeteer boilerplate  |  Headless Chrome launches                       |
|  S1‑1     |  M1         |  Emit `WaitForMenu` util         |  Unit: resolves within timeout on fixture HTML  |
|  S1‑2     |  M1         |  Inject button into top bar      |  E2E: button present after menu                 |
|  …        |  …          |  …                               |  …                                              |

_(the full table continues through S9‑4)_

---

## 4 · Prompt Series (LLM‑Ready)

Each **prompt block** is self‑contained: it summarizes context, specifies the file(s) to create/modify, and demands passing tests.
Feed prompts sequentially; the generated code + tests should _always_ leave the repo green.

### 🔹 Prompt `S0‑1` — Initialise repo

```text
You are GitHub Copilot. Create `package.json` for a Chrome‑extension project with:
- name `catering-with-photos`
- scripts: `test` runs Jest
- devDependencies: jest, puppeteer, eslint, prettier, cross-env
Produce only the JSON file.
```

### 🔹 Prompt `S0‑2` — Manifest skeleton

```text
Given the extension goals, create `manifest.json` (v3) with:
- `name`, `description`, `version`
- minimal permissions: `activeTab`
- `"manifest_version": 3`
No icons yet. Provide the full JSON.
```

### 🔹 Prompt `S0‑3` — Jest + Puppeteer

```text
Add Jest configuration (`jest-puppeteer.config.js`) and a first smoke test `tests/chrome.test.js` that:
1. Launches Chrome headless.
2. Opens `about:blank`.
3. Expects `page.title()` to be ''.
All tests must pass with `npm test`.
```

### 🔹 Prompt `S1‑1` — `waitForMenu` util

```text
Create `utils/dom-utils.js` exporting async `waitForMenu(root=document, timeout=10000)` that resolves when an element whose class starts with `PlasmicMenuplanmanagement_` appears in DOM or rejects on timeout. Add Jest unit test with JSDOM fixture.
```

### 🔹 Prompt `S1‑2` — Inject "Add Images" button

```text
Modify `content.js`:
- Call `waitForMenu()`.
- Locate the top‑bar element (selector `.sc-d-date-picker`).
- Append a `<button id="cwph-add">Add Images</button>`.
Unit test with JSDOM verifying insertion.
```

### 🔹 Prompt `S1‑3` — Re‑inject on dynamic page change

```text
Update `content.js`:
1. After initial enhancement, set up a `MutationObserver` on `#root`.
2. When elements with class starting `PlasmicMenuplanmanagement_` are added and no `#cwph-add` exists, re‑inject the button.
Add unit test using JSDOM mocking dynamic DOM changes.
```

### 🔹 Prompt `S1‑4` — Style the "Add Images" button

```text
Create `styles/button.css` and inject it via `chrome.scripting.insertCSS`.
Style: small blue button with border‑radius 4px, padding 4px 8px.
Write Jest DOM test that computed style contains `border-radius`.
```

### 🔹 Prompt `S1‑5` — E2E: re‑inject verification

```text
Add Puppeteer test:
1. Load fixture page simulating menu switch.
2. Verify button appears, then simulate DOM replacement, ensure button re‑appears.
```

---

### 🔹 Prompt `S2‑1` — Scan meals & add 🔍 icons

```text
In `content.js`, on "Add Images" click:
1. Query all `.PlasmicMenuplanmanagement_* .meal-name` nodes.
2. For each, append `<span class="cwph-icon" data-dish="...">🔍</span>` if not already present.
Add unit test with fixture HTML verifying icon count equals meal count.
```

### 🔹 Prompt `S2‑2` — Icon click stubs

```text
Add event delegation on `.cwph-icon`:
- On click, call `openModal(dishName, [])` (modal shows hard‑coded placeholder images for now).
Provide Jest DOM test verifying modal opens with 3 placeholder imgs.
```

### 🔹 Prompt `S2‑3` — Icon injection styles

```text
Create `styles/icon.css`: small cursor:pointer margin‑left:4px.
Ensure inserted via `insertCSS`. Test style applied via `getComputedStyle`.
```

### 🔹 Prompt `S2‑4` — E2E icons present

```text
Puppeteer test: after clicking "Add Images" on fixture, ensure each menu item has .cwph-icon.
```

---

### 🔹 Prompt `S3‑1` — Modal skeleton

```text
Create `components/modal.js` exporting `openModal(title, images)` and `closeModal()`.
Modal HTML: overlay div + modal div with h2 (title) and img container.
Add styles `styles/modal.css`.
Unit tests: open/close create/remove elements.
```

### 🔹 Prompt `S3‑2` — Dummy images integration

```text
Modify previous stub to pass ['img1.jpg','img2.jpg','img3.jpg'] and render thumbnails.
Unit test verifies img src attributes.
```

### 🔹 Prompt `S3‑3` — Close button

```text
Add ✖️ button top‑right; clicking triggers `closeModal`.
Add test: after click, modal removed.
```

### 🔹 Prompt `S3‑4` — Focus trap & scroll lock

```text
Inside `openModal`, add logic:
- store previous focus
- set `document.body.style.overflow='hidden'`
- return focus on close
Test with JSDOM for overflow style.
```

### 🔹 Prompt `S3‑5` — E2E modal flow

```text
Puppeteer: click 🔍 → waitForSelector '.cwph-modal' → click ✖️ → modal gone.
```

---

### 🔹 Prompt `S4‑1` — Image scraper fetch util

```text
Create `utils/image-scraper.js` exporting `fetchImages(query, count=5)`.
Use `fetch` to Google Images URL with SafeSearch.
Parse HTML using DOMParser, collect img src up to count.
Add Jest test with saved fixture HTML.
```

### 🔹 Prompt `S4‑2` — Integrate scraper into icon click

```text
Replace dummy array with `await fetchImages(dishName)`.
If returns empty, show 'No images found' paragraph.
Unit test mocking fetch.
```

### 🔹 Prompt `S4‑3` — See more link

```text
In modal, add anchor `See more on Google` pointing to Google Images search for the query, target=_blank.
Test anchor href correctness.
```

### 🔹 Prompt `S4‑4` — Network error handling

```text
Wrap fetch call try/catch. On error, display 'Try again later'.
Add unit test mocking fetch rejection.
```

### 🔹 Prompt `S4‑5` — Puppeteer scrape smoke test

```text
E2E: intercept network and serve fixture HTML to scraper, verify images rendered.
```

---

### 🔹 Prompt `S5‑1` — Cache util

```text
Create `utils/cache.js` exports `getCached(query)` & `setCached(query, images)`.
Store JSON string in localStorage under `cwph-cache`.
Unit tests for CRUD.
```

### 🔹 Prompt `S5‑2` — Use cache in scraper flow

```text
Modify `fetchImages`:
- If cache hit, return cached.
- On fetch success, call setCached.
Test: first call fetches, second uses cache (mock fetch count).
```

### 🔹 Prompt `S5‑3` — TTL field

```text
Extend cache record with `timestamp`. TTL constant (30d) but no eviction yet.
Test expiry logic util `isExpired`.
```

### 🔹 Prompt `S5‑4` — E2E cache speed

```text
Puppeteer: measure time first vs second click, expect >2x faster (rough assertion).
```

---

### 🔹 Prompt `S6‑1` — Popup HTML/CSS

```text
Add `popup.html` skeleton with search bar, buttons, history list, lang select. Style via `styles/popup.css`.
No JS yet.
```

### 🔹 Prompt `S6‑2` — Popup logic

```text
Create `popup.js`:
- On DOMContentLoaded, load history from storage.
- Handle language dropdown.
Unit test with jsdom-global simulating storage.
```

### 🔹 Prompt `S6‑3` — Manual search

```text
On form submit:
1. call `chrome.tabs.query({active:true,currentWindow:true})`
2. send message `{type:'SEARCH', query}` to content script.
Update tests using chrome-mock.
```

### 🔹 Prompt `S6‑4` — Enhance menu command

```text
Add button 'Enhance menu' in popup that sends `{type:'ENHANCE'}`.
Content script listens and triggers same logic as button click.
E2E: puppeteer open popup, click enhance, icons appear.
```

### 🔹 Prompt `S6‑5` — History list UI

```text
Save successful searches to storage under `cwph-history`.
Render list; clicking item resends search.
Test add & render.
```

---

### 🔹 Prompt `S7‑1` — i18n resource files

```text
Add `i18n/en.json` & `i18n/de.json` with keys: addImages, enhanceMenu, noImages, tryAgain.
```

### 🔹 Prompt `S7‑2` — Localization util

```text
Create `utils/i18n.js` exporting `t(key)` picking language from `chrome.i18n.getUILanguage()` or storage override.
Unit tests switching languages.
```

### 🔹 Prompt `S7‑3` — Language toggle

```text
In popup.js, implement dropdown storing preference in chrome.storage.
On change, rerender labels.
Test toggle behavior.
```

### 🔹 Prompt `S7‑4` — Translate content script labels

```text
Replace hard‑coded strings with `t()` in content.js and modal.
Test translation injection.
```

### 🔹 Prompt `S7‑5` — E2E German flow

```text
Puppeteer start Chrome with `--lang=de`, verify buttons text in German.
```

---

### 🔹 Prompt `S8‑1` — Global error handler

```text
Add `utils/error.js` with `showError(message, context='modal|popup')`.
Display red banner top of modal or popup.
Unit test DOM injection.
```

### 🔹 Prompt `S8‑2` — Hook errors

```text
Wrap all async handlers (scraper, cache) and call showError on reject.
Test rejecting fetch shows banner.
```

### 🔹 Prompt `S8‑3` — Error analytics log

```text
Optional: console.error playback; unit test spy called.
```

---

### 🔹 Prompt `S9‑1` — CSS polish

```text
Refine all CSS: rounded corners 8px, subtle box‑shadow, focus outlines.
Visual snapshot tests with jest-image-snapshot.
```

### 🔹 Prompt `S9‑2` — Accessibility

```text
Add aria‑labels, role=dialog, tabindex traps.
Run axe-core Puppeteer audit; fail test if violations.
```

### 🔹 Prompt `S9‑3` — Full E2E on live site (dummy)

```text
Puppeteer navigate to https://example.com/fixture-menu.html (offline clone) run through entire flow, expect green.
```

### 🔹 Prompt `S9‑4` — Build script & README badges

```text
Add npm script `build` using `zip` to create dist/catering-with-photos.zip.
Add GitHub Actions step uploading artifact.
Insert CI and build status badges into README.md.
Ensure all tests pass.
```

---

## 5 · Quality Checklist

- ✅ **Each step < 30 min** dev time
- ✅ **Tests at every step**
- ✅ **No orphan code** — features always wired & verified
- ✅ **LLM prompts explicit** (no gaps / hidden context)

---

> **Next Action:** Feed **Prompt `S0‑1`** to your code‑gen LLM and begin the TDD journey!
