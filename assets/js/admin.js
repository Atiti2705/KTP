/* ============================================
   KṬP Saikhamakawn — Admin Dashboard Logic
   Handles authentication, sidebar/topbar rendering,
   and CRUD operations with Firebase syncing.
   ============================================ */

const AdminAuth = {
  check() {
    const isLoginPage = window.location.pathname.endsWith('admin/') || window.location.pathname.endsWith('admin/index.html');

    // Fast local check to prevent screen flash
    const loggedIn = localStorage.getItem('ktp_admin_logged_in');
    if (!loggedIn && !isLoginPage) {
      window.location.href = 'index.html'; // Redirect to login page
      return;
    } else if (loggedIn && isLoginPage) {
      window.location.href = 'dashboard.html'; // Redirect to dashboard if already logged in
      return;
    }

    // Live Firebase Auth validation
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      // Listen to live auth changes to handle token expiration or unauthorized users
      AuthService.onAuthStateChanged((user) => {
        const currentIsLoginPage = window.location.pathname.endsWith('admin/') || window.location.pathname.endsWith('admin/index.html');
        if (!user || user.role !== 'admin') {
          if (!currentIsLoginPage) {
            localStorage.removeItem('ktp_admin_logged_in');
            localStorage.removeItem('ktp_admin_user');
            window.location.href = 'index.html';
          }
        } else {
          if (currentIsLoginPage) {
            window.location.href = 'dashboard.html';
          }
        }
      });
    }
  },

  async login(username, password) {
    let email = username.toLowerCase().trim();
    if (!email.includes('@')) {
      email = `${email}@ktpsaikhamakawn.org`;
    }

    try {
      const user = await AuthService.login(email, password);
      if (user && user.role === 'admin') {
        localStorage.setItem('ktp_admin_logged_in', 'true');
        localStorage.setItem('ktp_admin_user', JSON.stringify({ name: user.displayName, role: 'Administrator' }));
        return true;
      } else if (user) {
        // Logged in but not an admin!
        await AuthService.logout();
        throw new Error("Access denied. Admin privileges required.");
      }
      return false;
    } catch (error) {
      console.error("Admin Login Error:", error);
      throw error;
    }
  },

  async loginWithGoogle() {
    try {
      const user = await AuthService.loginWithGoogle();
      if (user && user.role === 'admin') {
        localStorage.setItem('ktp_admin_logged_in', 'true');
        localStorage.setItem('ktp_admin_user', JSON.stringify({ name: user.displayName, role: 'Administrator' }));
        return true;
      } else if (user) {
        await AuthService.logout();
        throw new Error("Access denied. Admin privileges required.");
      }
      return false;
    } catch (error) {
      console.error("Admin Google Login Error:", error);
      throw error;
    }
  },

  async logout() {
    await AuthService.logout();
  }
};

// ========================
// DATA PERSISTENCE LAYER
// Uses localStorage for mock database CRUD operations.
// Automatically syncs to Firebase in the background if configured.
// ========================
const AdminData = {
  init() {
    // Photos
    if (!localStorage.getItem('db_photos')) {
      localStorage.setItem('db_photos', JSON.stringify(Photos));
    }
    // Documents
    if (!localStorage.getItem('db_documents')) {
      localStorage.setItem('db_documents', JSON.stringify(Documents));
    }
    // Sermons
    if (!localStorage.getItem('db_sermons')) {
      localStorage.setItem('db_sermons', JSON.stringify(Sermons));
    }
    // Announcements
    if (!localStorage.getItem('db_announcements')) {
      localStorage.setItem('db_announcements', JSON.stringify(Announcements));
    }
    // About
    if (!localStorage.getItem('db_about')) {
      localStorage.setItem('db_about', JSON.stringify(About));
    }
    // Kohhran Chanchin
    if (!localStorage.getItem('db_kohhran-chanchin')) {
      localStorage.setItem('db_kohhran-chanchin', JSON.stringify([]));
    }
    // Kohhran Upa
    if (!localStorage.getItem('db_kohhran-upa')) {
      localStorage.setItem('db_kohhran-upa', JSON.stringify([]));
    }
    // Golden Jubilee
    if (!localStorage.getItem('db_golden-jubilee')) {
      localStorage.setItem('db_golden-jubilee', JSON.stringify([]));
    }
    // Statistics
    if (!localStorage.getItem('db_statistics')) {
      localStorage.setItem('db_statistics', JSON.stringify(Statistics));
    }
    // Lyrics
    if (!localStorage.getItem('db_lyrics')) {
      localStorage.setItem('db_lyrics', JSON.stringify([]));
    }
    // Branch Info & Committees
    if (!localStorage.getItem('db_branch-info')) {
      localStorage.setItem('db_branch-info', JSON.stringify([]));
    }
    // Settings (Church info & Social links)
    if (!localStorage.getItem('db_settings')) {
      localStorage.setItem('db_settings', JSON.stringify({
        churchInfo: ChurchInfo,
        socialMedia: SocialMedia
      }));
    }
  },

  get(collection) {
    this.init();
    return JSON.parse(localStorage.getItem(`db_${collection}`)) || [];
  },

  async save(collection, data) {
    localStorage.setItem(`db_${collection}`, JSON.stringify(data));

    // Sync to Firestore if configured
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      if (collection === 'settings') {
        try {
          const snapshot = await FirebaseConfig.db.collection('settings').get();
          if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            await FirebaseConfig.db.collection('settings').doc(docId).set(data);
          } else {
            await FirebaseConfig.db.collection('settings').add(data);
          }
        } catch (err) {
          console.error("Firestore settings sync error:", err);
          throw err;
        }
      }
    }
  },

  async add(collection, item) {
    // Sync to Firestore if configured
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        const firestoreItem = await DbService.add(collection, item);
        const list = this.get(collection);
        list.unshift(firestoreItem);
        localStorage.setItem(`db_${collection}`, JSON.stringify(list));
        return firestoreItem;
      } catch (err) {
        console.error("Firestore sync add error:", err);
        throw err; // Propagate up to form handler
      }
    } else {
      return this.addLocal(collection, item);
    }
  },

  async update(collection, id, updatedFields) {
    // Sync to Firestore if configured
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        await DbService.update(collection, id, updatedFields);
        const list = this.get(collection);
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updatedFields };
          localStorage.setItem(`db_${collection}`, JSON.stringify(list));
        }
        return true;
      } catch (err) {
        console.error("Firestore sync update error:", err);
        throw err; // Propagate up to form handler
      }
    } else {
      return this.updateLocal(collection, id, updatedFields);
    }
  },

  async delete(collection, id) {
    // Sync to Firestore if configured
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        await DbService.delete(collection, id);
        const list = this.get(collection);
        const filtered = list.filter(item => item.id !== id);
        localStorage.setItem(`db_${collection}`, JSON.stringify(filtered));
        return true;
      } catch (err) {
        console.error("Firestore sync delete error:", err);
        throw err; // Propagate up to form handler
      }
    } else {
      return this.deleteLocal(collection, id);
    }
  },

  // Local backups
  addLocal(collection, item) {
    const list = this.get(collection);
    item.id = `${collection.substring(0, 3)}-${Date.now()}`;
    item.date = item.date || new Date().toISOString().split('T')[0];
    list.unshift(item);
    this.save(collection, list);
    return item;
  },

  updateLocal(collection, id, updatedFields) {
    if (collection === 'settings') {
      this.save('settings', updatedFields);
      return true;
    }
    const list = this.get(collection);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      this.save(collection, list);
      return true;
    }
    return false;
  },

  deleteLocal(collection, id) {
    const list = this.get(collection);
    const filtered = list.filter(item => item.id !== id);
    this.save(collection, filtered);
    return true;
  },

  async reorder(collection, newOrderIds) {
    const list = this.get(collection);
    // Create a map for quick lookup
    const idMap = new Map();
    list.forEach(item => idMap.set(item.id, item));

    // Rebuild the array in the new order
    const reorderedList = [];
    newOrderIds.forEach((id, index) => {
      if (idMap.has(id)) {
        const item = idMap.get(id);
        item.orderIndex = index;
        reorderedList.push(item);
        idMap.delete(id);
      }
    });

    // Append any items that were missed (e.g. not in the table during reorder)
    idMap.forEach(item => {
      item.orderIndex = reorderedList.length;
      reorderedList.push(item);
    });

    this.save(collection, reorderedList);

    // Sync to Firestore if configured
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        const batch = FirebaseConfig.db.batch();
        reorderedList.forEach(item => {
          const ref = FirebaseConfig.db.collection(collection).doc(item.id);
          batch.update(ref, { orderIndex: item.orderIndex });
        });
        await batch.commit();
      } catch (err) {
        console.error("Firestore sync reorder error:", err);
      }
    }
  },

  // Sync background Firestore collections
  async syncFirestore() {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        console.log("🔄 Syncing admin databases with Firestore...");
        const [photos, docs, sermons, announcements, lyrics, settings, about, branchObHlui, statistics, news, lawmpuina, sunna] = await Promise.all([
          DbService.get('photos'),
          DbService.get('documents'),
          DbService.get('sermons'),
          DbService.get('announcements'),
          DbService.get('lyrics'),
          DbService.get('settings'),
          DbService.get('about'),
          DbService.get('branch-info'),
          DbService.get('statistics'),
          DbService.get('news'),
          DbService.get('lawmpuina'),
          DbService.get('sunna')
        ]);

        if (Array.isArray(photos)) localStorage.setItem('db_photos', JSON.stringify(photos));
        if (Array.isArray(docs)) localStorage.setItem('db_documents', JSON.stringify(docs));
        if (Array.isArray(sermons)) localStorage.setItem('db_sermons', JSON.stringify(sermons));
        if (Array.isArray(announcements)) localStorage.setItem('db_announcements', JSON.stringify(announcements));
        if (Array.isArray(about)) localStorage.setItem('db_about', JSON.stringify(about));
        if (Array.isArray(lyrics)) localStorage.setItem('db_lyrics', JSON.stringify(lyrics));
        if (Array.isArray(branchObHlui)) localStorage.setItem('db_branch-info', JSON.stringify(branchObHlui));
        if (Array.isArray(statistics)) localStorage.setItem('db_statistics', JSON.stringify(statistics));
        if (Array.isArray(news)) localStorage.setItem('db_news', JSON.stringify(news));
        if (Array.isArray(lawmpuina)) localStorage.setItem('db_lawmpuina', JSON.stringify(lawmpuina));
        if (Array.isArray(sunna)) localStorage.setItem('db_sunna', JSON.stringify(sunna));
        if (settings) localStorage.setItem('db_settings', JSON.stringify(settings));

        console.log("✅ Sync complete!");
        this.refreshPageTable();
      } catch (err) {
        console.error("Firestore sync error:", err);
      }
    }
  },

  refreshPageTable() {
    try {
      const settings = this.get('settings');
      if (settings) {
        if (settings.photoCategories && typeof PhotoCategories !== 'undefined') {
          PhotoCategories.length = 0;
          PhotoCategories.push('All', ...settings.photoCategories.filter(c => c !== 'All'));
        }
        if (settings.documentCategories && typeof DocumentCategories !== 'undefined') {
          DocumentCategories.length = 0;
          DocumentCategories.push('All', ...settings.documentCategories.filter(c => c !== 'All'));
        }
        if (settings.sermonCategories && typeof SermonCategories !== 'undefined') {
          SermonCategories.length = 0;
          SermonCategories.push('All', ...settings.sermonCategories.filter(c => c !== 'All'));
        }
        if (settings.LyricCategories && typeof LyricCategories !== 'undefined') {
          LyricCategories.length = 0;
          LyricCategories.push('All', ...settings.LyricCategories.filter(c => c !== 'All'));
        }
      }

      if (typeof populateCategoryDropdowns === 'function') populateCategoryDropdowns();
      if (typeof renderAnnouncementsTable === 'function') renderAnnouncementsTable();
      if (typeof renderPhotosTable === 'function') renderPhotosTable();
      if (typeof renderDocsTable === 'function') renderDocsTable();
      if (typeof renderSermonsTable === 'function') renderSermonsTable();
      if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (e) {
      console.error("Error refreshing page table:", e);
    }
  }
};

// Immediately check auth on script load
AdminAuth.check();

// ========================
// COMMON ADMIN LAYOUT RENDERER
// ========================
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.endsWith('admin/') || window.location.pathname.endsWith('admin/index.html');
  if (isLoginPage) {
    setupLoginPage();
    return;
  }

  // Initialize DB Data
  AdminData.init();

  // Render Sidebar
  renderSidebar();

  // Setup Sidebar Toggle
  setupSidebarToggle();

  // Run background Firestore sync
  AdminData.syncFirestore();

  // Populate ob-year dropdown if it exists
  const obYearSelect = document.getElementById('ob-year');
  if (obYearSelect && obYearSelect.tagName === 'SELECT') {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 10; y >= 1950; y--) {
      const option = document.createElement('option');
      option.value = y.toString();
      option.textContent = y.toString();
      obYearSelect.appendChild(option);
    }
  }
});

function setupLoginPage() {
  const loginForm = document.getElementById('login-form');
  const errorAlert = document.getElementById('login-error');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('password').value;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⌛ Logging in...';

      try {
        if (pass !== 'saikhamakawn2026') {
          throw new Error("Invalid admin password.");
        }

        // Bridge to Firebase Auth: Automatically login to generic admin account so Firestore Rules work
        const adminEmail = 'admin_v3@ktpsaikhamakawn.org';
        const firebasePassword = 'admin123'; // The actual password configured in Firebase Auth
        let success = false;
        try {
          // Attempt Login
          await AdminAuth.login(adminEmail, firebasePassword);
          success = true;
        } catch (authErr) {
          // Firebase returns 'auth/invalid-credential' instead of 'user-not-found' for new security policies
          if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/user-not-found' || authErr.code === 'auth/too-many-requests' || authErr.message.includes('password') || authErr.message.includes('record')) {
            try {
              const user = await AuthService.register(adminEmail, firebasePassword, 'Admin KṬP');
              // Setup local storage directly since register bypasses AdminAuth.login checks
              localStorage.setItem('ktp_admin_logged_in', 'true');
              localStorage.setItem('ktp_admin_user', JSON.stringify({ name: 'Admin KṬP', role: 'Administrator' }));
              success = true;
            } catch (regErr) {
              console.error("Auto-registration failed:", regErr);
              // Fallback to local-only admin if Firebase completely refuses
              localStorage.setItem('ktp_admin_logged_in', 'true');
              localStorage.setItem('ktp_admin_user', JSON.stringify({ name: 'Admin KṬP (Local Mode)', role: 'Administrator' }));
              success = true;
            }
          } else {
            // Fallback for network errors or other issues
            localStorage.setItem('ktp_admin_logged_in', 'true');
            localStorage.setItem('ktp_admin_user', JSON.stringify({ name: 'Admin KṬP (Offline)', role: 'Administrator' }));
            success = true;
          }
        }

        if (success) {
          window.location.href = 'dashboard.html';
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (errorAlert) {
          errorAlert.classList.add('show');
          errorAlert.querySelector('span:last-child').textContent = err.message || 'Error authenticating.';
        }
      }
    });
  }

  // Set up Google Login button if Firebase is configured
  const googleBtn = document.getElementById('btn-admin-google');
  const googleDivider = document.getElementById('admin-google-divider');
  if (googleBtn && googleDivider) {
    if (FirebaseConfig.isConfigured) {
      googleBtn.style.display = 'flex';
      googleDivider.style.display = 'flex';

      googleBtn.addEventListener('click', async () => {
        const originalText = googleBtn.innerHTML;
        googleBtn.disabled = true;
        googleBtn.innerHTML = '⌛ Connecting...';

        try {
          const success = await AdminAuth.loginWithGoogle();
          if (success) {
            window.location.href = 'dashboard.html';
          }
        } catch (err) {
          googleBtn.disabled = false;
          googleBtn.innerHTML = originalText;
          if (errorAlert) {
            errorAlert.classList.add('show');
            errorAlert.querySelector('span:last-child').textContent = err.message || 'Error authenticating.';
          }
        }
      });
    } else {
      googleBtn.style.display = 'none';
      googleDivider.style.display = 'none';
    }
  }
}

function renderSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  if (!sidebar) return;

  const currentPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const collectionParam = urlParams.get('collection');
  
  const activePage =
    currentPath.endsWith('dashboard.html') ? 'dashboard' :
      currentPath.endsWith('news.html') ? 'news' :
        currentPath.endsWith('lawmpuina.html') ? 'lawmpuina' :
          currentPath.endsWith('sunna.html') ? 'sunna' :
            currentPath.endsWith('kohhran-chanchin.html') ? 'kohhran-chanchin' :
              currentPath.endsWith('kohhran-upa.html') ? 'kohhran-upa' :
                currentPath.endsWith('golden-jubilee.html') ? 'golden-jubilee' :
                  currentPath.endsWith('photos.html') ? 'photos' :
          currentPath.endsWith('documents.html') ? (collectionParam === 'bulletins' ? 'bulletin' : collectionParam === 'souvenirs' ? 'souvenir' : collectionParam === 'mipuiaw' ? 'mipuiaw' : 'documents') :
          currentPath.endsWith('sermons.html') ? 'sermons' :
              currentPath.endsWith('lyrics.html') ? 'lyrics' :
                currentPath.endsWith('branch-info.html') ? 'branch-info' :
                  currentPath.endsWith('about.html') ? 'about' :
                    currentPath.endsWith('announcements.html') ? 'announcements' :
                      currentPath.endsWith('counselling.html') ? 'counselling' :
                        currentPath.endsWith('statistics.html') ? 'statistics' :
                          currentPath.endsWith('settings.html') ? 'settings' : '';

  const user = JSON.parse(localStorage.getItem('ktp_admin_user') || '{"name":"Admin","role":"User"}');

  sidebar.className = 'admin-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="../assets/images/logo.png" alt="Logo">
      <div class="sidebar-header-text">
        KṬP Saikhamakawn
        <small>Control Panel</small>
      </div>
    </div>
    <div class="sidebar-nav">
      <div class="sidebar-label">Navigation</div>
      <a href="dashboard.html" class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}">
        <span class="link-icon">📊</span> Dashboard
      </a>
      <a href="news.html" class="sidebar-link ${activePage === 'news' ? 'active' : ''}">
        <span class="link-icon">📰</span> News
      </a>
      <a href="lawmpuina.html" class="sidebar-link ${activePage === 'lawmpuina' ? 'active' : ''}">
        <span class="link-icon">🎉</span> Lawmpuina
      </a>
      <a href="sunna.html" class="sidebar-link ${activePage === 'sunna' ? 'active' : ''}">
        <span class="link-icon">🕯️</span> Sunna
      </a>
      <a href="kohhran-chanchin.html" class="sidebar-link ${activePage === 'kohhran-chanchin' ? 'active' : ''}">
        <span class="link-icon">📜</span> Kohhran Chanchin
      </a>
      <a href="kohhran-upa.html" class="sidebar-link ${activePage === 'kohhran-upa' ? 'active' : ''}">
        <span class="link-icon">👨🏽‍🦳</span> Kohhran Upa
      </a>
      <a href="golden-jubilee.html" class="sidebar-link ${activePage === 'golden-jubilee' ? 'active' : ''}">
        <span class="link-icon">🌟</span> Golden Jubilee
      </a>
      <a href="photos.html" class="sidebar-link ${activePage === 'photos' ? 'active' : ''}">
        <span class="link-icon">📸</span> Photos Gallery
      </a>
      <a href="documents.html?collection=mipuiaw&title=Mipui%20Aw" class="sidebar-link ${activePage === 'mipuiaw' ? 'active' : ''}">
        <span class="link-icon">📄</span> Mipui Aw
      </a>
      <a href="documents.html?collection=bulletins&title=Bulletin" class="sidebar-link ${activePage === 'bulletin' ? 'active' : ''}">
        <span class="link-icon">📰</span> Bulletin
      </a>
      <a href="documents.html?collection=souvenirs&title=Souvenir" class="sidebar-link ${activePage === 'souvenir' ? 'active' : ''}">
        <span class="link-icon">📘</span> Souvenir
      </a>
      <a href="sermons.html" class="sidebar-link ${activePage === 'sermons' ? 'active' : ''}">
        <span class="link-icon">📖</span> Sermons & Study
      </a>
      <a href="lyrics.html" class="sidebar-link ${activePage === 'lyrics' ? 'active' : ''}">
        <span class="link-icon">🎵</span> Hla Lyrics
      </a>
      <a href="announcements.html" class="sidebar-link ${activePage === 'announcements' ? 'active' : ''}">
        <span class="link-icon">📢</span> Announcements
      </a>
      <a href="about.html" class="sidebar-link ${activePage === 'about' ? 'active' : ''}">
        <span class="link-icon">📖</span> About Us
      </a>
      <a href="counselling.html" class="sidebar-link ${activePage === 'counselling' ? 'active' : ''}">
        <span class="link-icon">💬</span> Counselling Q&A
      </a>
      <a href="statistics.html" class="sidebar-link ${activePage === 'statistics' ? 'active' : ''}">
        <span class="link-icon">📊</span> Statistics
      </a>
      <a href="branch-info.html" class="sidebar-link ${activePage === 'branch-info' ? 'active' : ''}">
        <span class="link-icon">👨‍💼</span> Branch Info & Committees
      </a>
      <a href="settings.html" class="sidebar-link ${activePage === 'settings' ? 'active' : ''}">
        <span class="link-icon">⚙️</span> Site Settings
      </a>
      
      <div class="sidebar-label" style="margin-top: 15px;">Actions</div>
      <a href="../index.html" class="sidebar-link" target="_blank">
        <span class="link-icon">🌐</span> View Website
      </a>
    </div>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">${user.name.charAt(0)}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user.name}</div>
          <div class="sidebar-user-role">${user.role}</div>
        </div>
        <button id="logout-btn" style="background:transparent; border:none; cursor:pointer; font-size:16px;" title="Logout">🚪</button>
      </div>
    </div>
  `;

  // Attach logout handler
  document.getElementById('logout-btn').addEventListener('click', () => {
    AdminAuth.logout();
  });
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');

  if (toggleBtn && sidebar) {
    // Create overlay if it doesn't exist
    let overlay = document.querySelector('.admin-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'admin-overlay';
      document.body.appendChild(overlay);
    }

    const openSidebar = () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    };

    toggleBtn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);
  }
}

// Reusable toast notification for admin
const AdminToast = {
  show(message, type = 'success') {
    // Check if components.js Toast is loaded
    if (typeof Toast !== 'undefined' && Toast.show) {
      Toast.show(message, type);
    } else {
      alert(`${type.toUpperCase()}: ${message}`);
    }
  }
};
