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
});
