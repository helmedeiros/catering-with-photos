# ✅ TODO Checklist — Catering with Photos

Track your step-by-step progress through development using this checklist.
Each task maps directly to a prompt from `prompt_plan.md`.

---

## 🧱 M0 · Project Scaffold

- [x] S0‑1: Create `package.json` and lint config
- [x] S0‑2: Add `manifest.json` with minimal fields
- [x] S0‑3: Set up Jest + Puppeteer

## 🔍 M1 · Content Detection

- [x] S1‑1: Implement `waitForMenu` util
- [x] S1‑2: Inject "Add Images" button into top bar
- [x] S1‑3: Re-inject button on dynamic page changes
- [x] S1‑4: Style the "Add Images" button
- [x] S1‑5: E2E test for dynamic reinjection

## 🖼️ M2 · Icon Injection

- [x] S2‑1: Scan meals and add 🔍 icons
- [x] S2‑2: Add click handler stub
- [ ] S2‑3: Style the icon
- [ ] S2‑4: E2E: icons injected properly

## 💬 M3 · Modal Viewer

- [ ] S3‑1: Create modal shell
- [ ] S3‑2: Add dummy images in modal
- [ ] S3‑3: Add close button
- [ ] S3‑4: Implement focus trap and scroll lock
- [ ] S3‑5: E2E modal flow

## 🔍 M4 · Image Scraper

- [ ] S4‑1: Create Google Images scraper util
- [ ] S4‑2: Connect scraper to modal display
- [ ] S4‑3: Add "See more on Google" link
- [ ] S4‑4: Add network error handling
- [ ] S4‑5: E2E image scrape test

## 💾 M5 · Caching Layer

- [ ] S5‑1: Create localStorage cache util
- [ ] S5‑2: Use cache in scraper
- [ ] S5‑3: Add TTL to cache
- [ ] S5‑4: E2E cache efficiency test

## 🧰 M6 · Toolbar Popup

- [ ] S6‑1: Create `popup.html` with layout
- [ ] S6‑2: Wire up popup JS logic
- [ ] S6‑3: Implement manual image search
- [ ] S6‑4: Implement "Enhance Menu" button
- [ ] S6‑5: Add and render history list

## 🌐 M7 · Localization

- [ ] S7‑1: Add `en.json` and `de.json` locale files
- [ ] S7‑2: Create `t()` translation util
- [ ] S7‑3: Language toggle in popup
- [ ] S7‑4: Translate content and modal strings
- [ ] S7‑5: E2E German language test

## 🚨 M8 · Error Handling

- [ ] S8‑1: Add global error display util
- [ ] S8‑2: Wrap async logic with error hooks
- [ ] S8‑3: Optional: Add error analytics

## 🎯 M9 · End-to-End Polish

- [ ] S9‑1: Finalize and polish CSS
- [ ] S9‑2: Add accessibility and ARIA
- [ ] S9‑3: Full E2E test on fixture page
- [ ] S9‑4: Build script + CI README badges

---

To check off an item, replace `[ ]` with `[x]` as you complete each step.
