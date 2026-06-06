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
        // Query Firestore with a 2-second timeout fallback
        const snapshot = await this._withTimeout(
          FirebaseConfig.db.collection(collection).get(),
          2000,
          `Firestore read timeout for ${collection}`
        );
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        
        // Dynamic settings mapping
        if (collection === 'settings' && items.length > 0) {
          return items[0]; // settings is a single doc
        }
        
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
   * Add a new record to a collection
   */
  async add(collection, item) {
    if (FirebaseConfig.isConfigured && FirebaseConfig.db) {
      try {
        // Prepare document fields
        item.createdAt = new Date().toISOString();
        item.date = item.date || new Date().toISOString().split('T')[0];

        const docRef = await FirebaseConfig.db.collection(collection).add(item);
        return { id: docRef.id, ...item };
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
      else if (collection === 'announcements') localStorage.setItem(key, JSON.stringify(Announcements));
      else if (collection === 'settings') {
        localStorage.setItem(key, JSON.stringify({
          churchInfo: ChurchInfo,
          socialMedia: SocialMedia
        }));
      }
    }
    return JSON.parse(localStorage.getItem(key));
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
  }
};
