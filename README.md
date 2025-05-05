# catering-with-photos

z-catering-with-photos

# 🍽️ Catering with Photos — Chrome Extension

**Catering with Photos** is a Chrome extension that enhances the meal selection interface on [Z-Catering](https://bestellung.z-catering.de/app/menuplan) by displaying relevant food images next to each menu item. It's designed to help kids (and parents) make more informed and engaging meal choices.

---

## 🚀 Features

- Adds a small icon 🔍 next to each menu item
- Clicking the icon opens a modal with 3–5 food images
- SafeSearch enabled to block adult content
- "See more on Google" link in modal
- Floating command panel with:
  - Manual search by dish name
  - One-click enhancement for current menu
  - Recently searched items
  - Language toggle (English / German)
- Image results are cached locally for speed

---

## 🔧 Installation

1. Clone or download this repository
2. Go to `chrome://extensions` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select this project's folder

---

## 🧠 Usage

1. Log in to [Z-Catering](https://bestellung.z-catering.de/app/menuplan)
2. Wait for the weekly menu to load
3. Click the "Add Images" button near the date selector
4. Explore the meals visually with the 🔍 icons
5. Use the extension icon in the Chrome toolbar for advanced features

---

## 🛠️ Tech Overview

- **Manifest v3**
- `content.js` dynamically injects UI and observes DOM changes
- `popup.js` controls the floating panel
- Image scraping via `fetch()` with SafeSearch
- Results parsed from Google Images result HTML
- Caching via `localStorage`
- Fully client-side, no external backend

---

## 🧪 Testing Plan

- ✅ Tested on macOS and Windows
- ✅ Confirmed cache works between days
- ✅ Manual searches return proper image sets
- ✅ Switching users (children) retains functionality

---

## 🌍 Localization

- English (default)
- German (via browser or toggle in UI)

---

## 📌 Limitations

- No dark mode yet
- Caching cannot be cleared (planned for future)
- Scraping is best-effort — may break if Google changes structure

---

## 📅 Future Plans

- Auto-enhance menu on load
- Cache expiration and management
- Backend proxy for more stable scraping
- Dark mode styling

---

## 👨‍👩‍👧‍👦 Made with ❤️ for kids and parents who want meals to be less of a mystery.
