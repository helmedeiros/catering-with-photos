/**
 * Helper script to convert content-script.js to a module for testing
 */
import fs from 'fs';
import path from 'path';

// Read the content-script.js file
const contentScript = fs.readFileSync(path.resolve('content-for-tests.js'), 'utf8');

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
fs.writeFileSync(path.resolve('content.js'), contentScript + exportStatements);

console.log('Successfully created content.js for testing');
