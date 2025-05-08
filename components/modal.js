let modalOverlay = null;
let modalContainer = null;
let previousFocus = null;

// Fallback image to use if loading fails
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f5f5f5" /%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" text-anchor="middle" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';

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
  imgContainer.className = 'cwph-image-grid';
  imgContainer.style.display = 'grid';
  imgContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
  imgContainer.style.gap = '10px';
  imgContainer.style.width = '100%';
  imgContainer.style.padding = '10px';

  if (errorMessage) {
    const errorElem = document.createElement('p');
    errorElem.className = 'cwph-modal-error';
    errorElem.textContent = errorMessage;
    imgContainer.appendChild(errorElem);

    // Add retry button
    const retryBtn = document.createElement('button');
    retryBtn.className = 'cwph-modal-retry';
    retryBtn.textContent = 'Retry';
    retryBtn.addEventListener('click', () => {
      const event = new CustomEvent('cwph-retry', { detail: { title } });
      document.dispatchEvent(event);
      closeModal();
    });
    imgContainer.appendChild(retryBtn);
  } else if (Array.isArray(images) && images.length > 0) {
    // Add images to the grid
    images.forEach((src, index) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'cwph-image-wrapper';
      imgWrapper.style.position = 'relative';
      imgWrapper.style.overflow = 'hidden';
      imgWrapper.style.borderRadius = '4px';
      imgWrapper.style.aspectRatio = '1 / 1';
      imgWrapper.style.backgroundColor = '#f5f5f5';

      // Create loading indicator
      const loader = document.createElement('div');
      loader.className = 'cwph-image-loader';
      loader.style.position = 'absolute';
      loader.style.top = '0';
      loader.style.left = '0';
      loader.style.width = '100%';
      loader.style.height = '100%';
      loader.style.display = 'flex';
      loader.style.alignItems = 'center';
      loader.style.justifyContent = 'center';
      loader.style.backgroundColor = '#f5f5f5';
      loader.textContent = 'Loading...';
      imgWrapper.appendChild(loader);

      // Create the actual image
      const img = document.createElement('img');
      img.alt = `${title} dish`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.position = 'absolute';
      img.style.top = '0';
      img.style.left = '0';
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';

      // Handle image loading
      img.onload = () => {
        img.style.opacity = '1';
        loader.style.display = 'none';
      };

      // Handle loading errors
      img.onerror = () => {
        img.src = FALLBACK_IMAGE;
        img.style.opacity = '1';
        loader.style.display = 'none';
        loader.textContent = 'Failed to load image';
      };

      // Set the source last to trigger loading
      img.src = src;

      imgWrapper.appendChild(img);
      imgContainer.appendChild(imgWrapper);
    });
  } else {
    // If no images were found
    const noImagesMsg = document.createElement('p');
    noImagesMsg.className = 'cwph-modal-message';
    noImagesMsg.textContent = 'No images available for this dish.';
    imgContainer.appendChild(noImagesMsg);
  }

  modalContainer.appendChild(imgContainer);

  // Add "See more on Google" link
  const seeMoreLink = document.createElement('a');
  seeMoreLink.href = `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=isch&safe=active`;
  seeMoreLink.target = '_blank';
  seeMoreLink.rel = 'noopener noreferrer';
  seeMoreLink.className = 'cwph-see-more';
  seeMoreLink.textContent = 'See more on Google';
  modalContainer.appendChild(seeMoreLink);

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
