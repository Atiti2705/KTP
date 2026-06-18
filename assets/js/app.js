/* ============================================
   KṬP Saikhamakawn — App Initialization
   Main entry point for all pages
   ============================================ */

// Pull to refresh logic
function setupPullToRefresh() {
  if (typeof window.ontouchstart === 'undefined') return; // Only on touch devices
  
  let startY = 0;
  let currentY = 0;
  let isPulling = false;
  let pptrContainer = null;
  let pptrIcon = null;

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    currentY = e.touches[0].clientY;
    let dy = currentY - startY;

    if (dy > 0 && window.scrollY === 0) {
      // Only prevent default if we are actively pulling down past threshold to avoid jitter
      if (e.cancelable && dy > 10) e.preventDefault();

      if (!pptrContainer) {
        pptrContainer = document.createElement('div');
        pptrContainer.style.position = 'fixed';
        pptrContainer.style.top = '-50px';
        pptrContainer.style.left = '50%';
        pptrContainer.style.transform = 'translateX(-50%)';
        pptrContainer.style.width = '40px';
        pptrContainer.style.height = '40px';
        pptrContainer.style.background = 'white';
        pptrContainer.style.borderRadius = '50%';
        pptrContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        pptrContainer.style.display = 'flex';
        pptrContainer.style.alignItems = 'center';
        pptrContainer.style.justifyContent = 'center';
        pptrContainer.style.zIndex = '9999';
        pptrContainer.style.transition = 'top 0s';

        pptrIcon = document.createElement('div');
        pptrIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 2.1-5.7L2 9"></path></svg>`;
        pptrIcon.style.transition = 'transform 0s';
        
        pptrContainer.appendChild(pptrIcon);
        document.body.appendChild(pptrContainer);
      }

      let pullDist = Math.min(dy * 0.4, 100);
      pptrContainer.style.top = `${-50 + pullDist}px`;
      pptrIcon.style.transform = `rotate(${dy * 2}deg)`;
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!isPulling) return;
    isPulling = false;

    if (pptrContainer) {
      let dy = currentY - startY;
      let pullDist = Math.min(dy * 0.4, 100);

      pptrContainer.style.transition = 'top 0.3s ease';
      
      if (pullDist >= 60) {
        pptrContainer.style.top = '20px';
        if (!document.getElementById('pptr-style')) {
           const style = document.createElement('style');
           style.id = 'pptr-style';
           style.innerHTML = `@keyframes pptr-spin { 100% { transform: rotate(360deg); } }`;
           document.head.appendChild(style);
        }
        pptrIcon.style.animation = 'pptr-spin 0.8s linear infinite';
        
        // Ensure minimum visual loading time
        setTimeout(() => location.reload(), 600);
      } else {
        pptrContainer.style.top = '-50px';
        setTimeout(() => {
          if (pptrContainer && pptrContainer.parentNode) {
            pptrContainer.parentNode.removeChild(pptrContainer);
            pptrContainer = null;
          }
        }, 300);
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize shared components
  setupScrollReveal();
  setupLazyLoading();
  setupPullToRefresh();

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
