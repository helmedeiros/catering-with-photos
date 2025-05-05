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
});
