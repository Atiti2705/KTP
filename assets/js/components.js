/* ============================================
   KṬP Saikhamakawn — Shared Components
   Header, Footer, Mobile Nav, Modals, Toasts
   Dynamically injected on every page with Auth
   ============================================ */

// ========================
// HEADER COMPONENT
// ========================
function renderHeader(activePage = '') {
  const header = document.getElementById('site-header');
  if (!header) return;

  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="header-logo" aria-label="${ChurchInfo.name} Home">
        <img src="assets/images/logo.png" alt="${ChurchInfo.name} Logo" width="53" height="40">
        <div class="header-logo-text">
          ${ChurchInfo.name}
          <small>Est. ${ChurchInfo.established}</small>
        </div>
      </a>

      <nav class="nav-desktop" aria-label="Main navigation">
        <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}" id="nav-home">Home</a>
        <a href="photos.html" class="nav-link ${activePage === 'photos' ? 'active' : ''}" id="nav-photos">Photos</a>
        <a href="mipui-aw.html" class="nav-link ${activePage === 'mipui-aw' ? 'active' : ''}" id="nav-mipui-aw">Mipui Aw</a>
        <a href="sermons.html" class="nav-link ${activePage === 'sermons' ? 'active' : ''}" id="nav-sermons">Sermons</a>
        <a href="admin/index.html" class="nav-link ${activePage === 'admin' ? 'active' : ''}" id="nav-admin">Admin</a>
      </nav>

      <div class="header-actions">
        <div class="theme-switcher">
          <button class="theme-btn" id="theme-toggle-btn" aria-label="Toggle theme" title="Toggle theme">
            ☀️
          </button>
          <div class="theme-dropdown" id="theme-dropdown">
            <button class="theme-option" data-theme="light">
              <span class="theme-option-icon">☀️</span>
              <span>Light</span>
            </button>
            <button class="theme-option" data-theme="dark">
              <span class="theme-option-icon">🌙</span>
              <span>Dark</span>
            </button>
            <button class="theme-option" data-theme="system">
              <span class="theme-option-icon">💻</span>
              <span>System</span>
            </button>
          </div>
        </div>

        <!-- User Authentication Widget -->
        <div id="header-user-widget" style="display: flex; align-items: center;"></div>

        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu" aria-expanded="false">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>
    </div>
  `;

  // Remove existing mobile nav if it exists to avoid duplicates
  const existingNav = document.getElementById('nav-mobile');
  if (existingNav) {
    existingNav.remove();
  }

  // Inject Mobile Navigation directly into the body
  const mobileNav = document.createElement('nav');
  mobileNav.className = 'nav-mobile';
  mobileNav.id = 'nav-mobile';
  mobileNav.setAttribute('aria-label', 'Mobile navigation');
  mobileNav.innerHTML = `
    <a href="index.html" class="nav-mobile-link ${activePage === 'home' ? 'active' : ''}">
      <span class="nav-icon">🏠</span> Home
    </a>
    <a href="photos.html" class="nav-mobile-link ${activePage === 'photos' ? 'active' : ''}">
      <span class="nav-icon">📸</span> Photos
    </a>
    <a href="mipui-aw.html" class="nav-mobile-link ${activePage === 'mipui-aw' ? 'active' : ''}">
      <span class="nav-icon">📄</span> Mipui Aw
    </a>
    <a href="sermons.html" class="nav-mobile-link ${activePage === 'sermons' ? 'active' : ''}">
      <span class="nav-icon">📖</span> Sermons
    </a>
    <div class="nav-mobile-divider"></div>
    
    <!-- Mobile User Widget Section -->
    <div id="mobile-user-widget"></div>

    <a href="admin/index.html" class="nav-mobile-link ${activePage === 'admin' ? 'active' : ''}">
      <span class="nav-icon">⚙️</span> Admin
    </a>
    <div class="nav-mobile-footer">
      <div class="social-links" style="justify-content: center;">
        <a href="${SocialMedia.instagram.url}" target="_blank" rel="noopener" class="social-link instagram" aria-label="Instagram">📷</a>
        <a href="${SocialMedia.facebook.url}" target="_blank" rel="noopener" class="social-link facebook" aria-label="Facebook">📘</a>
        <a href="${SocialMedia.youtube.url}" target="_blank" rel="noopener" class="social-link youtube" aria-label="YouTube">▶️</a>
      </div>
    </div>
  `;
  document.body.appendChild(mobileNav);

  // Setup mobile menu
  setupMobileMenu();
  // Setup header scroll effect
  setupHeaderScroll();

  // Run theme toggle binding now that elements are rendered
  if (typeof ThemeManager !== 'undefined' && ThemeManager.setupToggle) {
    ThemeManager.setupToggle();
  }

  // Hook authentication change listener to render profiles
  if (typeof AuthService !== 'undefined') {
    AuthService.onAuthStateChanged(user => {
      renderUserWidgets(user);
    });
  }
}

// ========================
// USER WIDGETS RENDERER
// ========================
function renderUserWidgets(user) {
  const headerWidget = document.getElementById('header-user-widget');
  const mobileWidget = document.getElementById('mobile-user-widget');

  // Inject modal markup once
  injectAuthModal();

  if (!user) {
    // 1. GUEST USER STATE
    if (headerWidget) {
      headerWidget.innerHTML = `
        <button class="btn btn-outline btn-sm" id="header-login-btn" style="padding: var(--sp-2) var(--sp-4);">Login</button>
      `;
      document.getElementById('header-login-btn').addEventListener('click', () => {
        ModalSystem.open('auth-modal');
      });
    }

    if (mobileWidget) {
      mobileWidget.innerHTML = `
        <button class="btn btn-outline" id="mobile-login-btn" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; margin: 12px 0;">
          🔑 Member Login
        </button>
      `;
      document.getElementById('mobile-login-btn').addEventListener('click', () => {
        // Close mobile menu first
        const mobileMenu = document.getElementById('nav-mobile');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (mobileMenuBtn) {
          mobileMenuBtn.classList.remove('open');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
        document.body.classList.remove('modal-open');
        
        ModalSystem.open('auth-modal');
      });
    }
  } else {
    // 2. AUTHENTICATED USER STATE
    const firstLetter = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';

    if (headerWidget) {
      headerWidget.className = 'theme-switcher';
      headerWidget.style.position = 'relative';
      headerWidget.innerHTML = `
        <button class="theme-btn" id="user-dropdown-btn" style="border-radius: var(--radius-full); background: var(--color-bg-hover); font-weight: bold; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border: 2px solid var(--brand-sky);" aria-label="User menu">
          ${firstLetter}
        </button>
        <div class="theme-dropdown" id="user-dropdown" style="min-width: 200px;">
          <div style="padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--color-border-light); margin-bottom: var(--sp-1);">
            <div style="font-weight: var(--fw-semibold); font-size: var(--fs-sm); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: var(--color-text);">${user.displayName}</div>
            <div style="font-size: var(--fs-xs); color: var(--color-text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${user.email}</div>
          </div>
          ${user.role === 'admin' ? `
            <a href="admin/dashboard.html" class="theme-option" style="text-decoration:none;">
              <span class="theme-option-icon">⚙️</span>
              <span>Control Panel</span>
            </a>
          ` : ''}
          <button class="theme-option" id="user-logout-btn" style="color: var(--brand-red);">
            <span class="theme-option-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      `;

      // Setup dropdown triggers
      const dropdownBtn = document.getElementById('user-dropdown-btn');
      const dropdownMenu = document.getElementById('user-dropdown');
      if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', () => {
          dropdownMenu.classList.remove('active');
        });
      }

      // Hook Logout
      document.getElementById('user-logout-btn').addEventListener('click', async () => {
        await AuthService.logout();
        Toast.show('Logged out.', 'info');
      });
    }

    if (mobileWidget) {
      mobileWidget.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); margin:12px 0;">
          <div style="width:40px; height:40px; border-radius:50%; background:var(--brand-sky); color:white; font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:18px; border: 2px solid var(--brand-sky-dark);">
            ${firstLetter}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:bold; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: var(--color-text);">${user.displayName}</div>
            <div style="font-size:12px; color:var(--color-text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${user.email}</div>
          </div>
        </div>
        ${user.role === 'admin' ? `
          <a href="admin/dashboard.html" class="nav-mobile-link" style="margin-bottom:8px;">
            <span class="nav-icon">⚙️</span> Control Panel
          </a>
        ` : ''}
        <a href="#" id="mobile-logout-btn" class="nav-mobile-link" style="color:var(--brand-red); margin-bottom: 8px;">
          <span class="nav-icon">🚪</span> Sign Out
        </a>
      `;

      document.getElementById('mobile-logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Close menu
        const mobileMenu = document.getElementById('nav-mobile');
        if (mobileMenu) mobileMenu.classList.remove('open');
        document.body.classList.remove('modal-open');

        await AuthService.logout();
        Toast.show('Logged out.', 'info');
      });
    }
  }
}

// ========================
// INJECT AUTHENTICATION MODAL
// ========================
function injectAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const modalHtml = `
    <div class="modal-backdrop" id="auth-modal">
      <div class="modal" style="max-width: 400px; padding: var(--sp-2);">
        <div class="modal-header">
          <h3 id="auth-modal-title">Sign In</h3>
          <button class="modal-close" id="close-auth-modal" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body" style="padding-top: var(--sp-4);">
          
          <div class="login-error" id="auth-error-alert" style="display: none; padding: var(--sp-3) var(--sp-4); background: rgba(239, 68, 68, 0.1); color: var(--color-error); border-radius: var(--radius-lg); font-size: var(--fs-xs); margin-bottom: var(--sp-4); align-items: center; gap: var(--sp-2);">
            <span>❌</span>
            <span id="auth-error-message">Error logging in.</span>
          </div>

          <!-- LOGIN FORM -->
          <form id="auth-login-form">
            <div class="form-group">
              <label for="auth-email" class="form-label">Email Address</label>
              <input type="email" id="auth-email" class="form-input" required placeholder="name@example.com" autocomplete="username">
            </div>
            <div class="form-group" style="margin-bottom: var(--sp-4);">
              <label for="auth-password" class="form-label">Password</label>
              <input type="password" id="auth-password" class="form-input" required placeholder="Enter password" autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: var(--sp-3);">
              🔑 Log In
            </button>
          </form>

          <!-- REGISTER FORM -->
          <form id="auth-register-form" style="display: none;">
            <div class="form-group">
              <label for="reg-name" class="form-label">Full Name</label>
              <input type="text" id="reg-name" class="form-input" required placeholder="e.g. Lalremruata">
            </div>
            <div class="form-group">
              <label for="reg-email" class="form-label">Email Address</label>
              <input type="email" id="reg-email" class="form-input" required placeholder="name@example.com" autocomplete="username">
            </div>
            <div class="form-group" style="margin-bottom: var(--sp-4);">
              <label for="reg-password" class="form-label">Password</label>
              <input type="password" id="reg-password" class="form-input" required placeholder="Create password (min 6 chars)" autocomplete="new-password">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: var(--sp-3);">
              📝 Create Account
            </button>
          </form>

          <!-- Divider -->
          <div style="display: flex; align-items: center; gap: var(--sp-3); margin: var(--sp-4) 0; color: var(--color-text-tertiary); font-size: var(--fs-xs);">
            <div style="flex: 1; height: 1px; background: var(--color-border-light);"></div>
            <span>OR</span>
            <div style="flex: 1; height: 1px; background: var(--color-border-light);"></div>
          </div>

          <!-- Google Login -->
          <button type="button" class="btn btn-outline" id="btn-google-auth" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: var(--sp-3);">
            <svg width="18" height="18" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.02-1.36-1.19-2.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        <div class="modal-footer" style="justify-content: center; padding-top: 0; font-size: var(--fs-xs);">
          <span id="auth-switch-text">Don't have an account? <a href="#" id="auth-switch-link" style="font-weight: var(--fw-semibold);">Register</a></span>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild);

  const closeBtn = document.getElementById('close-auth-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      ModalSystem.close('auth-modal');
    });
  }

  // Toggle Forms
  const switchLink = document.getElementById('auth-switch-link');
  const loginForm = document.getElementById('auth-login-form');
  const regForm = document.getElementById('auth-register-form');
  const modalTitle = document.getElementById('auth-modal-title');
  const switchText = document.getElementById('auth-switch-text');
  const errorAlert = document.getElementById('auth-error-alert');

  if (switchLink) {
    switchLink.addEventListener('click', function handleSwitch(e) {
      e.preventDefault();
      errorAlert.style.display = 'none';
      if (loginForm.style.display !== 'none') {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        modalTitle.textContent = 'Create Account';
        switchText.innerHTML = `Already have an account? <a href="#" id="auth-switch-link" style="font-weight: var(--fw-semibold);">Log In</a>`;
      } else {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        modalTitle.textContent = 'Sign In';
        switchText.innerHTML = `Don't have an account? <a href="#" id="auth-switch-link" style="font-weight: var(--fw-semibold);">Register</a>`;
      }
      // Re-attach listener since we re-wrote innerHTML
      document.getElementById('auth-switch-link').addEventListener('click', handleSwitch);
    });
  }

  // Submit login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    try {
      await AuthService.login(email, pass);
      ModalSystem.close('auth-modal');
      Toast.show('Welcome back!', 'success');
    } catch (err) {
      errorAlert.style.display = 'flex';
      document.getElementById('auth-error-message').textContent = err.message;
    }
  });

  // Submit register
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    try {
      await AuthService.register(email, pass, name);
      ModalSystem.close('auth-modal');
      Toast.show('Account registered!', 'success');
    } catch (err) {
      errorAlert.style.display = 'flex';
      document.getElementById('auth-error-message').textContent = err.message;
    }
  });

  // Submit Google Auth
  document.getElementById('btn-google-auth').addEventListener('click', async () => {
    errorAlert.style.display = 'none';
    try {
      await AuthService.loginWithGoogle();
      ModalSystem.close('auth-modal');
      Toast.show('Access granted!', 'success');
    } catch (err) {
      errorAlert.style.display = 'flex';
      document.getElementById('auth-error-message').textContent = err.message;
    }
  });
}

// ========================
// MOBILE MENU
// ========================
function setupMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('nav-mobile');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    btn.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('modal-open', isOpen);
  });

  // Close on nav link click
  nav.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('modal-open');
    });
  });
}

// ========================
// HEADER SCROLL EFFECT
// ========================
function setupHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    header.classList.toggle('scrolled', currentScroll > 20);
    lastScroll = currentScroll;
  }, { passive: true });
}

// ========================
// MODAL SYSTEM
// ========================
const ModalSystem = {
  open(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close(id);
    });

    // Close on Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close(id);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  close(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
};

// ========================
// TOAST NOTIFICATIONS
// ========================
const Toast = {
  container: null,

  init() {
    if (document.getElementById('toast-container')) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info') {
    this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${icons[type] || 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};

// ========================
// SCROLL REVEAL
// ========================
function setupScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// ========================
// LAZY LOADING
// ========================
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (!lazyImages.length) return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  lazyImages.forEach(img => imageObserver.observe(img));
}

// ========================
// FOOTER COMPONENT
// ========================
function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-puan-strip"></div>
    <div class="footer-content">
      <div class="footer-grid">
        <!-- Brand -->
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="assets/images/logo.png" alt="${ChurchInfo.name}" width="64" height="48">
            <div class="footer-logo-text">
              ${ChurchInfo.name}
              <small>${ChurchInfo.tagline}</small>
            </div>
          </div>
          <p class="footer-desc">${ChurchInfo.description}</p>
          <div class="social-links">
            <a href="${SocialMedia.instagram.url}" target="_blank" rel="noopener" class="social-link instagram" aria-label="Instagram" title="Follow on Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
            <a href="${SocialMedia.facebook.url}" target="_blank" rel="noopener" class="social-link facebook" aria-label="Facebook" title="Like on Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
            <a href="${SocialMedia.youtube.url}" target="_blank" rel="noopener" class="social-link youtube" aria-label="YouTube" title="Subscribe on YouTube"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-section">
          <h4>Quick Links</h4>
          <div class="footer-links">
            <a href="index.html" class="footer-link">Home</a>
            <a href="photos.html" class="footer-link">Photos</a>
            <a href="mipui-aw.html" class="footer-link">Mipui Aw</a>
            <a href="sermons.html" class="footer-link">Sermons</a>
          </div>
        </div>

        <!-- Contact -->
        <div class="footer-section">
          <h4>Contact</h4>
          <div class="footer-contact-item">
            <span class="icon">📍</span>
            <span>${ChurchInfo.address}</span>
          </div>
          <div class="footer-contact-item">
            <span class="icon">📞</span>
            <span>${ChurchInfo.phone}</span>
          </div>
          <div class="footer-contact-item">
            <span class="icon">✉️</span>
            <span>${ChurchInfo.email}</span>
          </div>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <p class="footer-copyright">© ${new Date().getFullYear()} ${ChurchInfo.name}. All rights reserved. Est. ${ChurchInfo.established}.</p>
        <div class="social-links" style="gap: 8px;">
          <a href="${SocialMedia.instagram.url}" target="_blank" rel="noopener" class="social-link instagram" style="width:32px;height:32px;" aria-label="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
          <a href="${SocialMedia.facebook.url}" target="_blank" rel="noopener" class="social-link facebook" style="width:32px;height:32px;" aria-label="Facebook"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
          <a href="${SocialMedia.youtube.url}" target="_blank" rel="noopener" class="social-link youtube" style="width:32px;height:32px;" aria-label="YouTube"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
        </div>
      </div>

      <!-- AdSense Placeholder -->
      <div class="footer-adsense">
        Reserved for Google AdSense — Add your ad code here
      </div>
    </div>
  `;
}
