let modalOverlay = null;
let modalContainer = null;
let previousFocus = null;

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
}

export function openModal(title, images, errorMessage = null) {
  closeModal(); // Ensure only one modal

  // Store previous focus and lock scroll
  previousFocus = document.activeElement;
  document.body.style.overflow = 'hidden';

  modalOverlay = document.createElement('div');
  modalOverlay.className = 'cwph-modal-overlay';

  modalContainer = document.createElement('div');
  modalContainer.className = 'cwph-modal';
  modalContainer.setAttribute('role', 'dialog');
  modalContainer.setAttribute('aria-modal', 'true');
  modalContainer.setAttribute('aria-label', title);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'cwph-modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '✖️';
  closeBtn.addEventListener('click', closeModal);
  modalContainer.appendChild(closeBtn);

  const titleElem = document.createElement('h2');
  titleElem.textContent = title;
  modalContainer.appendChild(titleElem);

  const imgContainer = document.createElement('div');
  imgContainer.className = 'cwph-modal-images';

  if (errorMessage) {
    const errorElem = document.createElement('p');
    errorElem.className = 'cwph-modal-error';
    errorElem.textContent = errorMessage;
    imgContainer.appendChild(errorElem);
  } else if (Array.isArray(images) && images.length > 0) {
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

  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyDown);

  // Focus the close button
  closeBtn.focus();
}

export function closeModal() {
  if (modalOverlay && modalOverlay.parentNode) {
    modalOverlay.parentNode.removeChild(modalOverlay);
  }
  modalOverlay = null;
  modalContainer = null;

  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeyDown);

  // Restore scroll and focus
  document.body.style.overflow = '';
  if (previousFocus) {
    previousFocus.focus();
    previousFocus = null;
  }
}
