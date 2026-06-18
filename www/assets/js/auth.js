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
  async register(email, password, displayName, username = '') {
    this.init();
    email = email.toLowerCase().trim();
    if (username) {
      username = username.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    }

    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      try {
        const userCredential = await FirebaseConfig.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await user.updateProfile({ displayName: displayName });
        
        // Save user role and username in Firestore
        const role = this.determineRole(email);
        await FirebaseConfig.db.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: email,
          displayName: displayName,
          username: username,
          role: role,
          createdAt: new Date().toISOString()
        });

        return { email, displayName, username, role, uid: user.uid, photoURL: user.photoURL };
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
        username,
        role,
        uid: `user-${Date.now()}`
      };
      
      users.push(newUser);
      localStorage.setItem(this.LOCAL_USERS_KEY, JSON.stringify(users));

      const sessionUser = { email, displayName, username, role, uid: newUser.uid, photoURL: null };
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
        
        // Fetch role and username from Firestore
        const userDoc = await FirebaseConfig.db.collection('users').doc(user.uid).get();
        let role = 'member';
        let username = '';
        if (userDoc.exists) {
          role = userDoc.data().role || 'member';
          username = userDoc.data().username || '';
        } else {
          // If no doc exists (fallback check)
          role = this.determineRole(email);
          await FirebaseConfig.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: user.displayName || 'User',
            username: username,
            role: role,
            createdAt: new Date().toISOString()
          });
        }

        return { email, displayName: user.displayName || 'User', username, role, uid: user.uid, photoURL: user.photoURL };
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
        username: foundUser.username || '',
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
        let user;
        let email;
        
        // Use Native Google Sign-In if running in Android app
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          const result = await window.Capacitor.Plugins.FirebaseAuthentication.signInWithGoogle();
          const idToken = result.credential?.idToken;
          
          // Pass token to Firebase JS SDK so auth state is kept
          const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
          const userCredential = await FirebaseConfig.auth.signInWithCredential(credential);
          user = userCredential.user;
          email = user.email;
        } else {
          // Standard Web Google Sign-In
          const provider = new firebase.auth.GoogleAuthProvider();
          const result = await FirebaseConfig.auth.signInWithPopup(provider);
          user = result.user;
          email = user.email;
        }

        // Check/create user document in Firestore to fetch role and username
        const userDoc = await FirebaseConfig.db.collection('users').doc(user.uid).get();
        let role = 'member';
        let username = '';
        if (userDoc.exists) {
          role = userDoc.data().role || 'member';
          username = userDoc.data().username || '';
        } else {
          role = this.determineRole(email);
          await FirebaseConfig.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: user.displayName || 'Google User',
            username: username,
            role: role,
            createdAt: new Date().toISOString()
          });
        }

        return { email, displayName: user.displayName || 'Google User', username, role, uid: user.uid, photoURL: user.photoURL };
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

  get currentUser() {
    return this.getCurrentUser();
  },

  /**
   * Get active logged in user
   */
  getCurrentUser() {
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      const user = FirebaseConfig.auth.currentUser;
      if (!user) {
        // Firebase Auth may not have initialized yet — fall back to cached session
        const cached = localStorage.getItem(this.USER_SESSION_KEY);
        if (cached) {
          try { return JSON.parse(cached); } catch(e) {}
        }
        return null;
      }
      
      // Attempt to load role from dynamic cache or localStorage role mapping
      // Firebase doesn't load firestore role synchronously, so we fall back to email domain checks
      // for instant UI rendering, or localStorage cache
      const cached = localStorage.getItem(this.USER_SESSION_KEY);
      let role = this.determineRole(user.email);
      let username = '';
      let savedItems = [];
      let photoBase64 = null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.uid === user.uid) {
          role = parsed.role || role;
          username = parsed.username || '';
          savedItems = parsed.savedItems || [];
          photoBase64 = parsed.photoBase64 || null;
        }
      }

      return {
        email: user.email,
        displayName: user.displayName || 'Firebase User',
        username: username,
        role: role,
        uid: user.uid,
        photoURL: user.photoURL,
        photoBase64: photoBase64,
        savedItems: savedItems
      };
    } else {
      const stored = localStorage.getItem(this.USER_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    }
  },

  /**
   * Update Profile Data
   */
  async updateProfileData(displayName, username, base64Image) {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("No active user session.");
    }
    
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      const user = FirebaseConfig.auth.currentUser;
      
      try {
        // 1. Update Firebase Auth Profile (Display Name only, we can't use base64 in photoURL due to size limits)
        await user.updateProfile({ 
          displayName: displayName
        });
        
        // 2. Update Firestore Document with base64Image
        const updateData = {
          displayName: displayName,
          username: username,
          updatedAt: new Date().toISOString()
        };
        
        if (base64Image) {
          updateData.photoBase64 = base64Image;
        }

        await FirebaseConfig.db.collection('users').doc(user.uid).update(updateData);

        // 3. Update Local Session Storage
        const sessionUser = {
          ...currentUser,
          displayName,
          username
        };
        if (base64Image) {
          sessionUser.photoBase64 = base64Image;
        }
        
        localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionUser));
        
        return sessionUser;
      } catch (err) {
        console.error("Error updating profile:", err);
        throw new Error("Failed to update profile data.");
      }
    } else {
      // LocalStorage Mock Update
      const stored = JSON.parse(localStorage.getItem(this.USER_SESSION_KEY));
      const sessionUser = {
        ...stored,
        displayName,
        username
      };
      if (base64Image) {
        sessionUser.photoBase64 = base64Image;
      }
      
      // Update users array
      const users = JSON.parse(localStorage.getItem(this.LOCAL_USERS_KEY)) || [];
      const index = users.findIndex(u => u.email === sessionUser.email);
      if (index !== -1) {
        users[index] = { ...users[index], displayName, username, ...(base64Image && {photoBase64: base64Image}) };
        localStorage.setItem(this.LOCAL_USERS_KEY, JSON.stringify(users));
      }
      
      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
  },

  /**
   * Listen to Auth State changes (Firebase / LocalStorage events)
   */
  onAuthStateChanged(callback) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.auth) {
      FirebaseConfig.auth.onAuthStateChanged(async (user) => {
        if (user) {
          // Sync role, username and displayName
          const userDoc = await FirebaseConfig.db.collection('users').doc(user.uid).get();
          let role = this.determineRole(user.email);
          let username = '';
          let savedItems = [];
          let displayName = user.displayName;
          let photoBase64 = null;
          
          if (userDoc.exists) {
            const data = userDoc.data();
            role = data.role || 'member';
            username = data.username || '';
            savedItems = data.savedItems || [];
            photoBase64 = data.photoBase64 || null;
            if (!displayName && data.displayName) {
              displayName = data.displayName;
            }
          }
          
          const sessionUser = {
            email: user.email,
            displayName: displayName || 'User',
            username: username,
            role: role,
            uid: user.uid,
            photoURL: user.photoURL,
            photoBase64: photoBase64,
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
        email === 'ktp.saikhamakawn@gmail.com' || 
        email === 'papuiarenthlei365@gmail.com') {
      return 'admin';
    }
    return 'member'; // general user
  }
};

// Auto-run local database init
AuthService.init();
