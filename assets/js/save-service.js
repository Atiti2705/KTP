/* ============================================
   KṬP Saikhamakawn — Save Service
   Handles saving items (bookmarking) across 
   all collections (lyrics, sermons, etc).
   ============================================ */

const SaveService = {
  
  _cachedSavedItems: null,

  /**
   * Helper to get the saved items array from the current user
   */
  getSavedItems() {
    if (this._cachedSavedItems !== null) {
      return this._cachedSavedItems;
    }
    const user = AuthService.getCurrentUser();
    if (!user) {
      this._cachedSavedItems = [];
      return this._cachedSavedItems;
    }
    this._cachedSavedItems = user.savedItems || [];
    return this._cachedSavedItems;
  },

  clearCache() {
    this._cachedSavedItems = null;
  },

  /**
   * Check if a specific document is saved
   * @param {string} collection - The collection name (e.g. 'lyrics', 'sermons')
   * @param {string} id - The document ID
   * @returns {boolean}
   */
  isSaved(collection, id) {
    const savedItems = this.getSavedItems();
    const saveKey = `${collection}:${id}`;
    return savedItems.includes(saveKey);
  },

  /**
   * Explicitly save an item (for backwards compatibility with existing code)
   */
  async saveItem(collection, id, data) {
    if (this.isSaved(collection, id)) return true;
    return await this.toggleSave(collection, id);
  },

  /**
   * Explicitly unsave an item (for backwards compatibility)
   */
  async unsaveItem(collection, id) {
    if (!this.isSaved(collection, id)) return false;
    await this.toggleSave(collection, id);
    return false;
  },

  /**
   * Toggle the save state of a document
   * @param {string} collection - The collection name
   * @param {string} id - The document ID
   * @returns {Promise<boolean>} True if it is now saved, false if removed
   */
  async toggleSave(collection, id) {
    const user = AuthService.getCurrentUser();
    if (!user) {
      ModalSystem.open('auth-modal');
      throw new Error('User not logged in');
    }

    const saveKey = `${collection}:${id}`;
    let savedItems = [...this.getSavedItems()];
    const isCurrentlySaved = savedItems.includes(saveKey);
    let newSavedState = false;

    if (isCurrentlySaved) {
      // Remove it
      savedItems = savedItems.filter(item => item !== saveKey);
      newSavedState = false;
    } else {
      // Add it
      savedItems.push(saveKey);
      newSavedState = true;
    }

    // Update Local Session Optimistically
    user.savedItems = savedItems;
    localStorage.setItem(AuthService.USER_SESSION_KEY, JSON.stringify(user));
    
    // Clear local cache so UI reads fresh state
    this.clearCache();
    
    // Trigger any auth state listeners to update UI
    AuthService.triggerAuthStateChange(user);

    // Update Firestore if configured
    if (FirebaseConfig.isConfigured && FirebaseConfig.db && FirebaseConfig.auth.currentUser) {
      try {
        await FirebaseConfig.db.collection('users').doc(user.uid).update({
          savedItems: savedItems
        });
      } catch (error) {
        console.error("Firebase error updating saved items:", error);
        // Rollback local change on error (optional, but good practice)
        if (isCurrentlySaved) {
            user.savedItems.push(saveKey); // put back
        } else {
            user.savedItems = user.savedItems.filter(item => item !== saveKey); // remove again
        }
        localStorage.setItem(AuthService.USER_SESSION_KEY, JSON.stringify(user));
        this.clearCache();
        AuthService.triggerAuthStateChange(user);
        throw error;
      }
    } else {
        // Mock offline fallback - update local db_auth_users
        const localUsers = JSON.parse(localStorage.getItem(AuthService.LOCAL_USERS_KEY) || '[]');
        const userIndex = localUsers.findIndex(u => u.uid === user.uid);
        if (userIndex !== -1) {
            localUsers[userIndex].savedItems = savedItems;
            localStorage.setItem(AuthService.LOCAL_USERS_KEY, JSON.stringify(localUsers));
        }
    }

    return newSavedState;
  }
};

window.handleSaveToggle = async function(event, collection, id) {
  event.stopPropagation(); // Prevent opening the document
  event.preventDefault();

  const SVG_UNSAVED = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
  const SVG_SAVED = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

  try {
    const isSaved = await SaveService.toggleSave(collection, id);
    const btn = event.currentTarget;
    if (isSaved) {
      btn.innerHTML = SVG_SAVED;
      btn.title = 'Remove from Saved';
    } else {
      btn.innerHTML = SVG_UNSAVED;
      btn.title = 'Save Item';
    }
    Toast.show(isSaved ? 'Item saved!' : 'Item removed from saved.', 'success');
  } catch (err) {
    console.error("Save toggle error:", err);
  }
};
