/**
 * Helper script to convert content-script.js to a module for testing
 */
import fs from 'fs';
import path from 'path';

// Read the content-script.js file
const contentScript = fs.readFileSync(path.resolve('content-for-tests.js'), 'utf8');

// Create import statement for the fetchImages function
const importStatement = `
// Import fetchImages from the proper location
import { fetchImages } from './utils/image-scraper.js';
`;

// Replace any existing fetchImages implementation
const contentWithoutFetchImages = contentScript.replace(/async\s+function\s+fetchImages\s*\([^)]*\)\s*\{[\s\S]*?(?=function\s+[a-zA-Z]+\s*\(|\}\s*$)/g, '');

// Modify the content to expose the functions for testing
const exportStatements = `
// Export functions for testing
export {
  injectAddImagesButton,
  injectButtonStyles,
  enhanceMenu,
  handleSearch,
  addImagesToMeals,
  openModal,
  closeModal,
  fetchImages,
  waitForMenu
};
`;

// Create the module-compatible file
fs.writeFileSync(path.resolve('content.js'), importStatement + contentWithoutFetchImages + exportStatements);

console.log('Successfully created content.js for testing');
