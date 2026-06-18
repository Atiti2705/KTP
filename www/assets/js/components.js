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
        <div class="header-logo-text" style="font-family: var(--font-body); font-weight: 700; font-size: 1.2rem; letter-spacing: -0.5px;">
          ${ChurchInfo.name}
        </div>
      </a>

      <div class="header-actions" style="display: flex; align-items: center; gap: 12px;">
        <div class="theme-switcher">
          <button class="theme-btn" id="theme-toggle-btn" aria-label="Toggle theme" title="Toggle theme">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <div class="theme-dropdown" id="theme-dropdown">
            <button class="theme-option" data-theme="light">
              <span>Light</span>
            </button>
            <button class="theme-option" data-theme="dark">
              <span>Dark</span>
            </button>
            <button class="theme-option" data-theme="system">
              <span>System</span>
            </button>
          </div>
        </div>
        
        <button id="header-profile-btn" style="background: none; border: none; cursor: pointer; padding: 4px; color: var(--color-text);">
          <div id="header-user-widget" style="display:flex; align-items:center; justify-content:center; width: auto; padding: 4px 12px; border-radius: 20px; background: var(--brand-sky); color: white;">
            <span style="font-size: 13px; font-weight: bold; margin-right: 6px;">Login</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </button>

        <button id="notification-btn" aria-label="Notifications" style="position: relative; background: none; border: none; cursor: pointer; padding: 4px; color: var(--color-text);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span id="notification-badge" style="position: absolute; top: 0px; right: 2px; width: 10px; height: 10px; background: var(--brand-red, #dc2626); border-radius: 50%; display: none;"></span>
        </button>
      </div>
    </div>
  `;
  // Inject Notification logic
  const notifBtn = document.getElementById('notification-btn');
  const notifBadge = document.getElementById('notification-badge');

  function updateNotificationBadge() {
    if (!notifBadge) return;
    const sorted = typeof Announcements !== 'undefined' ? [...Announcements].filter(a => a.priority).sort((a, b) => {
      const aTime = a.createdAt || a.date || 0;
      const bTime = b.createdAt || b.date || 0;
      return new Date(bTime) - new Date(aTime);
    }) : [];
    if (sorted.length > 0) {
      const latestAnn = sorted[0];
      const lastRead = localStorage.getItem('last_read_announcement');
      if (lastRead !== latestAnn.id) {
        notifBadge.style.display = 'block';
      } else {
        notifBadge.style.display = 'none';
      }
    }
  }

  // Update badge immediately and every few seconds
  updateNotificationBadge();
  setTimeout(updateNotificationBadge, 2000);

  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      // Create and open notification modal
      let modal = document.getElementById('notification-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'notification-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
          <div class="modal" style="max-width: 400px; display: flex; flex-direction: column; padding: 0;">
            <div class="modal-header" style="padding: 16px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: var(--color-bg-card); z-index: 2; border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;">
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--color-text);">Notifications</h3>
              <button class="modal-close" id="close-notification-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--color-text);">&times;</button>
            </div>
            <div class="modal-body" id="notification-list" style="overflow-y: auto; padding: 0; display: flex; flex-direction: column; max-height: 60vh;">
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('close-notification-modal').addEventListener('click', () => {
          modal.classList.remove('active');
          setTimeout(() => { modal.style.display = 'none'; }, 300);
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
          }
        });
      }

      // Populate list
      const listEl = document.getElementById('notification-list');
      const sorted = typeof Announcements !== 'undefined' ? [...Announcements].filter(a => a.priority).sort((a, b) => {
        const aTime = a.createdAt || a.date || 0;
        const bTime = b.createdAt || b.date || 0;
        return new Date(bTime) - new Date(aTime);
      }) : [];
      
      if (sorted.length === 0) {
        listEl.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--color-text-secondary);">No new notifications</div>';
      } else {
        listEl.innerHTML = sorted.map((ann, i) => {
           // Highlight the first one if unread
           const lastRead = localStorage.getItem('last_read_announcement');
           const isUnread = (i === 0 && lastRead !== ann.id);
           
           // Extract text content cleanly (in case it contains HTML)
           const textContent = (ann.content || '').replace(/<[^>]*>?/gm, ' ');
           
           return `
             <div style="padding: 16px; border-bottom: 1px solid var(--color-border); background: ${isUnread ? 'var(--color-bg-hover)' : 'transparent'}; cursor: pointer;" onclick="window.location.href='index.html#announcements-widget'; document.getElementById('close-notification-modal').click();">
               <div style="display: flex; gap: 12px; align-items: flex-start;">
                 <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-bg-alt); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px;">
                   ${ann.imageUrl ? '📸' : '📢'}
                 </div>
                 <div>
                   <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; color: var(--color-text);">${ann.title || 'Announcement'}</h4>
                   <p style="margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${textContent}</p>
                   <span style="font-size: 0.75rem; color: var(--color-text-tertiary); display: block; margin-top: 6px;">${ann.date ? (typeof formatDate === 'function' ? formatDate(ann.date) : ann.date) : 'Recent'}</span>
                 </div>
               </div>
             </div>
           `;
        }).join('');
      }

      // Mark as read
      if (sorted.length > 0) {
        localStorage.setItem('last_read_announcement', sorted[0].id);
        updateNotificationBadge();
      }

      modal.style.display = 'flex';
      // Trigger reflow
      void modal.offsetWidth;
      modal.classList.add('active');
    });
  }

  // Remove existing mobile nav/bottom nav if it exists to avoid duplicates
  const existingNav = document.getElementById('nav-bottom');
  if (existingNav) {
    existingNav.remove();
  }
  
  const existingSideNav = document.getElementById('nav-mobile');
  if (existingSideNav) existingSideNav.remove();

  // Inject Mobile Sidebar Navigation directly into the body
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
    <a href="documents.html" class="nav-mobile-link ${activePage === 'documents' || activePage === 'sermons' ? 'active' : ''}">
      <span class="nav-icon">📄</span> Documents
    </a>
    <div class="nav-mobile-divider"></div>
    
    <div id="mobile-user-widget"></div>

    <a href="saved.html" class="nav-mobile-link ${activePage === 'saved' ? 'active' : ''}">
      <span class="nav-icon">🔖</span> Saved Items
    </a>
    <a href="admin/index.html" class="nav-mobile-link ${activePage === 'admin' ? 'active' : ''}">
      <span class="nav-icon">⚙️</span> Admin Dashboard
    </a>
  `;
  document.body.appendChild(mobileNav);

  // Setup mobile menu logic
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      document.body.classList.toggle('modal-open', isOpen);
    });
  }

  // Inject Bottom Navigation directly into the body
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';
  bottomNav.id = 'nav-bottom';
  bottomNav.setAttribute('aria-label', 'Bottom navigation');
  bottomNav.innerHTML = `
    <a href="index.html" class="bottom-nav-item ${activePage === 'home' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      <span style="font-size: 10px; margin-top: 2px;">Home</span>
    </a>
    <a href="photos.html" class="bottom-nav-item ${activePage === 'photos' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      <span style="font-size: 10px; margin-top: 2px;">Photos</span>
    </a>
    <a href="mipui-aw.html" class="bottom-nav-item ${activePage === 'mipui-aw' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      <span style="font-size: 10px; margin-top: 2px;">Mipui Aw</span>
    </a>
    <a href="documents.html" class="bottom-nav-item ${activePage === 'documents' || activePage === 'sermons' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      <span style="font-size: 10px; margin-top: 2px;">Documents</span>
    </a>
    <a href="hla-lyrics.html" class="bottom-nav-item ${activePage === 'hla-lyrics' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
      <span style="font-size: 10px; margin-top: 2px;">Hla Lyrics</span>
    </a>
    <a href="profile.html" class="bottom-nav-item ${activePage === 'profile' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      <span style="font-size: 10px; margin-top: 2px;">Profile</span>
    </a>
  `;
  document.body.appendChild(bottomNav);

  // Profile click opens auth modal or profile menu
  document.getElementById('header-profile-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const isGuest = !document.getElementById('header-user-widget').hasAttribute('data-uid');
    if (isGuest) {
      ModalSystem.open('auth-modal');
    } else {
      ModalSystem.open('profile-menu-modal');
    }
  });

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
// INJECT CREATE STORY MODAL
// ========================
function injectCreateStoryModal() {
  if (document.getElementById('create-story-modal')) return;

  const modalHtml = `
    <div class="modal-backdrop" id="create-story-modal" style="z-index: 9999;">
      <div class="modal" style="max-width: 400px; padding: var(--sp-2);">
        <div class="modal-header">
          <h3 id="create-story-title">Create Story</h3>
          <button class="modal-close" onclick="ModalSystem.close('create-story-modal')" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body" style="padding-top: var(--sp-4);">
          <form id="create-story-form">
            <div class="form-group">
              <label class="form-label">Story Text</label>
              <textarea id="story-title" class="form-input" required placeholder="What's on your mind?" rows="3"></textarea>
            </div>
            <div class="form-group" style="margin-bottom: var(--sp-4);">
              <label class="form-label">Photo (Optional)</label>
              <input type="file" id="story-image-file" class="form-input" accept="image/*">
            </div>
            <button type="submit" class="btn btn-primary" id="btn-submit-story" style="width: 100%;">
              Post Story
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const form = document.getElementById('create-story-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!AuthService || !AuthService.currentUser) return;
      
      const title = document.getElementById('story-title').value.trim();
      if (!title) return;

      const submitBtn = document.getElementById('btn-submit-story');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Uploading...';
      submitBtn.disabled = true;

      try {
        let imageUrl = '';
        const fileInput = document.getElementById('story-image-file');
        
        if (fileInput.files && fileInput.files.length > 0) {
          if (typeof firebase !== 'undefined' && firebase.storage) {
            const file = fileInput.files[0];
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child('stories/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, ''));
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = e => resolve(e.target.result);
              reader.readAsDataURL(file);
            });
            await fileRef.putString(base64, 'data_url');
            imageUrl = await fileRef.getDownloadURL();
          } else {
            console.error("Firebase Storage not available");
            if (window.Toast) Toast.show('Storage not configured. Upload failed.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
          }
        }

        submitBtn.innerHTML = 'Posting...';

        const newStory = {
          title: title,
          imageUrl: imageUrl,
          author: AuthService.currentUser.displayName || 'Member',
          authorId: AuthService.currentUser.uid,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        if (typeof DbService !== 'undefined') {
          await DbService.add('announcements', newStory);
        }
        
        if (typeof Announcements !== 'undefined') {
          Announcements.unshift(newStory);
        }
        
        if (typeof renderAnnouncements === 'function') {
          renderAnnouncements();
        }
        
        ModalSystem.close('create-story-modal');
        form.reset();
        if (window.Toast) Toast.show('Story posted!', 'success');
      } catch (err) {
        console.error("Error creating story:", err);
        if (window.Toast) Toast.show('Failed to post story. ' + (err.message || ''), 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
}

// ========================
// USER WIDGETS RENDERER
// ========================
function renderUserWidgets(user) {
  const headerWidget = document.getElementById('header-user-widget');

  // Inject modal markup once
  injectAuthModal();
  injectProfileMenuModal();
  injectCreateStoryModal();

  if (!user) {
    // 1. GUEST USER STATE
    if (headerWidget) {
      headerWidget.removeAttribute('data-uid');
      headerWidget.style.width = 'auto';
      headerWidget.style.padding = '4px 12px';
      headerWidget.style.borderRadius = '20px';
      headerWidget.style.background = 'var(--brand-sky)';
      headerWidget.style.color = 'white';
      headerWidget.innerHTML = `
        <span style="font-size: 13px; font-weight: bold; margin-right: 6px;">Login</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      `;
    }
  } else {
    // 2. AUTHENTICATED USER STATE
    const firstLetter = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';

    if (headerWidget) {
      headerWidget.setAttribute('data-uid', user.uid);
      headerWidget.style.width = '28px';
      headerWidget.style.padding = '0';
      headerWidget.style.borderRadius = '50%';
      headerWidget.style.background = 'var(--color-bg-hover)';
      headerWidget.style.color = 'inherit';
      const profilePic = user.photoBase64 || user.photoURL;
      headerWidget.innerHTML = `
        ${profilePic ? `<img src="${profilePic}" alt="${user.displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : `<div style="width:100%; height:100%; border-radius:50%; background:var(--color-primary); color:white; font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:12px;">${firstLetter}</div>`}
      `;
    }
    
    const profileMenuName = document.getElementById('profile-menu-name');
    if (profileMenuName) profileMenuName.textContent = user.displayName || user.email;
  }
}

// ========================
// INJECT AUTHENTICATION MODAL
// ========================
function injectAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const modalHtml = `
    <div class="modal-backdrop" id="auth-modal" style="z-index: 9999; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);">
      <div class="modal" style="max-width: 360px; width: 90%; padding: 40px 30px; border-radius: 24px; text-align: center; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.15); background: var(--color-bg-card); position: relative;">
        <button class="modal-close" id="close-auth-modal" aria-label="Close" style="position: absolute; right: 20px; top: 20px; border: none; background: var(--color-bg-hover); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; color: var(--color-text-secondary);">&times;</button>
        
        <img src="assets/images/logo.png" alt="Logo" style="width: 70px; height: auto; margin-bottom: 20px; object-fit: contain;">
        
        <h2 id="auth-modal-title" style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: var(--color-text); letter-spacing: -0.5px;">Welcome Back</h2>
        <p id="auth-modal-subtitle" style="margin: 0 0 24px 0; font-size: 14px; color: var(--color-text-secondary);">Sign in to continue to KṬP Saikhamakawn</p>

        <div class="login-error" id="auth-error-alert" style="display: none; text-align: left; padding: 12px 16px; background: rgba(239, 68, 68, 0.1); color: var(--brand-red, #dc2626); border-radius: 12px; font-size: 13px; margin-bottom: 24px; align-items: center; gap: 8px;">
          <span id="auth-error-message">Error logging in.</span>
        </div>

        <!-- LOGIN FORM -->
        <form id="auth-login-form">
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <input type="email" id="auth-email" required placeholder="Email or Username" autocomplete="username" style="width: 100%; box-sizing: border-box; padding: 14px 16px; background: var(--color-bg-hover); border: 2px solid transparent; border-radius: 12px; font-size: 14px; color: var(--color-text); outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='var(--brand-sky)'" onblur="this.style.borderColor='transparent'">
            <input type="password" id="auth-password" required placeholder="Password" autocomplete="current-password" style="width: 100%; box-sizing: border-box; padding: 14px 16px; background: var(--color-bg-hover); border: 2px solid transparent; border-radius: 12px; font-size: 14px; color: var(--color-text); outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='var(--brand-sky)'" onblur="this.style.borderColor='transparent'">
          </div>
          <button type="submit" style="width: 100%; padding: 14px; background: var(--color-text); color: var(--color-bg); border: none; border-radius: 24px; font-weight: 600; font-size: 15px; cursor: pointer; margin-bottom: 16px; transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
            Continue
          </button>
          <a href="#" style="color: var(--color-text-secondary); font-size: 13px; text-decoration: none; font-weight: 500;">Forgot your password?</a>
        </form>

        <!-- REGISTER FORM -->
        <form id="auth-register-form" style="display: none;">
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <input type="text" id="reg-name" required placeholder="Full Name" style="width: 100%; box-sizing: border-box; padding: 14px 16px; background: var(--color-bg-hover); border: 2px solid transparent; border-radius: 12px; font-size: 14px; color: var(--color-text); outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='var(--brand-sky)'" onblur="this.style.borderColor='transparent'">
            <input type="text" id="reg-username" required placeholder="Username" style="width: 100%; box-sizing: border-box; padding: 14px 16px; background: var(--color-bg-hover); border: 2px solid transparent; border-radius: 12px; font-size: 14px; color: var(--color-text); outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='var(--brand-sky)'" onblur="this.style.borderColor='transparent'">
            <input type="email" id="reg-email" required placeholder="Email Address" autocomplete="email" style="width: 100%; box-sizing: border-box; padding: 14px 16px; background: var(--color-bg-hover); border: 2px solid transparent; border-radius: 12px; font-size: 14px; color: var(--color-text); outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='var(--brand-sky)'" onblur="this.style.borderColor='transparent'">
            <input type="password" id="reg-password" required placeholder="Password" autocomplete="new-password" style="width: 100%; box-sizing: border-box; padding: 14px 16px; background: var(--color-bg-hover); border: 2px solid transparent; border-radius: 12px; font-size: 14px; color: var(--color-text); outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='var(--brand-sky)'" onblur="this.style.borderColor='transparent'">
          </div>
          <button type="submit" style="width: 100%; padding: 14px; background: var(--color-text); color: var(--color-bg); border: none; border-radius: 24px; font-weight: 600; font-size: 15px; cursor: pointer; margin-bottom: 16px; transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
            Create Account
          </button>
        </form>

        <!-- Divider -->
        <div style="display: flex; align-items: center; justify-content: center; margin: 24px 0; gap: 16px;">
          <div style="height: 1px; flex: 1; background: var(--color-border-light);"></div>
          <span style="color: var(--color-text-tertiary); font-size: 12px; font-weight: 600; text-transform: uppercase;">or</span>
          <div style="height: 1px; flex: 1; background: var(--color-border-light);"></div>
        </div>

        <!-- Google Login -->
        <button type="button" id="btn-google-auth" style="width: 100%; padding: 12px; display: flex; justify-content: center; align-items: center; gap: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 24px; font-weight: 600; color: var(--color-text); font-size: 14px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--color-bg-hover)'" onmouseout="this.style.background='var(--color-bg)'">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.02-1.36-1.19-2.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style="margin-top: 32px; font-size: 14px; color: var(--color-text-secondary);">
          <span id="auth-switch-text">Don't have an account? <a href="#" id="auth-switch-link" style="font-weight: 600; color: var(--color-text); text-decoration: underline;">Sign up</a></span>
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
      const subtitle = document.getElementById('auth-modal-subtitle');
      if (loginForm.style.display !== 'none') {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        if (modalTitle) modalTitle.textContent = 'Create Account';
        if (subtitle) subtitle.textContent = 'Join KṬP Saikhamakawn today';
        switchText.innerHTML = `Already have an account? <a href="#" id="auth-switch-link" style="font-weight: 600; color: var(--color-text); text-decoration: underline;">Sign in</a>`;
      } else {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'Welcome Back';
        if (subtitle) subtitle.textContent = 'Sign in to continue to KṬP Saikhamakawn';
        switchText.innerHTML = `Don't have an account? <a href="#" id="auth-switch-link" style="font-weight: 600; color: var(--color-text); text-decoration: underline;">Sign up</a>`;
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
      setTimeout(() => window.location.reload(), 1500);
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
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    try {
      await AuthService.register(email, pass, name, username);
      ModalSystem.close('auth-modal');
      Toast.show('Account registered!', 'success');
      setTimeout(() => window.location.reload(), 1500);
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
      setTimeout(() => window.location.reload(), 1500);
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

  // Close on nav link click
  nav.querySelectorAll('.nav-mobile-link').forEach(link => {
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
      <div class="footer-bottom">
        <p class="footer-copyright">© ${new Date().getFullYear()} ${ChurchInfo.name}. All rights reserved. Est. ${ChurchInfo.established}.</p>
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

// ========================
// INJECT PROFILE MENU MODAL
// ========================
function injectProfileMenuModal() {
  if (document.getElementById('profile-menu-modal')) return;

  const modalHtml = `
    <div class="modal-backdrop lightbox-modal" id="profile-menu-modal" style="z-index: 9999; align-items: flex-end;">
      <div class="modal-content" style="width: 100%; border-radius: 20px 20px 0 0; margin: 0; padding: 24px; animation: slideUp 0.3s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 4px;">Profile</h2>
            <div id="profile-menu-name" style="font-size: 0.9rem; color: var(--color-text-light);">Loading...</div>
          </div>
          <button class="modal-close" id="close-profile-menu-modal" aria-label="Close modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="saved.html" class="btn" style="display: flex; align-items: center; gap: 12px; justify-content: flex-start; padding: 16px; border-radius: 12px; background: var(--color-bg-hover); color: var(--color-text); text-decoration: none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            <span style="font-size: 1rem; font-weight: 500;">Saved Items</span>
          </a>
          
          <a href="admin/index.html" class="btn" style="display: flex; align-items: center; gap: 12px; justify-content: flex-start; padding: 16px; border-radius: 12px; background: var(--color-bg-hover); color: var(--color-text); text-decoration: none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <span style="font-size: 1rem; font-weight: 500;">Admin Dashboard</span>
          </a>
          
          <div style="height: 1px; background: var(--color-border); margin: 8px 0;"></div>
          
          <button id="profile-menu-logout" class="btn" style="display: flex; align-items: center; gap: 12px; justify-content: flex-start; padding: 16px; border-radius: 12px; background: rgba(220, 38, 38, 0.1); color: var(--brand-red); border: none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span style="font-size: 1rem; font-weight: 500;">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = modalHtml;
  document.body.appendChild(wrapper.firstElementChild);

  document.getElementById('close-profile-menu-modal').addEventListener('click', () => {
    ModalSystem.close('profile-menu-modal');
  });

  document.getElementById('profile-menu-logout').addEventListener('click', async () => {
    try {
      if (typeof AuthService !== 'undefined') {
        const btn = document.getElementById('profile-menu-logout');
        const origHtml = btn.innerHTML;
        btn.innerHTML = 'Logging out...';
        await AuthService.logout();
        ModalSystem.close('profile-menu-modal');
        if (window.Toast) Toast.show('Logged out successfully', 'success');
      }
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.show('Error logging out', 'error');
    }
  });
}

// ========================
// PUSH NOTIFICATIONS SETUP
// ========================
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment for Capacitor to be ready
  setTimeout(() => {
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform()) {
      initPushNotifications();
    }
  }, 1000);
});

function initPushNotifications() {
  const PushNotifications = window.Capacitor.Plugins?.PushNotifications;
  if (!PushNotifications) {
    console.log("PushNotifications plugin not loaded.");
    return;
  }

  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') {
      PushNotifications.register();
    } else {
      console.log('Push permission denied');
    }
  });

  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
    // Note: To use Firebase Console directly, you don't actually need to save this token!
    // Firebase SDK automatically registers the app instance with the FCM backend.
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received: ' + JSON.stringify(notification));
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show(notification.title || 'New Notification', 'info');
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push action performed: ' + JSON.stringify(notification));
  });
}
