/**
 * Simple build script to prepare extension for deployment
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
  updateTimestamp();
  await prepareContentScript();
  console.log('✅ Build completed');
}

// Run the build
build();
