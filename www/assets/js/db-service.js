/* ============================================
   KṬP Saikhamakawn — Unified Database Service
   Wraps Firestore queries & updates
   Falls back to localStorage DB when offline.
   ============================================ */

const DbService = {
  /**
   * Fetch all records in a collection
   */
  /**
   * Helper to wrap a promise with a timeout
   */
  _withTimeout(promise, ms, errorMsg = 'Timeout') {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
      promise.then(
        res => { clearTimeout(timer); resolve(res); },
        err => { clearTimeout(timer); reject(err); }
      );
    });
  },

  /**
   * Fetch all records in a collection
   */
  async get(collection) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        const snapshot = await this._withTimeout(
          FirebaseConfig.db.collection(collection).get(),
          60000,
          `Firestore read timeout for ${collection}`
        );
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });

        // Ensure returned items are ordered by orderIndex (fallback to newest createdAt/date)
        items.sort((a, b) => {
          const aIdx = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
          const bIdx = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
          if (aIdx !== bIdx) return aIdx - bIdx;
          
          const aTime = a.createdAt || a.date || 0;
          const bTime = b.createdAt || b.date || 0;
          return new Date(bTime) - new Date(aTime);
        });
        
        // Dynamic settings mapping
        if (collection === 'settings' && items.length > 0) {
          // Cache settings to localStorage
          try { localStorage.setItem(`db_${collection}`, JSON.stringify(items[0])); } catch(e) {}
          return items[0]; // settings is a single doc
        }
        
        // Cache fetched data to localStorage for faster next load
        try { localStorage.setItem(`db_${collection}`, JSON.stringify(items)); } catch(e) {}
        
        return items;
      } catch (error) {
        console.warn(`Firebase error reading ${collection} (falling back to local):`, error.message);
        // Fall back to local storage if Firestore fails or times out
        return this.getLocal(collection);
      }
    } else {
      return this.getLocal(collection);
    }
  },

  /**
   * Fetch records matching a specific condition
   */
  async getWhere(collection, field, operator, value) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        const snapshot = await this._withTimeout(
          FirebaseConfig.db.collection(collection).where(field, operator, value).get(),
          60000,
          `Firestore read timeout for ${collection} where ${field} ${operator} ${value}`
        );
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });

        items.sort((a, b) => {
          const aTime = a.createdAt || a.date || 0;
          const bTime = b.createdAt || b.date || 0;
          return new Date(bTime) - new Date(aTime);
        });
        
        return items;
      } catch (error) {
        console.warn(`Firebase error reading ${collection} (falling back to local filter):`, error.message);
        const allItems = this.getLocal(collection);
        if (operator === '==') {
          return allItems.filter(item => item[field] === value);
        }
        return allItems;
      }
    } else {
      const allItems = this.getLocal(collection);
      if (operator === '==') {
        return allItems.filter(item => item[field] === value);
      }
      return allItems;
    }
  },

  /**
   * Add a new record to a collection
   */
  async add(collection, item) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        // Prepare document fields
        item.createdAt = new Date().toISOString();
        item.date = item.date || new Date().toISOString().split('T')[0];

        const docRef = await FirebaseConfig.db.collection(collection).add(item);
        const savedItem = { id: docRef.id, ...item };
        
        // Also update localStorage cache so next page load has fresh data
        try {
          const cached = JSON.parse(localStorage.getItem(`db_${collection}`) || '[]');
          if (Array.isArray(cached)) {
            cached.unshift(savedItem);
            localStorage.setItem(`db_${collection}`, JSON.stringify(cached));
          }
        } catch(e) {}
        
        return savedItem;
      } catch (error) {
        console.error(`Firebase error adding to ${collection}:`, error);
        throw error; // Throw so caller handles it
      }
    } else {
      return this.addLocal(collection, item);
    }
  },

  /**
   * Update an existing record
   */
  async update(collection, id, updatedFields) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        updatedFields.updatedAt = new Date().toISOString();
        await FirebaseConfig.db.collection(collection).doc(id).update(updatedFields);
        
        // Also update localStorage cache
        try {
          const cached = JSON.parse(localStorage.getItem(`db_${collection}`) || '[]');
          if (Array.isArray(cached)) {
            const idx = cached.findIndex(item => item.id === id);
            if (idx !== -1) {
              cached[idx] = { ...cached[idx], ...updatedFields };
              localStorage.setItem(`db_${collection}`, JSON.stringify(cached));
            }
          }
        } catch(e) {}
        
        return true;
      } catch (error) {
        console.error(`Firebase error updating ${collection}/${id}:`, error);
        throw error; // Throw so caller handles it
      }
    } else {
      return this.updateLocal(collection, id, updatedFields);
    }
  },

  /**
   * Delete a record
   */
  async delete(collection, id) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        await FirebaseConfig.db.collection(collection).doc(id).delete();
        return true;
      } catch (error) {
        console.error(`Firebase error deleting ${collection}/${id}:`, error);
        throw error; // Throw so caller handles it
      }
    } else {
      return this.deleteLocal(collection, id);
    }
  },

  // ========================
  // LOCALSTORAGE BACKUP CRUD METHODS
  // ========================
  getLocal(collection) {
    // Rely on data.js initialization or trigger init
    const key = `db_${collection}`;
    if (!localStorage.getItem(key)) {
      // Lazy init matching data.js
      if (collection === 'photos') localStorage.setItem(key, JSON.stringify(Photos));
      else if (collection === 'documents') localStorage.setItem(key, JSON.stringify(Documents));
      else if (collection === 'sermons') localStorage.setItem(key, JSON.stringify(Sermons));
      else if (collection === 'posts') localStorage.setItem(key, JSON.stringify(Posts));
      else if (collection === 'mipuiaw') localStorage.setItem(key, JSON.stringify(MipuiAw));
      else if (collection === 'announcements') localStorage.setItem(key, JSON.stringify(Announcements));
      else if (collection === 'lyrics') localStorage.setItem(key, JSON.stringify([]));
      else if (collection === 'settings') {
        localStorage.setItem(key, JSON.stringify({
          churchInfo: ChurchInfo,
          socialMedia: SocialMedia
        }));
      } else {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
    return JSON.parse(localStorage.getItem(key)) || [];
  },

  addLocal(collection, item) {
    const list = this.getLocal(collection);
    item.id = `${collection.substring(0, 3)}-${Date.now()}`;
    item.date = item.date || new Date().toISOString().split('T')[0];
    list.unshift(item);
    localStorage.setItem(`db_${collection}`, JSON.stringify(list));
    return item;
  },

  updateLocal(collection, id, updatedFields) {
    if (collection === 'settings') {
      localStorage.setItem('db_settings', JSON.stringify(updatedFields));
      return true;
    }
    const list = this.getLocal(collection);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      localStorage.setItem(`db_${collection}`, JSON.stringify(list));
      return true;
    }
    return false;
  },

  deleteLocal(collection, id) {
    const list = this.getLocal(collection);
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(`db_${collection}`, JSON.stringify(filtered));
    return true;
  },

  /**
   * Fetch files from a Google Drive folder URL
   * Requires googleDriveApiKey to be set in firebase-config.js
   */
  async fetchFromDriveFolder(folderUrl) {
    if (typeof googleDriveApiKey === 'undefined' || !googleDriveApiKey) {
      throw new Error('Google Drive API Key is not configured.');
    }

    // Extract folder ID from URL
    let folderId = '';
    const idMatch = folderUrl.match(/[\/?&]id=([^&#]+)/);
    const foldersMatch = folderUrl.match(/\/folders\/([^\/?&#]+)/);
    if (idMatch && idMatch[1]) folderId = idMatch[1];
    else if (foldersMatch && foldersMatch[1]) folderId = foldersMatch[1];
    else folderId = folderUrl.trim(); // Assume it might just be the ID

    if (!folderId) {
      throw new Error('Invalid Google Drive folder URL.');
    }

    try {
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name)&key=${googleDriveApiKey}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
         throw new Error(`Google Drive API error: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Process files
      const files = (data.files || []).map(file => {
        // Strip .pdf from name
        const cleanName = file.name.replace(/\.pdf$/i, '').trim();
        // Generate direct view/download URL
        const downloadUrl = `https://drive.google.com/file/d/${file.id}/view?usp=sharing`;
        
        return {
          title: cleanName,
          downloadUrl: downloadUrl,
          date: new Date().toISOString().split('T')[0]
        };
      });
      
      return files;
    } catch (error) {
      console.error('Error fetching from Drive folder:', error);
      throw error;
    }
  }
};
