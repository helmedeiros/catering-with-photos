import { openModal, closeModal } from '../../components/modal.js';

describe('modal.js', () => {
  afterEach(() => {
    closeModal();
    document.body.innerHTML = '';
  });

  it('creates modal and overlay with title and images', () => {
    openModal('Test Dish', ['img1.jpg', 'img2.jpg']);
    const overlay = document.querySelector('.cwph-modal-overlay');
    const modal = document.querySelector('.cwph-modal');
    expect(overlay).toBeTruthy();
    expect(modal).toBeTruthy();
    expect(modal.querySelector('h2').textContent).toBe('Test Dish');
    const imgs = modal.querySelectorAll('.cwph-modal-images img');
    expect(imgs.length).toBe(2);
    expect(imgs[0].src).toMatch(/img1\.jpg/);
    expect(imgs[1].src).toMatch(/img2\.jpg/);
  });

  it('removes modal and overlay on closeModal', () => {
    openModal('Test Dish', ['img1.jpg']);
    closeModal();
    expect(document.querySelector('.cwph-modal-overlay')).toBeNull();
    expect(document.querySelector('.cwph-modal')).toBeNull();
  });

  it('renders three dummy images with correct src attributes', () => {
    openModal('Dummy Dish', ['img1.jpg', 'img2.jpg', 'img3.jpg']);
    const imgs = document.querySelectorAll('.cwph-modal-images img');
    expect(imgs.length).toBe(3);
    expect(imgs[0].src).toMatch(/img1\.jpg/);
    expect(imgs[1].src).toMatch(/img2\.jpg/);
    expect(imgs[2].src).toMatch(/img3\.jpg/);
  });

  it('removes modal and overlay when close button is clicked', () => {
    openModal('Test Dish', ['img1.jpg']);
    const closeBtn = document.querySelector('.cwph-modal-close');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    expect(document.querySelector('.cwph-modal-overlay')).toBeNull();
    expect(document.querySelector('.cwph-modal')).toBeNull();
  });

  it('locks scroll when modal is open', () => {
    openModal('Test Dish', ['img1.jpg']);
    expect(document.body.style.overflow).toBe('hidden');
    closeModal();
    expect(document.body.style.overflow).toBe('');
  });

  it('traps focus in modal and restores it on close', () => {
    // Create a button to focus before opening modal
    const button = document.createElement('button');
    button.textContent = 'Test Button';
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    // Open modal and check focus is on close button
    openModal('Test Dish', ['img1.jpg']);
    const closeBtn = document.querySelector('.cwph-modal-close');
    expect(document.activeElement).toBe(closeBtn);

    // Close modal and check focus is restored
    closeModal();
    expect(document.activeElement).toBe(button);
  });

  it('sets proper ARIA attributes for accessibility', () => {
    openModal('Test Dish', ['img1.jpg']);
    const modal = document.querySelector('.cwph-modal');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-label')).toBe('Test Dish');
  });
});
