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
        <a href="photos.html" class="nav-link ${activePage === 'photos' ? 'active' : ''}" id="nav-photos">Gallery</a>
        <div class="nav-dropdown" id="nav-chanchin-dropdown">
          <button class="nav-link nav-dropdown-trigger ${['branch-ob','branch-committee','group-committee','sub-committee','golden-jubilee'].includes(activePage) ? 'active' : ''}" id="nav-chanchin-btn" aria-expanded="false" aria-haspopup="true">
            Branch Chanchin <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;transition:transform 0.2s;opacity:0.8;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="nav-dropdown-menu" id="nav-chanchin-menu">
            <a href="branch-ob.html" class="nav-dropdown-item ${activePage === 'branch-ob' ? 'active' : ''}">Branch OB te</a>
            <a href="branch-committee.html" class="nav-dropdown-item ${activePage === 'branch-committee' ? 'active' : ''}">Branch Committee</a>
            <a href="group-committee.html" class="nav-dropdown-item ${activePage === 'group-committee' ? 'active' : ''}">Group Committee</a>
            <a href="sub-committee.html" class="nav-dropdown-item ${activePage === 'sub-committee' ? 'active' : ''}">Sub Committee</a>
            <a href="golden-jubilee.html" class="nav-dropdown-item ${activePage === 'golden-jubilee' ? 'active' : ''}">Golden Jubilee</a>
          </div>
        </div>
        <div class="nav-dropdown" id="nav-docs-dropdown">
          <button class="nav-link nav-dropdown-trigger ${['sermons','mipui-aw','hla-lyrics','bulletin','souvenir'].includes(activePage) ? 'active' : ''}" id="nav-docs-btn" aria-expanded="false" aria-haspopup="true">
            Documents <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;transition:transform 0.2s;opacity:0.8;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="nav-dropdown-menu" id="nav-docs-menu">
            <a href="mipui-aw.html" class="nav-dropdown-item ${activePage === 'mipui-aw' ? 'active' : ''}">Mipui Aw</a>
            <a href="sermons.html" class="nav-dropdown-item ${activePage === 'sermons' ? 'active' : ''}">Articles & Sermon</a>
            <a href="bulletin.html" class="nav-dropdown-item ${activePage === 'bulletin' ? 'active' : ''}">Bulletin</a>
            <a href="souvenir.html" class="nav-dropdown-item ${activePage === 'souvenir' ? 'active' : ''}">Souvenir</a>
            <a href="hla-lyrics.html" class="nav-dropdown-item ${activePage === 'hla-lyrics' ? 'active' : ''}">Hla Lyrics</a>
          </div>
        </div>
        <div class="nav-dropdown" id="nav-news-dropdown">
          <button class="nav-link nav-dropdown-trigger ${['news','lawmpuina','sunna'].includes(activePage) ? 'active' : ''}" id="nav-news-btn" aria-expanded="false" aria-haspopup="true">
            News <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;transition:transform 0.2s;opacity:0.8;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="nav-dropdown-menu" id="nav-news-menu">
            <a href="news.html" class="nav-dropdown-item ${activePage === 'news' ? 'active' : ''}">Branch Thuchhuak</a>
            <a href="lawmpuina.html" class="nav-dropdown-item ${activePage === 'lawmpuina' ? 'active' : ''}">Lawmpuina</a>
            <a href="sunna.html" class="nav-dropdown-item ${activePage === 'sunna' ? 'active' : ''}">Sunna</a>
          </div>
        </div>
        <div class="nav-dropdown" id="nav-history-dropdown">
          <button class="nav-link nav-dropdown-trigger ${['kohhran-chanchin','kohhran-upa','golden-jubilee'].includes(activePage) ? 'active' : ''}" id="nav-history-btn" aria-expanded="false" aria-haspopup="true">
            Kohhran <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;transition:transform 0.2s;opacity:0.8;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="nav-dropdown-menu" id="nav-history-menu">
            <a href="kohhran-chanchin.html" class="nav-dropdown-item ${activePage === 'kohhran-chanchin' ? 'active' : ''}">Kohhran Chanchin</a>
            <a href="kohhran-upa.html" class="nav-dropdown-item ${activePage === 'kohhran-upa' ? 'active' : ''}">Kohhran Upa</a>
            <a href="golden-jubilee.html" class="nav-dropdown-item ${activePage === 'golden-jubilee' ? 'active' : ''}">Golden Jubilee</a>
          </div>
        </div>
        <div class="nav-dropdown" id="nav-about-dropdown">
          <button class="nav-link nav-dropdown-trigger ${['statistic','contact'].includes(activePage) ? 'active' : ''}" id="nav-about-btn" aria-expanded="false" aria-haspopup="true">
            About Us <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;transition:transform 0.2s;opacity:0.8;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="nav-dropdown-menu" id="nav-about-menu">
            <a href="statistic.html" class="nav-dropdown-item ${activePage === 'statistic' ? 'active' : ''}">Statistic</a>
            <a href="contact.html" class="nav-dropdown-item ${activePage === 'contact' ? 'active' : ''}">Contact</a>
          </div>
        </div>
        <a href="counselling.html" class="nav-link ${activePage === 'counselling' ? 'active' : ''}" id="nav-counselling">Counselling</a>
      </nav>

      <div class="header-actions">
        <div class="theme-switcher">
          <button class="theme-btn" id="theme-toggle-btn" aria-label="Toggle theme" title="Toggle theme">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <div class="theme-dropdown" id="theme-dropdown">
            <button class="theme-option" data-theme="light">
              <span class="theme-option-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></span>
              <span>Light</span>
            </button>
            <button class="theme-option" data-theme="dark">
              <span class="theme-option-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>
              <span>Dark</span>
            </button>
            <button class="theme-option" data-theme="system">
              <span class="theme-option-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span>
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
      <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span> Home
    </a>
    <a href="photos.html" class="nav-mobile-link ${activePage === 'photos' ? 'active' : ''}">
      <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></span> Gallery
    </a>
    <div class="nav-mobile-group">
      <button class="nav-mobile-link nav-mobile-group-trigger ${['branch-ob','branch-committee','group-committee','sub-committee','golden-jubilee'].includes(activePage) ? 'active' : ''}" id="mobile-chanchin-trigger">
        <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></span> Branch Chanchin
        <svg class="nav-mobile-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="nav-mobile-subnav" id="mobile-chanchin-subnav" style="display:none;">
        <a href="branch-ob.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'branch-ob' ? 'active' : ''}">
          Branch OB te
        </a>
        <a href="branch-committee.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'branch-committee' ? 'active' : ''}">
          Branch Committee
        </a>
        <a href="group-committee.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'group-committee' ? 'active' : ''}">
          Group Committee
        </a>
        <a href="sub-committee.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'sub-committee' ? 'active' : ''}">
          Sub Committee
        </a>
        <a href="golden-jubilee.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'golden-jubilee' ? 'active' : ''}">
          Golden Jubilee
        </a>
      </div>
    </div>
    <div class="nav-mobile-group">
      <button class="nav-mobile-link nav-mobile-group-trigger ${['sermons','mipui-aw','hla-lyrics','bulletin','souvenir'].includes(activePage) ? 'active' : ''}" id="mobile-docs-trigger">
        <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span> Documents
        <svg class="nav-mobile-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="nav-mobile-subnav" id="mobile-docs-subnav" style="display:none;">
        <a href="mipui-aw.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'mipui-aw' ? 'active' : ''}">
          Mipui Aw
        </a>
        <a href="sermons.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'sermons' ? 'active' : ''}">
          Articles & Sermon
        </a>
        <a href="bulletin.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'bulletin' ? 'active' : ''}">
          Bulletin
        </a>
        <a href="souvenir.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'souvenir' ? 'active' : ''}">
          Souvenir
        </a>
        <a href="hla-lyrics.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'hla-lyrics' ? 'active' : ''}">
          Hla Lyrics
        </a>
      </div>
    </div>
    <div class="nav-mobile-group">
      <button class="nav-mobile-link nav-mobile-group-trigger ${['news','lawmpuina','sunna'].includes(activePage) ? 'active' : ''}" id="mobile-news-trigger">
        <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg></span> News
        <svg class="nav-mobile-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="nav-mobile-subnav" id="mobile-news-subnav" style="display:none;">
        <a href="news.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'news' ? 'active' : ''}">
          Branch Thuchhuak
        </a>
        <a href="lawmpuina.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'lawmpuina' ? 'active' : ''}">
          Lawmpuina
        </a>
        <a href="sunna.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'sunna' ? 'active' : ''}">
          Sunna
        </a>
      </div>
    </div>
    <div class="nav-mobile-group">
      <button class="nav-mobile-link nav-mobile-group-trigger ${['kohhran-chanchin','kohhran-upa','golden-jubilee'].includes(activePage) ? 'active' : ''}" id="mobile-history-trigger">
        <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg></span> Kohhran
        <svg class="nav-mobile-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="nav-mobile-subnav" id="mobile-history-subnav" style="display:none;">
        <a href="kohhran-chanchin.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'kohhran-chanchin' ? 'active' : ''}">
          Kohhran Chanchin
        </a>
        <a href="kohhran-upa.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'kohhran-upa' ? 'active' : ''}">
          Kohhran Upa
        </a>
        <a href="golden-jubilee.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'golden-jubilee' ? 'active' : ''}">
          Golden Jubilee
        </a>
      </div>
    </div>
    <div class="nav-mobile-group">
      <button class="nav-mobile-link nav-mobile-group-trigger ${['statistic','contact'].includes(activePage) ? 'active' : ''}" id="mobile-about-trigger">
        <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span> About Us
        <svg class="nav-mobile-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="nav-mobile-subnav" id="mobile-about-subnav" style="display:none;">
        <a href="statistic.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'statistic' ? 'active' : ''}">
          Statistic
        </a>
        <a href="contact.html" class="nav-mobile-link nav-mobile-sublink ${activePage === 'contact' ? 'active' : ''}">
          Contact
        </a>
      </div>
    </div>
    <a href="counselling.html" class="nav-mobile-link ${activePage === 'counselling' ? 'active' : ''}">
      <span class="nav-icon" style="display:inline-flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></span> Counselling
    </a>
    <a href="saved.html" class="nav-mobile-link ${activePage === 'saved' ? 'active' : ''}">
      <span class="nav-icon" style="display: inline-flex; align-items: center; justify-content: center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></span> Saved
    </a>
    <div class="nav-mobile-divider"></div>

    <!-- Mobile Theme Row -->
    <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0;">
      <span style="font-size: 0.85rem; color: var(--color-text-secondary); font-weight: 500;">Appearance</span>
      <div style="display: flex; background: var(--color-bg-alt); padding: 4px; border-radius: 30px; border: 1px solid var(--color-border-light); width: 100%;">
        <button class="mobile-theme-opt" data-theme="light" style="flex:1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 0; border-radius: 26px; border: none; background: transparent; color: var(--color-text-secondary); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Light
        </button>
        <button class="mobile-theme-opt" data-theme="dark" style="flex:1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 0; border-radius: 26px; border: none; background: transparent; color: var(--color-text-secondary); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Dark
        </button>
        <button class="mobile-theme-opt" data-theme="system" style="flex:1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 0; border-radius: 26px; border: none; background: transparent; color: var(--color-text-secondary); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Auto
        </button>
      </div>
    </div>

    <div class="nav-mobile-divider"></div>

    <!-- Mobile User Widget Section -->
    <div id="mobile-user-widget"></div>

  `;
  document.body.appendChild(mobileNav);

  // Setup mobile menu
  setupMobileMenu();
  // Setup header scroll effect
  setupHeaderScroll();
  // Setup nav dropdowns
  setupNavDropdowns();

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
        <button class="btn btn-primary" id="mobile-login-btn" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; margin: 12px 0; border-radius: var(--radius-full); padding: 12px; font-weight: bold; background: var(--brand-sky); color: white; border: none; box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Login
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
        <button class="theme-btn" id="user-dropdown-btn" style="border-radius: var(--radius-full); background: var(--color-bg-hover); font-weight: bold; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border: 2px solid var(--brand-sky); padding: 0; overflow: hidden;" aria-label="User menu">
          ${user.photoURL ? `<img src="${user.photoURL}" alt="${user.displayName}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : firstLetter}
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
        <div style="display:flex; align-items:center; gap:10px; padding:8px 12px; border-top: 1px solid var(--color-border); margin-top:8px;">
          <div style="width:32px; height:32px; border-radius:50%; background:var(--brand-sky); color:white; font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:14px; border: 2px solid var(--brand-sky-dark); overflow: hidden; flex-shrink:0;">
            ${user.photoURL ? `<img src="${user.photoURL}" alt="${user.displayName}" style="width:100%; height:100%; object-fit:cover;">` : firstLetter}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:bold; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: var(--color-text);">${user.displayName}</div>
            <div style="font-size:11px; color:var(--color-text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${user.email}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; padding:8px 12px; width: 100%; box-sizing: border-box;">
          ${user.role === 'admin' ? `
            <a href="admin/dashboard.html" class="nav-mobile-link" style="flex:1 1 0%; width:100%; font-size:14px; padding:10px 12px; background:var(--color-bg-hover); border-radius:var(--radius-lg); text-align:center; justify-content:center; white-space:nowrap;">
              <svg width="18" height="18" style="margin-right:4px; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Control Panel
            </a>
          ` : ''}
          <a href="#" id="mobile-logout-btn" class="nav-mobile-link" style="flex:1 1 0%; width:100%; font-size:14px; padding:10px 12px; color:#fff; background:var(--brand-red); border-radius:var(--radius-lg); text-align:center; justify-content:center; white-space:nowrap; display:flex;">
            <svg width="18" height="18" style="margin-right:4px; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Sign Out
          </a>
        </div>
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
    <div class="modal-backdrop" id="auth-modal" style="z-index: 9999;">
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

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    btn.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('modal-open', isOpen);
  });

  // Close on nav link click (but NOT the dropdown trigger)
  nav.querySelectorAll('.nav-mobile-link').forEach(link => {
    if (link.classList.contains('nav-mobile-group-trigger')) return;
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('modal-open');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('modal-open');
    }
  });

  // Mobile theme buttons
  nav.querySelectorAll('.mobile-theme-opt').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const theme = button.dataset.theme;
      if (typeof ThemeManager !== 'undefined' && ThemeManager.applyTheme) {
        ThemeManager.applyTheme(theme);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('ktp-theme-preference', theme); } catch(_) {}
      }
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
// NAV DROPDOWNS
// ========================
function setupNavDropdowns() {
  // Generic desktop dropdown setup
  const desktopDropdowns = [
    { dropdown: 'nav-about-dropdown', btn: 'nav-about-btn', menu: 'nav-about-menu' },
    { dropdown: 'nav-chanchin-dropdown', btn: 'nav-chanchin-btn', menu: 'nav-chanchin-menu' },
    { dropdown: 'nav-docs-dropdown', btn: 'nav-docs-btn', menu: 'nav-docs-menu' },
    { dropdown: 'nav-news-dropdown', btn: 'nav-news-btn', menu: 'nav-news-menu' },
    { dropdown: 'nav-history-dropdown', btn: 'nav-history-btn', menu: 'nav-history-menu' }
  ];

  desktopDropdowns.forEach(({ dropdown: dropId, btn: btnId, menu: menuId }) => {
    const dropdown = document.getElementById(dropId);
    const dropdownBtn = document.getElementById(btnId);
    const dropdownMenu = document.getElementById(menuId);
    if (!dropdown || !dropdownBtn || !dropdownMenu) return;

    dropdown.addEventListener('mouseenter', () => {
      dropdownMenu.classList.add('active');
      dropdownBtn.setAttribute('aria-expanded', 'true');
    });
    dropdown.addEventListener('mouseleave', () => {
      dropdownMenu.classList.remove('active');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    });
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other desktop dropdowns
      desktopDropdowns.forEach(other => {
        if (other.menu !== menuId) {
          const otherMenu = document.getElementById(other.menu);
          const otherBtn = document.getElementById(other.btn);
          if (otherMenu) otherMenu.classList.remove('active');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });
      const isOpen = dropdownMenu.classList.toggle('active');
      dropdownBtn.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdownMenu.classList.remove('active');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Generic mobile expandable setup
  const mobileGroups = [
    { trigger: 'mobile-about-trigger', subnav: 'mobile-about-subnav' },
    { trigger: 'mobile-chanchin-trigger', subnav: 'mobile-chanchin-subnav' },
    { trigger: 'mobile-docs-trigger', subnav: 'mobile-docs-subnav' },
    { trigger: 'mobile-news-trigger', subnav: 'mobile-news-subnav' },
    { trigger: 'mobile-history-trigger', subnav: 'mobile-history-subnav' }
  ];

  mobileGroups.forEach(({ trigger: trigId, subnav: subId }) => {
    const mobileTrigger = document.getElementById(trigId);
    const mobileSubnav = document.getElementById(subId);
    if (!mobileTrigger || !mobileSubnav) return;

    // Auto-expand if currently on a sub-page
    if (mobileTrigger.classList.contains('active')) {
      mobileSubnav.style.display = 'block';
      const chevron = mobileTrigger.querySelector('.nav-mobile-chevron');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    }

    mobileTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = mobileSubnav.style.display === 'block';
      mobileSubnav.style.display = isOpen ? 'none' : 'block';
      const chevron = mobileTrigger.querySelector('.nav-mobile-chevron');
      if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  });
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
    
    // Push history state to intercept mobile swipe-back
    history.pushState({ modalId: id }, '', `#${id}`);
    
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

  close(id, fromHistory = false) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    
    // If not triggered by a popstate event, pop the history stack
    if (!fromHistory && history.state && history.state.modalId === id) {
      history.back();
    }
  }
};

// Handle native back button / swipe back
window.addEventListener('popstate', (e) => {
  const activeModals = document.querySelectorAll('.modal-backdrop.active, .modal.active');
  activeModals.forEach(modal => {
    ModalSystem.close(modal.id, true);
  });
});

// ========================
// TOAST NOTIFICATIONS
// ========================
const Toast = window.Toast = {
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
            <a href="${SocialMedia.youtube.url}" target="_blank" rel="noopener" class="social-link youtube" aria-label="YouTube" title="Subscribe on YouTube"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
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
      <div class="footer-bottom" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <p class="footer-copyright">© ${new Date().getFullYear()} ${ChurchInfo.name}. All rights reserved. Est. ${ChurchInfo.established}.</p>
        <a href="admin/index.html" style="color: var(--color-text-secondary); text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; transition: color 0.2s;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Admin Login</a>
      </div>

      <!-- AdSense Placeholder -->
      <div class="footer-adsense">
        Reserved for Google AdSense — Add your ad code here
      </div>
    </div>
  `;
}

/* ========================================
   Selection Manager (Drive-Style)
   ======================================== */
class SelectionManager {
  constructor(listContainerId, itemSelector, onSelectionChange, previewCallback) {
    this.container = document.getElementById(listContainerId);
    this.itemSelector = itemSelector;
    this.onSelectionChange = onSelectionChange;
    this.previewCallback = previewCallback;
    
    this.selectedItems = new Set();
    this.selectionMode = false;
    this.longPressTimer = null;
    this.lastSelectedIndex = -1;

    if (this.container) {
      this.initEvents();
    }
  }

  initEvents() {
    let startX = 0;
    let startY = 0;

    // Handle pointerdown for long press (mobile)
    this.container.addEventListener('pointerdown', (e) => {
      this.lastPointerType = e.pointerType;
      const item = e.target.closest(this.itemSelector);
      if (!item) return;

      if (e.pointerType === 'touch') {
        startX = e.clientX;
        startY = e.clientY;
        this.longPressTimer = setTimeout(() => {
          this.handleLongPress(item);
        }, 500); // 500ms long press
      }
    });

    this.container.addEventListener('pointerup', () => clearTimeout(this.longPressTimer));
    this.container.addEventListener('pointercancel', () => clearTimeout(this.longPressTimer));
    this.container.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        // Only clear if moved more than a small threshold (handles sensitive digitizers like Pixel 6a)
        if (dx > 10 || dy > 10) {
          clearTimeout(this.longPressTimer);
        }
      } else {
        clearTimeout(this.longPressTimer);
      }
    });

    // Handle contextmenu (prevent default on long press)
    this.container.addEventListener('contextmenu', (e) => {
      const item = e.target.closest(this.itemSelector);
      // contextmenu is a MouseEvent so pointerType is undefined, use last stored
      if (item && this.lastPointerType === 'touch') {
        e.preventDefault();
      }
    });

    // Handle clicks
    this.container.addEventListener('click', (e) => {
      const item = e.target.closest(this.itemSelector);
      if (!item) return;

      e.preventDefault();

      // Don't trigger click if we just triggered long press
      if (item.hasAttribute('data-just-longpressed')) {
        item.removeAttribute('data-just-longpressed');
        return;
      }

      this.handleClick(e, item);
    });

    // Handle double clicks (desktop)
    this.container.addEventListener('dblclick', (e) => {
      const item = e.target.closest(this.itemSelector);
      if (!item) return;
      
      e.preventDefault();
      // Clear selection and preview
      this.clearSelection();
      if (this.previewCallback) {
        this.previewCallback(item.dataset.id);
      }
    });
  }

  handleLongPress(item) {
    item.setAttribute('data-just-longpressed', 'true');
    this.selectionMode = true;
    this.toggleSelection(item);
    
    // Vibrate for feedback if supported
    if (navigator.vibrate) navigator.vibrate(50);
  }

  handleClick(e, item) {
    const isTouch = e.pointerType === 'touch' || e.pointerType === ''; // '' sometimes happens on mobile tap
    const items = Array.from(this.container.querySelectorAll(this.itemSelector));
    const index = items.indexOf(item);

    if (this.selectionMode && isTouch) {
      // In selection mode on mobile, single tap toggles selection
      this.toggleSelection(item);
      return;
    }

    if (isTouch) {
      // Not in selection mode on mobile, single tap opens preview
      if (this.previewCallback) {
        this.previewCallback(item.dataset.id);
      }
      return;
    }

    // --- Desktop Logic ---
    const id = item.dataset.id;
    
    if (e.shiftKey && this.lastSelectedIndex !== -1) {
      // Shift-click range selection
      const start = Math.min(this.lastSelectedIndex, index);
      const end = Math.max(this.lastSelectedIndex, index);
      
      for (let i = start; i <= end; i++) {
        const currentItem = items[i];
        if (currentItem) {
          this.addToSelection(currentItem);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd click toggle
      this.toggleSelection(item);
      this.lastSelectedIndex = index;
    } else {
      // Plain click: clear and select just this one
      this.clearSelection();
      this.addToSelection(item);
      this.lastSelectedIndex = index;
    }
  }

  toggleSelection(item) {
    const data = JSON.stringify({ url: item.dataset.url, name: item.dataset.name });
    
    if (this.selectedItems.has(data)) {
      this.selectedItems.delete(data);
      item.classList.remove('selected');
    } else {
      if (item.dataset.url) {
        this.selectedItems.add(data);
        item.classList.add('selected');
      } else {
        if(typeof Toast !== 'undefined') Toast.show('Cannot select this file type (URL missing).', 'error');
      }
    }

    if (this.selectedItems.size === 0) {
      this.selectionMode = false;
    }

    this.notifyChange();
  }

  addToSelection(item) {
    if (!item.dataset.url) return;
    const data = JSON.stringify({ url: item.dataset.url, name: item.dataset.name });
    this.selectedItems.add(data);
    item.classList.add('selected');
    this.notifyChange();
  }

  clearSelection() {
    this.selectedItems.clear();
    this.container.querySelectorAll(this.itemSelector).forEach(el => el.classList.remove('selected'));
    this.selectionMode = false;
    this.lastSelectedIndex = -1;
    this.notifyChange();
  }

  selectAll() {
    this.container.querySelectorAll(this.itemSelector).forEach(item => {
      this.addToSelection(item);
    });
    this.selectionMode = true;
  }

  notifyChange() {
    const toolbar = document.getElementById('selection-toolbar');
    if (toolbar) {
      const anySelected = document.querySelectorAll('.selectable-item.selected').length > 0;
      toolbar.style.display = anySelected ? 'flex' : 'none';
    }

    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedItems);
    }
  }
}

window.SelectionManager = SelectionManager;

/* =========================================
   TouchZoomHandler (Google Drive Style Zoom)
   ========================================= */
class TouchZoomHandler {
  constructor(imageElement, modalElement, onSwipeLeft, onSwipeRight) {
    this.img = imageElement;
    this.modal = modalElement;
    this.onSwipeLeft = onSwipeLeft;
    this.onSwipeRight = onSwipeRight;

    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;

    this.lastTapTime = 0;
    
    // For panning
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.prevTranslateX = 0;
    this.prevTranslateY = 0;

    // For pinch zoom
    this.initialPinchDistance = null;
    this.initialScale = 1;

    this.initEvents();
  }

  reset() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }

  updateTransform(clamp = true) {
    if (this.scale < 1) this.scale = 1;
    if (clamp) {
      if (this.scale === 1) {
        this.translateX = 0;
        this.translateY = 0;
      } else {
        const maxTx = (this.scale - 1) * this.img.offsetWidth / 2;
        const maxTy = (this.scale - 1) * this.img.offsetHeight / 2;
        if (this.translateX > maxTx) this.translateX = maxTx;
        if (this.translateX < -maxTx) this.translateX = -maxTx;
        if (this.translateY > maxTy) this.translateY = maxTy;
        if (this.translateY < -maxTy) this.translateY = -maxTy;
      }
    }
    this.img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  initEvents() {
    this.img.style.transition = 'transform 0.1s ease-out';
    this.img.style.touchAction = 'none'; // Prevent browser default zoom/pan

    // We attach events to modal to catch touches even outside image bounds
    this.modal.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.modal.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.modal.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onTouchStart(e) {
    // Only intercept if we are interacting with the modal background or image itself, not buttons
    if (e.target.closest('button') || e.target.closest('a')) return;

    if (e.touches.length === 2) {
      //e.preventDefault(); // Sometimes causes issues on iOS
      this.initialPinchDistance = this.getDistance(e.touches);
      this.initialScale = this.scale;
      this.isDragging = false;
    } else if (e.touches.length === 1) {
      // Check double tap
      const now = Date.now();
      if (now - this.lastTapTime < 300) {
        // Double tap
        e.preventDefault();
        this.img.style.transition = 'transform 0.3s ease';
        if (this.scale > 1) {
          this.scale = 1;
        } else {
          this.scale = 2.5; // Zoom in
        }
        this.updateTransform();
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.prevTranslateX = this.translateX;
        this.prevTranslateY = this.translateY;
        this.img.style.transition = 'none'; // disable transition during drag
      }
    }
  }

  onTouchMove(e) {
    if (e.target.closest('button') || e.target.closest('a')) return;

    if (e.touches.length === 2 && this.initialPinchDistance) {
      e.preventDefault();
      const dist = this.getDistance(e.touches);
      this.scale = this.initialScale * (dist / this.initialPinchDistance);
      this.updateTransform();
    } else if (e.touches.length === 1 && this.isDragging) {
      e.preventDefault();
      const dx = e.touches[0].clientX - this.startX;
      const dy = e.touches[0].clientY - this.startY;
      
      if (this.scale > 1) {
        let newTx = this.prevTranslateX + dx;
        const maxTx = (this.scale - 1) * this.img.offsetWidth / 2;
        
        // Allow overscroll with resistance
        if (newTx > maxTx) {
          newTx = maxTx + (newTx - maxTx) * 0.3;
        } else if (newTx < -maxTx) {
          newTx = -maxTx + (newTx + maxTx) * 0.3;
        }
        
        this.translateX = newTx;
        this.translateY = this.prevTranslateY + dy;
        this.updateTransform(false); // pass false to not clamp visually
      } else {
        // Swiping when not zoomed in
        this.translateX = dx;
        this.img.style.transform = `translate(${this.translateX}px, 0) scale(1)`;
      }
    }
  }

  onTouchEnd(e) {
    this.initialPinchDistance = null;
    this.isDragging = false;
    this.img.style.transition = 'transform 0.3s ease-out';

    if (this.scale <= 1) {
      if (this.translateX < -50) {
        if (this.onSwipeLeft) this.onSwipeLeft();
      } else if (this.translateX > 50) {
        if (this.onSwipeRight) this.onSwipeRight();
      }
      this.reset();
    } else {
      const maxTx = (this.scale - 1) * this.img.offsetWidth / 2;
      // If overscrolled by 50px, navigate
      if (this.translateX > maxTx + 50) {
        if (this.onSwipeRight) this.onSwipeRight();
        this.reset();
      } else if (this.translateX < -maxTx - 50) {
        if (this.onSwipeLeft) this.onSwipeLeft();
        this.reset();
      } else {
        this.updateTransform(true); // Snap back
      }
    }
  }
}

window.TouchZoomHandler = TouchZoomHandler;
