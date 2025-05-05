export function openModal(title, images) {
  // For now, just log that the modal would open
  console.log(`Modal would open with title: ${title}`);
  return {
    title,
    images: ['placeholder1.jpg', 'placeholder2.jpg', 'placeholder3.jpg']
  };
}

export function closeModal() {
  // For now, just log that the modal would close
  console.log('Modal would close');
}
