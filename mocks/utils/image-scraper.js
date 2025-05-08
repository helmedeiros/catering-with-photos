import { jest } from '@jest/globals';

// Mock for image-scraper.js
export const fetchImages = jest.fn().mockResolvedValue(['image1.jpg', 'image2.jpg']);
