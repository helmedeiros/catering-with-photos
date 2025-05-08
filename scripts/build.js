/**
 * Simple build script to prepare extension for deployment
 * - Updates version number
 * - Updates version timestamp
 * - Makes sure all content-script code is correctly processed
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory for correct path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Update version number in relevant files
function updateVersion(newVersion) {
  // Get current version from manifest.json
  const manifestPath = path.resolve('manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const currentVersion = manifest.version;

  if (!newVersion) {
    // If no version specified, increment the patch version
    const versionParts = currentVersion.split('.');
    versionParts[2] = (parseInt(versionParts[2], 10) + 1).toString();
    newVersion = versionParts.join('.');
  }

  console.log(`🔄 Updating version from ${currentVersion} to ${newVersion}`);

  // Update manifest.json
  manifest.version = newVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  // Update content-script.js
  const contentScriptPath = path.resolve('content-script.js');
  let contentScript = fs.readFileSync(contentScriptPath, 'utf8');
  contentScript = contentScript.replace(
    /console\.log\('%c Catering with Photos v[0-9.]+/,
    `console.log('%c Catering with Photos v${newVersion}`
  );
  fs.writeFileSync(contentScriptPath, contentScript);

  // Update content.js if it exists
  const contentPath = path.resolve('content.js');
  if (fs.existsSync(contentPath)) {
    let content = fs.readFileSync(contentPath, 'utf8');
    content = content.replace(
      /console\.log\('%c Catering with Photos v[0-9.]+/,
      `console.log('%c Catering with Photos v${newVersion}`
    );
    fs.writeFileSync(contentPath, content);
  }

  // Update background.js if it exists
  const backgroundPath = path.resolve('background.js');
  if (fs.existsSync(backgroundPath)) {
    let background = fs.readFileSync(backgroundPath, 'utf8');
    if (background.includes('Catering with Photos v')) {
      background = background.replace(
        /Catering with Photos v[0-9.]+/,
        `Catering with Photos v${newVersion}`
      );
      fs.writeFileSync(backgroundPath, background);
    }
  }

  // Update popup.html
  const popupPath = path.resolve('popup.html');
  let popup = fs.readFileSync(popupPath, 'utf8');
  popup = popup.replace(
    /<p>v[0-9.]+ - Find food images with ease<\/p>/,
    `<p>v${newVersion} - Find food images with ease</p>`
  );
  fs.writeFileSync(popupPath, popup);

  console.log(`✅ Updated version to ${newVersion} in all files`);
  return newVersion;
}

// Update the timestamp in content-script.js
function updateTimestamp() {
  const filePath = path.resolve('content-script.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace or add build timestamp
  const timestamp = new Date().toISOString();
  const buildString = `// Build: ${timestamp}`;

  if (content.includes('// Build:')) {
    content = content.replace(/\/\/ Build:.*/, buildString);

    // Also update the console.log timestamp
    content = content.replace(
      /console\.log\('Build time:', '.*?'\);/,
      `console.log('Build time:', '${timestamp}');`
    );
  } else {
    content = content.replace(
      /\/\/ content-script\.js.*/,
      `// content-script.js - Non-module version of the content script\n${buildString}`
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated build timestamp to ${timestamp}`);

  // Also update background.js timestamp if it exists
  const backgroundPath = path.resolve('background.js');
  if (fs.existsSync(backgroundPath)) {
    let background = fs.readFileSync(backgroundPath, 'utf8');

    if (background.includes('// Build:')) {
      background = background.replace(/\/\/ Build:.*/, buildString);
    } else {
      // Add build timestamp if not present
      background = `${background}\n\n${buildString}`;
    }

    fs.writeFileSync(backgroundPath, background);
    console.log(`✅ Updated build timestamp in background.js`);
  }
}

// Run the prepare-tests script which converts content-script.js to module format
async function prepareContentScript() {
  // Save the original
  fs.copyFileSync(
    path.resolve('content-script.js'),
    path.resolve('content-for-tests.js')
  );

  // Run the converter
  try {
    // Import the module dynamically
    const converterPath = path.join(__dirname, 'convert-module.js');
    await import(converterPath);
    console.log('✅ Successfully converted content script to module format');
  } catch (error) {
    console.error('❌ Error converting content script:', error);
  }
}

// Main build function
async function build() {
  console.log('🔨 Building extension...');

  // Get version from command line argument if provided
  const versionArg = process.argv.find(arg => arg.startsWith('--version='));
  const newVersion = versionArg ? versionArg.split('=')[1] : null;

  updateVersion(newVersion);
  updateTimestamp();
  await prepareContentScript();
  console.log('✅ Build completed');
}

// Run the build
build();
