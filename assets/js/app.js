/* ============================================
   KṬP Saikhamakawn — App Initialization
   Main entry point for all pages
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Global reCAPTCHA gateway
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (false && !isLocalhost && sessionStorage.getItem('human_verified') !== 'true') {
    const script = document.createElement('script');
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    const overlayHtml = `
      <div id="global-recaptcha-overlay" class="global-recaptcha-overlay">
        <div class="global-recaptcha-card">
          <h2>Security Check</h2>
          <p>Please verify that you are human before entering the website.</p>
          <div class="global-recaptcha-container">
            <div class="g-recaptcha" data-sitekey="6LfhF0ktAAAAADRc3665ddHMCb5yzEZnURQ2deZA" data-callback="onGlobalRecaptchaSuccess"></div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHtml);
    document.body.style.overflow = 'hidden';
  }

  // Initialize shared components
  setupScrollReveal();
  setupLazyLoading();

  // Page enter animation
  document.body.classList.add('page-enter');
});

window.onGlobalRecaptchaSuccess = function(token) {
  sessionStorage.setItem('human_verified', 'true');
  const overlay = document.getElementById('global-recaptcha-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 500);
  }
};
