function applyTranslations(container = document) {
  // For text content
  container.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    const translation = chrome.i18n.getMessage(key);
    if (translation) {
      // Use innerHTML to support simple formatting if needed in the future
      elem.innerHTML = translation;
    }
  });

  // For attributes like placeholder, title
  container.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-placeholder');
    const translation = chrome.i18n.getMessage(key);
    if (translation) {
      elem.placeholder = translation;
    }
  });

  container.querySelectorAll('[data-i18n-title]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-title');
    const translation = chrome.i18n.getMessage(key);
    if (translation) {
      elem.title = translation;
    }
  });
}

// Apply translations on initial load
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
});

// Make it available for other scripts
window.applyTranslations = applyTranslations;