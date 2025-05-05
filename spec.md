# 🍽️ Chrome Extension Specification: Z-Catering Menu Image Enhancer

## 📌 Overview

This Chrome extension enhances the school meal selection experience on [z-catering.de](https://bestellung.z-catering.de/app/menuplan) by injecting clickable icons beside menu items that, when clicked, display a modal with food images retrieved from Google Images. It is designed to be lightweight, family-friendly, privacy-conscious, and visually appealing for kids.

---

## 🔗 Target Page

- **URL:** `https://bestellung.z-catering.de/app/menuplan`
- **Behavior:** Page is dynamically loaded after login; no URL changes when switching students or dates.

---

## 🔍 Core Features

### 1. **"Add Images" Button (Inline on Page)**

- Appears **only** after meal options are detected in the DOM.
- Injected into the **top bar**, near the **student/date selector**.
- When clicked:
  - Parses all visible meal options.
  - For each meal:
    - Adds a small 🔍 icon outside the selection box.
    - Clicking the icon opens a **centered modal overlay**:
      - Shows **3–5 thumbnail images** from Google Images.
      - Includes a **"See more on Google"** link (opens in a new tab).
      - Can be closed with a visible **✖️ button**.
    - Uses **SafeSearch** and caches results in `localStorage` keyed by dish name.
    - Falls back to a translated search if the first query fails (future version).

### 2. **Extension Icon (Floating UI Launcher)**

- Clicking the Chrome toolbar icon opens a **centered floating panel** with:
  - A **search bar** to manually search for dish images.
  - Action to “Enhance visible weekly menu.”
  - Display of recent search history.
  - Language toggle between English and German.
- Visual style matches screenshot inspiration:
  - Light background, rounded corners, drop shadow, clean layout.

---

## 🧠 Behavior Notes

- Scraping:
  - Uses fetch with SafeSearch enabled to pull Google Images thumbnails.
  - Limits results to 3–5 per query to stay lightweight and reduce blocking risk.
- Caching:
  - Meal image search results are cached locally.
  - Reduces repeated lookups for recurring dishes (important with two kids).
- Error Handling:
  - Shows user-friendly messages like:
    - “No images found”
    - “Try again later”
- Modal:
  - Centered, dark background.
  - Closes only when ✖️ is clicked — no auto-close on outside click.

---

## 🧱 Architecture & Technical Design

### File Structure

```
z-catering-menu-enhancer/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── styles/
│   ├── modal.css
│   └── popup.css
├── utils/
│   ├── dom-utils.js
│   ├── image-scraper.js
│   └── cache.js
└── assets/
    └── icon.png
```

### manifest.json

Chrome extension manifest v3 with:

- `permissions`: `activeTab`, `scripting`, `storage`
- `content_scripts`: target `https://bestellung.z-catering.de/*`
- `action`: triggers popup.html
- `default_locale`: en

---

## 🔄 Data Handling

### Image Scraping Flow

- Query: Exact meal name (e.g., `"Omelette mit Rahmspinat und Kartoffelstampf"`)
- Use `fetch()` to Google Images `https://www.google.com/search?tbm=isch&q=<encoded_query>&safe=active`
- Parse returned HTML for `<img>` tags in result grid
- Extract first 3–5 image URLs (using CORS-safe strategies)
- On failure:
  - Show fallback message
  - No retries (for now)

### Caching

- `localStorage` object keyed by dish name
- Value: array of image URLs + timestamp
- TTL: none for now (can be added in v2)

---

## 🌍 Localization

### Languages Supported

- English (default)
- German

### Translatable Strings

- Button labels (e.g., “Add Images” / “Bilder hinzufügen”)
- Errors (e.g., “No images found” / “Keine Bilder gefunden”)
- Modal links, search bar placeholder text

### Language Selection

- Auto-detected via browser language
- Manual override via dropdown in floating panel

---

## ⚠️ Error Handling

| Error Case                | Message Displayed        | UI Behavior            |
| ------------------------- | ------------------------ | ---------------------- |
| No images found           | “No images found”        | Keep modal open        |
| Fetch/network error       | “Try again later”        | Retry disabled         |
| Invalid meal title        | “Invalid search term”    | Suppress icon/modal    |
| Parsing blocked by Google | “Unable to fetch images” | Log silently, no retry |

---

## 🧪 Testing Plan

### Manual Testing

| Scenario                         | Expected Outcome                            |
| -------------------------------- | ------------------------------------------- |
| Login > Select child > View menu | “Add Images” appears                        |
| Click “Add Images”               | All meals have 🔍 icons                     |
| Click 🔍 icon                    | Modal appears with images                   |
| Click ✖️                         | Modal closes                                |
| Open extension icon              | Floating panel shows                        |
| Enter valid dish in search bar   | Modal with results appears                  |
| Switch language to German        | All labels update accordingly               |
| Return to page next day          | Previously seen meals load faster via cache |

### Cross-Browser & Device Tests

- Chrome (latest) on macOS, Windows
- ChromeOS or Chromebook device (if available)

---

## 🔒 Security & Privacy

- No tracking or telemetry.
- No backend; all logic runs locally.
- Only uses `localStorage` for caching.
- Google search is client-side with SafeSearch.

---

## ✅ Future Enhancements (v2 Ideas)

- Automatically enhance menu without needing a button.
- Smarter fallback search using translation (e.g., Google Translate API).
- Support dark mode.
- Clear cache/history buttons.
- Backend proxy to avoid Google blocking.
