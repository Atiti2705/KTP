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
    return JSON.parse(localStorage.getItem(`db_${collection}`));
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

  // Sync background Firestore collections
  async syncFirestore() {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        console.log("🔄 Syncing admin databases with Firestore...");
        const [photos, docs, sermons, announcements, settings] = await Promise.all([
          DbService.get('photos'),
          DbService.get('documents'),
          DbService.get('sermons'),
          DbService.get('announcements'),
          DbService.get('settings')
        ]);

        if (Array.isArray(photos)) localStorage.setItem('db_photos', JSON.stringify(photos));
        if (Array.isArray(docs)) localStorage.setItem('db_documents', JSON.stringify(docs));
        if (Array.isArray(sermons)) localStorage.setItem('db_sermons', JSON.stringify(sermons));
        if (Array.isArray(announcements)) localStorage.setItem('db_announcements', JSON.stringify(announcements));
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
});

function setupLoginPage() {
  const loginForm = document.getElementById('login-form');
  const errorAlert = document.getElementById('login-error');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('username').value;
      const pass = document.getElementById('password').value;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⌛ Logging in...';

      try {
        const success = await AdminAuth.login(user, pass);
        if (success) {
          window.location.href = 'dashboard.html';
        } else {
          throw new Error("Invalid username or password.");
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
  const activePage =
    currentPath.endsWith('dashboard.html') ? 'dashboard' :
      currentPath.endsWith('photos.html') ? 'photos' :
        currentPath.endsWith('documents.html') ? 'documents' :
          currentPath.endsWith('sermons.html') ? 'sermons' :
            currentPath.endsWith('announcements.html') ? 'announcements' :
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
      <a href="photos.html" class="sidebar-link ${activePage === 'photos' ? 'active' : ''}">
        <span class="link-icon">📸</span> Photos Gallery
      </a>
      <a href="documents.html" class="sidebar-link ${activePage === 'documents' ? 'active' : ''}">
        <span class="link-icon">📄</span> Mipui Aw (Docs)
      </a>
      <a href="sermons.html" class="sidebar-link ${activePage === 'sermons' ? 'active' : ''}">
        <span class="link-icon">📖</span> Sermons & Study
      </a>
      <a href="announcements.html" class="sidebar-link ${activePage === 'announcements' ? 'active' : ''}">
        <span class="link-icon">📢</span> Announcements
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
