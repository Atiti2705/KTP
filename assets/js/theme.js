/* ============================================
   KṬP Saikhamakawn — Theme System
   Light / Dark / System theme switcher
   Saves preference to localStorage
   ============================================ */

const ThemeManager = {
  STORAGE_KEY: 'ktp-theme-preference',
  THEMES: ['light', 'dark', 'system'],

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'system';
    this.applyTheme(saved);
    this.watchSystemTheme();
    this.setupToggle();
  },

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  applyTheme(theme) {
    this.currentTheme = theme;
    const effectiveTheme = theme === 'system' ? this.getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem(this.STORAGE_KEY, theme);

    // Update toggle button icon
    this.updateToggleIcon(effectiveTheme);

    // Update dropdown active states
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });
  },

  updateToggleIcon(effectiveTheme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    btn.innerHTML = effectiveTheme === 'dark' ? '🌙' : '☀️';
  },

  watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
      }
    });
  },

  setupToggle() {
    // Theme toggle button
    const btn = document.getElementById('theme-toggle-btn');
    const dropdown = document.getElementById('theme-dropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    // Theme options
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.applyTheme(opt.dataset.theme);
        dropdown.classList.remove('active');
      });
    });

    // Close dropdown on outside click
    if (!this.globalClickListenerAdded) {
      document.addEventListener('click', () => {
        const dropdown = document.getElementById('theme-dropdown');
        if (dropdown) dropdown.classList.remove('active');
      });
      this.globalClickListenerAdded = true;
    }
  }
};

// Initialize immediately
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());

// Apply saved theme before DOM loads to prevent flash
(function() {
  const saved = localStorage.getItem('ktp-theme-preference') || 'system';
  let theme = saved;
  if (saved === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
