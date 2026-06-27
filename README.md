# catering-with-photos

A Chrome extension that adds food photos to the
[Z-Catering](https://bestellung.z-catering.de/app/menuplan) meal-selection
interface, so kids and parents can choose meals by sight rather than by name.

## Features

- Adds a small search icon next to each menu item; clicking it opens a modal with
  3–5 food images for that dish.
- SafeSearch is enabled to keep results child-appropriate, with a "See more on
  Google" link in the modal.
- A floating command panel offers manual search by dish name, one-click
  enhancement of the current menu, recently searched items, and an
  English/German language toggle.
- Image results are cached locally for speed.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this project's folder.

## Usage

1. Log in to Z-Catering and wait for the weekly menu to load.
2. Click the "Add Images" button near the date selector.
3. Browse the meals visually via the search icons, or use the toolbar icon for
   the advanced command panel.

## How it works

- Manifest V3 extension, fully client-side with no external backend.
- `content.js` injects the UI and observes DOM changes; `popup.js` drives the
  floating panel.
- Images are fetched with SafeSearch and parsed from Google Images results;
  results are cached in `localStorage`.

## Localization

English (default) and German, via the browser or the in-UI toggle.

## Limitations

- No dark mode yet.
- The cache cannot be cleared from the UI (planned).
- Image scraping is best-effort and may break if Google changes its markup.

## License

[MIT](LICENSE)
