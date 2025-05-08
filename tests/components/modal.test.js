import { jest } from '@jest/globals';
import { openModal, closeModal } from '../../components/modal.js';

describe('Modal Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    closeModal();
  });

  it('creates modal with title and images', () => {
    openModal('Test Title', ['img1.jpg', 'img2.jpg']);

    const modal = document.querySelector('.cwph-modal');
    expect(modal).toBeTruthy();
    expect(modal.querySelector('h2').textContent).toBe('Test Title');

    // Check image wrappers
    const imageWrappers = modal.querySelectorAll('.cwph-image-wrapper');
    expect(imageWrappers.length).toBe(2);

    // Check images
    const images = modal.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0].src).toBeTruthy();
    expect(images[0].alt).toContain('Test Title');
    expect(images[1].src).toBeTruthy();
    expect(images[1].alt).toContain('Test Title');

    // Check loading indicators
    const loaders = modal.querySelectorAll('.cwph-image-loader');
    expect(loaders.length).toBe(2);
  });

  it('removes modal when closed', () => {
    openModal('Test', ['img.jpg']);
    expect(document.querySelector('.cwph-modal')).toBeTruthy();

    closeModal();
    expect(document.querySelector('.cwph-modal')).toBeFalsy();
  });

  it('displays error message when provided', () => {
    const errorMessage = 'No images found';
    openModal('Test Title', [], errorMessage);

    const modal = document.querySelector('.cwph-modal');
    expect(modal).toBeTruthy();

    const error = modal.querySelector('.cwph-modal-error');
    expect(error).toBeTruthy();
    expect(error.textContent).toBe(errorMessage);
    expect(modal.querySelectorAll('img').length).toBe(0);
  });

  it('handles empty images array without error message', () => {
    openModal('Test Title', []);

    const modal = document.querySelector('.cwph-modal');
    expect(modal).toBeTruthy();
    expect(modal.querySelector('.cwph-modal-error')).toBeFalsy();
    const message = modal.querySelector('.cwph-modal-message');
    expect(message).toBeTruthy();
    expect(message.textContent).toContain('No images available');
  });

  it('sets ARIA attributes correctly', () => {
    openModal('Test Title', ['img.jpg']);

    const modal = document.querySelector('.cwph-modal');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-label')).toBe('Test Title');
  });

  it('focuses close button on open and restores focus on close', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();

    openModal('Test', ['img.jpg']);
    expect(document.activeElement.className).toBe('cwph-modal-close');

    closeModal();
    expect(document.activeElement).toBe(btn);
  });

  it('locks scroll when opened and restores when closed', () => {
    openModal('Test', ['img.jpg']);
    expect(document.body.style.overflow).toBe('hidden');

    closeModal();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes modal when Escape key is pressed', () => {
    openModal('Test', ['img.jpg']);
    expect(document.querySelector('.cwph-modal')).toBeTruthy();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(document.querySelector('.cwph-modal')).toBeFalsy();
  });

  test('shows error message and retry button when error occurs', () => {
    const errorMessage = 'Unable to load images. Please check your internet connection and try again.';
    openModal('Test Dish', [], errorMessage);

    const errorElement = document.querySelector('.cwph-modal-error');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toBe(errorMessage);

    const retryButton = document.querySelector('.cwph-modal-retry');
    expect(retryButton).toBeTruthy();
    expect(retryButton.textContent).toBe('Retry');
  });

  test('dispatches retry event when retry button is clicked', () => {
    const mockHandler = jest.fn();
    document.addEventListener('cwph-retry', mockHandler);

    openModal('Test Dish', [], 'Error message');
    const retryButton = document.querySelector('.cwph-modal-retry');
    retryButton.click();

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { title: 'Test Dish' }
      })
    );

    document.removeEventListener('cwph-retry', mockHandler);
  });
});
