let modalOverlay = null;
let modalContainer = null;

export function openModal(title, images) {
  closeModal(); // Ensure only one modal

  modalOverlay = document.createElement('div');
  modalOverlay.className = 'cwph-modal-overlay';

  modalContainer = document.createElement('div');
  modalContainer.className = 'cwph-modal';

  const titleElem = document.createElement('h2');
  titleElem.textContent = title;
  modalContainer.appendChild(titleElem);

  const imgContainer = document.createElement('div');
  imgContainer.className = 'cwph-modal-images';
  if (Array.isArray(images)) {
    images.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = title;
      imgContainer.appendChild(img);
    });
  }
  modalContainer.appendChild(imgContainer);

  modalOverlay.appendChild(modalContainer);
  document.body.appendChild(modalOverlay);
}

export function closeModal() {
  if (modalOverlay && modalOverlay.parentNode) {
    modalOverlay.parentNode.removeChild(modalOverlay);
  }
  modalOverlay = null;
  modalContainer = null;
}
