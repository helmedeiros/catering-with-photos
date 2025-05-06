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

    const images = modal.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0].src).toContain('img1.jpg');
    expect(images[1].src).toContain('img2.jpg');
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
    expect(modal.querySelectorAll('img').length).toBe(0);
  });

  it('sets ARIA attributes correctly', () => {
    openModal('Test Title', ['img.jpg']);

    const modal = document.querySelector('.cwph-modal');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-label')).toBe('Test Title');
  });

  it('focuses close button on open and restores focus on close', () => {
    // Create a button and focus it
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
});
