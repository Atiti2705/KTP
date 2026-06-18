/* ============================================
   KṬP Saikhamakawn — App Initialization
   Main entry point for all pages
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize shared components
  setupScrollReveal();
  setupLazyLoading();

  // Page enter animation
  document.body.classList.add('page-enter');

  // Handle Capacitor Back Button (Android)
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
      // Find any open modals with the 'active' class
      const openModals = Array.from(document.querySelectorAll('.modal-backdrop.active, .lightbox-modal.active, .modal.active'));

      if (openModals.length > 0) {
        // Close the top-most modal
        const topModal = openModals[openModals.length - 1];
        
        // Trigger specific close functions if they exist, otherwise generic close
        if (topModal.id === 'create-post-modal' && typeof window.closeCreatePostModal === 'function') {
          window.closeCreatePostModal();
        } else if (topModal.id === 'ob-preview-modal' && typeof window.closeOBPreviewModal === 'function') {
          window.closeOBPreviewModal();
        } else if (typeof ModalSystem !== 'undefined') {
          // Use ModalSystem to ensure it cleans up the browser history stack correctly
          ModalSystem.close(topModal.id);
        } else {
          // Generic fallback if ModalSystem doesn't exist
          topModal.classList.remove('active');
          setTimeout(() => topModal.style.display = 'none', 300);
        }
      } else {
        // No modals open, proceed with default behavior
        if (!canGoBack) {
          window.Capacitor.Plugins.App.exitApp();
        } else {
          window.history.back();
        }
      }
    });
  }
});

window.NativeDownload = async function(url, filename) {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return false;
  try {
    if (window.Toast) Toast.show('Downloading...', 'success');
    const { Filesystem } = window.Capacitor.Plugins;
    const isPhoto = url.includes('lh3.googleusercontent') || filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.png') || filename.toLowerCase().endsWith('.jpeg');
    
    if (isPhoto && window.Capacitor.Plugins.Media) {
      try {
        await window.Capacitor.Plugins.Media.requestPermissions();
      } catch (e) {
        console.warn('Permission request issue', e);
      }
    }

    const downloadResult = await Filesystem.downloadFile({
      url: url,
      path: filename || (isPhoto ? `photo_${Date.now()}.jpg` : `document_${Date.now()}.pdf`),
      directory: 'DOCUMENTS'
    });
    
    if (isPhoto && window.Capacitor.Plugins.Media) {
      try {
        await window.Capacitor.Plugins.Media.savePhoto({ path: downloadResult.path });
        if (window.Toast) Toast.show('Saved photo to gallery!', 'success');
        return true;
      } catch (err) {
        console.error('Media savePhoto failed:', err);
      }
    }
    
    if (window.Toast) Toast.show(`Saved ${filename} to Documents!`, 'success');
    return true;
  } catch (err) {
    console.error('Native download error:', err);
    if (window.Toast) Toast.show('Direct save failed, opening browser...', 'error');
    window.open(url, '_system');
    return true;
  }
};
