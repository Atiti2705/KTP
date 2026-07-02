/* ============================================
   KṬP Saikhamakawn — Unified Authentication Service
   Supports Email/Password & Google Sign-In
   Uses Firebase Auth when configured, falls back
   to localStorage sessions during offline/mock dev.
   ============================================ */

const AuthService = {
  // Key name for local session storage
  USER_SESSION_KEY: 'ktp_active_user',
  LOCAL_USERS_KEY: 'db_auth_users',
  
  // Default mock admin credentials
  DEFAULT_ADMIN: {
    email: 'admin@ktpsaikhamakawn.org',
    displayName: 'Admin KṬP',
    role: 'admin',
    provider: 'email'
  },

  init() {
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(this.LOCAL_USERS_KEY)) {
        // Initialize mock users database with default admin
        localStorage.setItem(this.LOCAL_USERS_KEY, JSON.stringify([
          {
            email: 'admin@ktpsaikhamakawn.org',
            password: 'admin123',
            displayName: 'Admin KṬP',
            role: 'admin'
          },
          {
            email: 'member@ktpsaikhamakawn.org',
            password: 'member123',
            displayName: 'Lalremruata',
            role: 'member'
          }
        ]));
      }
    }
  },

  /**
   * Register a new user
   */
  async register(email, password, displayName) {
    this.init();
    email = email.toLowerCase().trim();

    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      try {
        const userCredential = await FirebaseConfig.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await user.updateProfile({ displayName: displayName });
        
        // Save user role in Firestore
        const role = this.determineRole(email);
        await FirebaseConfig.db.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: email,
          displayName: displayName,
          role: role,
          createdAt: new Date().toISOString()
        });

        return { email, displayName, role, uid: user.uid, photoURL: user.photoURL };
      } catch (error) {
        console.error("Firebase Registration Error:", error);
        throw error;
      }
    } else {
      // LocalStorage fallback
      const users = JSON.parse(localStorage.getItem(this.LOCAL_USERS_KEY));
      if (users.some(u => u.email === email)) {
        throw new Error("Email address already registered.");
      }

      const role = this.determineRole(email);
      const newUser = {
        email,
        password, // stored plain-text ONLY for client-side local mockup
        displayName,
        role,
        uid: `user-${Date.now()}`
      };
      
      users.push(newUser);
      localStorage.setItem(this.LOCAL_USERS_KEY, JSON.stringify(users));

      const sessionUser = { email, displayName, role, uid: newUser.uid, photoURL: null };
      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionUser));
      this.triggerAuthStateChange(sessionUser);

      return sessionUser;
    }
  },

  /**
   * Log in with Email & Password
   */
  async login(email, password) {
    this.init();
    email = email.toLowerCase().trim();

    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      try {
        const userCredential = await FirebaseConfig.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Fetch role from Firestore
        const userDoc = await FirebaseConfig.db.collection('users').doc(user.uid).get();
        let role = 'member';
        if (userDoc.exists) {
          role = userDoc.data().role || 'member';
        } else {
          // If no doc exists (fallback check)
          role = this.determineRole(email);
          await FirebaseConfig.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: user.displayName || 'User',
            role: role,
            createdAt: new Date().toISOString()
          });
        }

        return { email, displayName: user.displayName || 'User', role, uid: user.uid, photoURL: user.photoURL };
      } catch (error) {
        console.error("Firebase Login Error:", error);
        throw error;
      }
    } else {
      // LocalStorage fallback
      const users = JSON.parse(localStorage.getItem(this.LOCAL_USERS_KEY));
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error("Invalid email or password.");
      }

      const sessionUser = {
        email: foundUser.email,
        displayName: foundUser.displayName,
        role: foundUser.role,
        uid: foundUser.uid,
        photoURL: foundUser.photoURL || null
      };

      // Set admin compatibility key
      if (foundUser.role === 'admin') {
        localStorage.setItem('ktp_admin_logged_in', 'true');
        localStorage.setItem('ktp_admin_user', JSON.stringify({ name: foundUser.displayName, role: 'Administrator' }));
      }

      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionUser));
      this.triggerAuthStateChange(sessionUser);

      return sessionUser;
    }
  },

  /**
   * Log in using Google Sign-In
   */
  async loginWithGoogle() {
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await FirebaseConfig.auth.signInWithPopup(provider);
        const user = result.user;
        const email = user.email;

        // Check/create user document in Firestore to fetch role
        const userDoc = await FirebaseConfig.db.collection('users').doc(user.uid).get();
        let role = 'member';
        if (userDoc.exists) {
          role = userDoc.data().role || 'member';
        } else {
          role = this.determineRole(email);
          await FirebaseConfig.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: user.displayName || 'Google User',
            role: role,
            createdAt: new Date().toISOString()
          });
        }

        return { email, displayName: user.displayName || 'Google User', role, uid: user.uid, photoURL: user.photoURL };
      } catch (error) {
        console.error("Firebase Google Auth Error:", error);
        throw error;
      }
    } else {
      // LocalStorage mock Google Sign-in
      const mockGoogleUser = {
        email: 'google.guest@gmail.com',
        displayName: 'Google Guest',
        role: 'member',
        uid: 'guser-123456789'
      };

      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(mockGoogleUser));
      this.triggerAuthStateChange(mockGoogleUser);
      return mockGoogleUser;
    }
  },

  /**
   * Log out active user
   */
  async logout() {
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      try {
        await FirebaseConfig.auth.signOut();
        // Redirect if on admin page
        if (window.location.pathname.includes('/admin/')) {
          window.location.href = '../index.html';
        }
      } catch (error) {
        console.error("Firebase Sign-Out Error:", error);
        throw error;
      }
    } else {
      localStorage.removeItem(this.USER_SESSION_KEY);
      localStorage.removeItem('ktp_admin_logged_in');
      localStorage.removeItem('ktp_admin_user');
      this.triggerAuthStateChange(null);
      
      if (window.location.pathname.includes('/admin/')) {
        window.location.href = '../index.html';
      }
    }
  },

  /**
   * Get active logged in user
   */
  getCurrentUser() {
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      const user = FirebaseConfig.auth.currentUser;
      if (!user) return null;
      
      // Attempt to load role from dynamic cache or localStorage role mapping
      // Firebase doesn't load firestore role synchronously, so we fall back to email domain checks
      // for instant UI rendering, or localStorage cache
      const cached = localStorage.getItem(this.USER_SESSION_KEY);
      let role = this.determineRole(user.email);
      let savedItems = [];
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.uid === user.uid) {
          role = parsed.role || role;
          savedItems = parsed.savedItems || [];
        }
      }

      return {
        email: user.email,
        displayName: user.displayName || 'Firebase User',
        role: role,
        uid: user.uid,
        photoURL: user.photoURL,
        savedItems: savedItems
      };
    } else {
      const stored = localStorage.getItem(this.USER_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    }
  },

  /**
   * Listen to Auth State changes (Firebase / LocalStorage events)
   */
  onAuthStateChanged(callback) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      FirebaseConfig.auth.onAuthStateChanged(async (user) => {
        if (user) {
          // Sync role and displayName
          const userDoc = await FirebaseConfig.db.collection('users').doc(user.uid).get();
          let role = this.determineRole(user.email);
          let savedItems = [];
          if (userDoc.exists) {
            const data = userDoc.data();
            role = data.role || 'member';
            savedItems = data.savedItems || [];
          }
          
          const sessionUser = {
            email: user.email,
            displayName: user.displayName || 'User',
            role: role,
            uid: user.uid,
            photoURL: user.photoURL,
            savedItems: savedItems
          };
          localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionUser));
          
          // Add admin compatibility check
          if (role === 'admin') {
            localStorage.setItem('ktp_admin_logged_in', 'true');
            localStorage.setItem('ktp_admin_user', JSON.stringify({ name: sessionUser.displayName, role: 'Administrator' }));
          }

          callback(sessionUser);
        } else {
          localStorage.removeItem(this.USER_SESSION_KEY);
          localStorage.removeItem('ktp_admin_logged_in');
          localStorage.removeItem('ktp_admin_user');
          callback(null);
        }
      });
    } else {
      // LocalStorage state monitoring
      // Call immediately with current local user
      const user = this.getCurrentUser();
      callback(user);

      // Register callbacks locally
      if (!window._ktp_auth_callbacks) {
        window._ktp_auth_callbacks = [];
      }
      window._ktp_auth_callbacks.push(callback);
    }
  },

  // Helper: trigger callbacks in offline mode
  triggerAuthStateChange(user) {
    if (window._ktp_auth_callbacks) {
      window._ktp_auth_callbacks.forEach(cb => {
        try { cb(user); } catch (e) {}
      });
    }
  },

  // Helper: determine role from email domain or specific address
  determineRole(email) {
    email = email.toLowerCase().trim();
    // Allow ending with ktpsaikhamakawn.org or specific admins
    if (email.endsWith('@ktpsaikhamakawn.org') || 
        email === 'admin@ktpsaikhamakawn.org' || 
        email === 'ktpskk1975@gmail.com' || 
        email === 'papuiarenthlei365@gmail.com') {
      return 'admin';
    }
    return 'member'; // general user
  }
};

// Auto-run local database init
AuthService.init();
