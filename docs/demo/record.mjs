import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const demoDir = path.dirname(fileURLToPath(import.meta.url));
const extensionDir = path.resolve(demoDir, '..', '..');
const port = Number(process.env.DEMO_PORT || 4120);
const menuUrl = `http://localhost:${port}/menu.html`;
const viewport = { width: 1280, height: 720 };

const photo = (id) => `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&fm=jpg`;
const photos = {
  'Spaghetti Bolognese': ['1622973536968-3ead9e780960', '1598866594230-a7c12756260f', '1621996346565-e3dbc646d9a9', '1563379926898-05f4575a45d8', '1551183053-bf91a1d81141'],
  'Hähnchenschnitzel': ['1599921841143-819065a55cc6', '1562967914-608f82629710', '1626082927389-6cd097cdc6ec', '1555939594-58d7cb561ad1', '1504674900247-0877df9cc836'],
  'Gemüselasagne': ['1619895092538-128341789043', '1574894709920-11b28e7367e3', '1512621776951-a57141f2eefd', '1540189549336-e6e99c3679fe', '1473093295043-cdd812d0e601'],
  'Tomatensuppe': ['1547592166-23ac45744acd', '1603105037880-880cd4edfb0d', '1546069901-ba9599a7e63c', '1512621776951-a57141f2eefd', '1540189549336-e6e99c3679fe'],
  'Lachsfilet': ['1519708227418-c8fd9a32b7a2', '1580959375944-abd7e991f971', '1546069901-ba9599a7e63c', '1516684732162-798a0062be99', '1540189549336-e6e99c3679fe']
};

const searchResults = (query) => {
  const dish = Object.keys(photos).find((name) => query.startsWith(name));
  const urls = dish ? photos[dish].map(photo) : [];
  return `<html><body><script>${urls.map((u) => `"ou":"${u}"`).join(',')}</script></body></html>`;
};

const cursorScript = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    Object.assign(cursor.style, {
      position: 'fixed', left: '0px', top: '0px', width: '22px', height: '22px', zIndex: '2147483647',
      pointerEvents: 'none', transform: 'translate(-3px, -2px)', transition: 'transform 0.1s',
      background: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'><path d='M3 2 L3 18 L7.5 14 L10.5 20.5 L13 19.4 L10 13 L16 13 Z' fill='black' stroke='white' stroke-width='1.4'/></svg>") no-repeat`
    });
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    }, true);
    document.addEventListener('mousedown', () => { cursor.style.transform = 'translate(-3px, -2px) scale(0.8)'; }, true);
    document.addEventListener('mouseup', () => { cursor.style.transform = 'translate(-3px, -2px)'; }, true);
  });
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/menu.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(demoDir, 'menu.html')));
    return;
  }
  res.writeHead(404);
  res.end();
});

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let pointer = { x: viewport.width / 2, y: viewport.height / 2 };

async function glide(page, locator) {
  const box = await locator.boundingBox();
  const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(target.x, target.y, { steps: 25 });
  pointer = target;
}

async function clickOn(page, locator) {
  await glide(page, locator);
  await pause(400);
  await page.mouse.down();
  await page.mouse.up();
}

async function openMenu(context) {
  const page = await context.newPage();
  await page.goto(menuUrl);
  await page.locator('#cwph-add').waitFor();
  await page.mouse.move(pointer.x, pointer.y);
  return page;
}

async function viewDish(page, dish) {
  const card = page.locator('.cwph-card-wrapper', { hasText: dish });
  await clickOn(page, card.locator('.cwph-icon-wrapper'));
  await page.locator('.cwph-modal').waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.cwph-modal img')].every((img) => img.complete && img.naturalWidth > 0));
  await pause(2800);
}

async function record(page, name, workDir, scene) {
  const framesDir = fs.mkdtempSync(path.join(workDir, `${name}-`));
  const frames = [];
  let recording = true;
  const capture = (async () => {
    while (recording) {
      const file = path.join(framesDir, `${String(frames.length).padStart(5, '0')}.png`);
      await page.screenshot({ path: file });
      frames.push({ file, at: Date.now() });
    }
  })();
  await scene();
  recording = false;
  await capture;
  const list = frames.map((frame, i) => {
    const next = frames[i + 1] ? frames[i + 1].at : frame.at + 1000;
    return `file '${frame.file}'\nduration ${((next - frame.at) / 1000).toFixed(3)}`;
  });
  list.push(`file '${frames[frames.length - 1].file}'`);
  const listFile = path.join(framesDir, 'frames.txt');
  fs.writeFileSync(listFile, `${list.join('\n')}\n`);
  const gif = path.join(demoDir, `${name}.gif`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', 'fps=12,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    gif
  ]);
  console.log(`${name}.gif ${(fs.statSync(gif).size / 1024).toFixed(0)} KB`);
}

async function main() {
  await new Promise((resolve) => server.listen(port, 'localhost', resolve));
  process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwph-demo-'));
  const context = await chromium.launchPersistentContext(path.join(workDir, 'profile'), {
    channel: 'chromium',
    headless: true,
    viewport,
    locale: 'de-DE',
    args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`]
  });
  try {
    await context.route('https://www.google.com/search**', (route) => {
      const query = new URL(route.request().url()).searchParams.get('q') || '';
      route.fulfill({ status: 200, contentType: 'text/html', body: searchResults(query) });
    });
    await context.addInitScript(cursorScript);

    const menu = await openMenu(context);
    await record(menu, 'show-dishes', workDir, async () => {
      await pause(1800);
      await clickOn(menu, menu.locator('#cwph-add'));
      await menu.locator('.cwph-icon-wrapper').first().waitFor();
      await pause(2500);
    });
    await menu.close();

    const dishes = await openMenu(context);
    await dishes.locator('#cwph-add').dispatchEvent('click');
    await dishes.locator('.cwph-icon-wrapper').first().waitFor();
    await record(dishes, 'view-dish', workDir, async () => {
      await pause(1200);
      await viewDish(dishes, 'Hähnchenschnitzel');
      await clickOn(dishes, dishes.locator('.cwph-modal-close'));
      await pause(1200);
      await viewDish(dishes, 'Gemüselasagne');
      await dishes.keyboard.press('Escape');
      await pause(1200);
    });
  } finally {
    await context.close();
    server.close();
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
