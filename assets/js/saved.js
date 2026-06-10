/* ============================================
   KṬP Saikhamakawn — Saved Items Page Logic
   Handles filtering saved items by category tabs,
   rendering document lists and photo grids,
   bulk zipping/downloading, and preview modals.
   ============================================ */

let currentTab = 'all';
let allSavedItems = []; // Raw parsed saved items { collection, id }
let fetchedLyrics = [];
let fetchedSermons = [];
let fetchedDocuments = [];
let fetchedPhotos = [];

let docsSelectionManager = null;
let photosSelectionManager = null;

let currentLightboxPhotos = [];
let currentLightboxIndex = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupAuthListener();
});

// Setup Auth State Change Listener
function setupAuthListener() {
  if (typeof AuthService !== 'undefined') {
    AuthService.onAuthStateChanged(async (user) => {
      const authRequiredSection = document.getElementById('saved-auth-required');
      const contentWrapper = document.getElementById('saved-content-wrapper');

      if (!user) {
        // Show auth required, hide content
        if (authRequiredSection) authRequiredSection.style.display = 'block';
        if (contentWrapper) contentWrapper.style.display = 'none';

        // Setup login button
        const loginBtn = document.getElementById('saved-login-btn');
        if (loginBtn) {
          loginBtn.onclick = () => ModalSystem.open('auth-modal');
        }
      } else {
        // Hide auth required, show content
        if (authRequiredSection) authRequiredSection.style.display = 'none';
        if (contentWrapper) contentWrapper.style.display = 'block';

        // Load data and render
        await loadSavedData();
        setupTabs();
        setupModals();
        setupSelection();
      }
    });
  }
}

// Load full items from database matching saved keys
async function loadSavedData() {
  const countContainer = document.getElementById('saved-count');
  if (countContainer) countContainer.textContent = 'Loading saved items...';

  // Get raw saved items (format "collection:id")
  const savedKeys = typeof SaveService !== 'undefined' ? SaveService.getSavedItems() : [];
  allSavedItems = savedKeys.map(key => {
    const parts = key.split(':');
    return { collection: parts[0], id: parts[1] };
  });

  if (allSavedItems.length === 0) {
    fetchedLyrics = [];
    fetchedSermons = [];
    fetchedDocuments = [];
    fetchedPhotos = [];
    renderSavedItems();
    return;
  }

  try {
    // Fetch all collections in parallel
    const [lyrics, sermons, documents, photos] = await Promise.all([
      DbService.get('lyrics').catch(e => []),
      DbService.get('sermons').catch(e => []),
      DbService.get('documents').catch(e => []),
      DbService.get('photos').catch(e => [])
    ]);

    // Map and filter items based on saved list
    const lyricIds = allSavedItems.filter(item => item.collection === 'lyrics').map(item => item.id);
    const sermonIds = allSavedItems.filter(item => item.collection === 'sermons').map(item => item.id);
    const docIds = allSavedItems.filter(item => item.collection === 'mipui-aw').map(item => item.id);
    const photoIds = allSavedItems.filter(item => item.collection === 'photos').map(item => item.id);

    fetchedLyrics = lyrics.filter(item => lyricIds.includes(item.id)).map(item => {
      if (item.downloadUrl) item.downloadUrl = convertDriveUrl(item.downloadUrl, 'file');
      return item;
    });

    fetchedSermons = sermons.filter(item => sermonIds.includes(item.id));

    fetchedDocuments = documents.filter(item => docIds.includes(item.id)).map(item => {
      if (item.downloadUrl) item.downloadUrl = convertDriveUrl(item.downloadUrl, 'file');
      return item;
    });

    fetchedPhotos = photos.filter(item => photoIds.includes(item.id)).map(item => {
      if (item.imageUrl) item.imageUrl = convertDriveUrl(item.imageUrl);
      if (item.downloadUrl) item.downloadUrl = convertDriveUrl(item.downloadUrl);
      return item;
    });

    renderSavedItems();
  } catch (error) {
    console.error("Error loading saved items databases:", error);
    if (countContainer) countContainer.textContent = 'Error loading saved items.';
  }
}

// Render Saved Items in DOM
function renderSavedItems() {
  const docsContainer = document.getElementById('saved-docs-list');
  const photosGrid = document.getElementById('saved-photos-grid');
  const emptyState = document.getElementById('saved-empty-state');
  const countContainer = document.getElementById('saved-count');

  if (!docsContainer || !photosGrid || !emptyState) return;

  // Clear previous output
  docsContainer.innerHTML = '';
  photosGrid.innerHTML = '';

  const showLyrics = currentTab === 'all' || currentTab === 'lyrics';
  const showSermons = currentTab === 'all' || currentTab === 'sermons';
  const showMipuiAw = currentTab === 'all' || currentTab === 'mipui-aw';
  const showPhotos = currentTab === 'all' || currentTab === 'photos';

  let docCount = 0;
  let photoCount = 0;

  const escapeHTML = (str) => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Render Lyrics
  if (showLyrics && fetchedLyrics.length > 0) {
    fetchedLyrics.forEach(doc => {
      docCount++;
      docsContainer.innerHTML += `
        <div class="doc-card selectable-item" data-id="${doc.id}" data-type="lyrics" data-url="${doc.downloadUrl && doc.downloadUrl !== '#' ? doc.downloadUrl : ''}" data-name="${escapeHTML(doc.title)}.${(doc.fileType||'PDF').toLowerCase()}" style="position: relative; align-items: center; padding: 10px 14px; min-height: auto; gap: 12px; display: flex;">
          <div class="file-icon" style="font-size: 1.1rem; width: 34px; height: 34px; background: rgba(135, 206, 235, 0.15); color: var(--brand-sky); display: flex; align-items: center; justify-content: center; border-radius: 8px; flex-shrink: 0;">🎵</div>
          <div class="doc-card-content" style="flex: 1; min-width: 0;">
            <h3 class="doc-card-title" style="margin-bottom: 0; font-size: 0.95rem; line-height: 1.3; font-weight: 500;">${escapeHTML(doc.title)} <small style="color: var(--color-text-tertiary); font-size: 0.75rem; margin-left: 6px;">(Lyric)</small></h3>
          </div>
          <button class="save-btn" onclick="handleSavedPageRemove(event, 'lyrics', '${doc.id}')" title="Remove from Saved" style="background: none; border: none; cursor: pointer; padding: 4px; color: var(--brand-sky); transition: transform 0.2s; display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
        </div>
      `;
    });
  }

  // Render Sermons
  if (showSermons && fetchedSermons.length > 0) {
    fetchedSermons.forEach(sermon => {
      docCount++;
      docsContainer.innerHTML += `
        <div class="doc-card selectable-item" data-id="${sermon.id}" data-type="sermons" data-url="${sermon.fileUrl && sermon.fileUrl !== '#' ? sermon.fileUrl : ''}" data-name="${sermon.title}.${(sermon.fileType||'PDF').toLowerCase()}" style="position: relative; align-items: center; padding: 10px 14px; min-height: auto; gap: 12px; display: flex;">
          <div class="file-icon" style="font-size: 1.1rem; width: 34px; height: 34px; background: rgba(135, 206, 235, 0.15); color: var(--brand-sky); display: flex; align-items: center; justify-content: center; border-radius: 8px; flex-shrink: 0;">📖</div>
          <div class="doc-card-content" style="flex: 1; min-width: 0;">
            <h3 class="doc-card-title" style="margin-bottom: 0; font-size: 0.95rem; line-height: 1.3; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sermon.title} <small style="color: var(--color-text-tertiary); font-size: 0.75rem; margin-left: 6px;">(Sermon)</small></h3>
          </div>
          <button class="save-btn" onclick="handleSavedPageRemove(event, 'sermons', '${sermon.id}')" title="Remove from Saved" style="background: none; border: none; cursor: pointer; padding: 4px; color: var(--brand-sky); transition: transform 0.2s; display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
        </div>
      `;
    });
  }

  // Render Mipui Aw
  if (showMipuiAw && fetchedDocuments.length > 0) {
    fetchedDocuments.forEach(doc => {
      docCount++;
      docsContainer.innerHTML += `
        <div class="doc-card selectable-item" data-id="${doc.id}" data-type="mipui-aw" data-url="${doc.downloadUrl && doc.downloadUrl !== '#' ? doc.downloadUrl : ''}" data-name="${doc.title}.${(doc.fileType||'PDF').toLowerCase()}" style="position: relative; align-items: center; padding: 10px 14px; min-height: auto; gap: 12px; display: flex;">
          <div class="file-icon" style="font-size: 1.1rem; width: 34px; height: 34px; background: rgba(135, 206, 235, 0.15); color: var(--brand-sky); display: flex; align-items: center; justify-content: center; border-radius: 8px; flex-shrink: 0;">📄</div>
          <div class="doc-card-content" style="flex: 1; min-width: 0;">
            <h3 class="doc-card-title" style="margin-bottom: 0; font-size: 0.95rem; line-height: 1.3; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doc.title} <small style="color: var(--color-text-tertiary); font-size: 0.75rem; margin-left: 6px;">(Mipui Aw)</small></h3>
          </div>
          <button class="save-btn" onclick="handleSavedPageRemove(event, 'mipui-aw', '${doc.id}')" title="Remove from Saved" style="background: none; border: none; cursor: pointer; padding: 4px; color: var(--brand-sky); transition: transform 0.2s; display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
        </div>
      `;
    });
  }

  // Render Photos
  if (showPhotos && fetchedPhotos.length > 0) {
    currentLightboxPhotos = fetchedPhotos.filter(p => !(p.imageUrl && p.imageUrl.includes('embeddedfolderview')));
    
    fetchedPhotos.forEach(photo => {
      photoCount++;
      const isFolder = photo.imageUrl && photo.imageUrl.includes('embeddedfolderview');
      
      if (isFolder) {
        photosGrid.innerHTML += `
          <div class="masonry-item gallery-item" data-id="${photo.id}" style="grid-column: 1 / -1; width: 100%; padding: var(--sp-4); background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--sp-3); margin-bottom: var(--sp-5); transition: transform 0.3s ease, box-shadow 0.3s ease;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: var(--sp-2); border-bottom: 1px solid var(--color-border-light);">
              <div style="display: flex; gap: var(--sp-3); align-items: center;">
                <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: rgba(var(--color-primary-rgb), 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px;">📁</div>
                <div>
                  <h4 style="margin: 0 0 4px 0; font-size: var(--fs-lg); color: var(--color-text); font-weight: var(--fw-bold);">${photo.title}</h4>
                  <p style="margin: 0; font-size: var(--fs-sm); color: var(--color-text-secondary); display: flex; gap: var(--sp-2); align-items: center;">
                    <span>📅 ${formatDate ? formatDate(photo.date) : photo.date}</span>
                    <span>•</span>
                    <span class="badge badge-primary" style="padding: 2px 6px; font-size: 10px;">${photo.category}</span>
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="save-btn btn btn-outline btn-sm" onclick="handleSavedPageRemove(event, 'photos', '${photo.id}')" title="Remove from Saved" style="display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); width: 34px; height: 34px; padding: 0; min-width: auto; color: var(--brand-sky);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </button>
                <a href="${photo.imageUrl.replace('embeddedfolderview', 'folderview')}" target="_blank" class="btn btn-outline btn-sm" style="display: flex; align-items: center; gap: 8px; border-radius: var(--radius-full);">
                  <span>Open in Drive</span>
                  <span>↗️</span>
                </a>
              </div>
            </div>
            <div style="position: relative; width: 100%; padding-top: 56.25%; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border-light); background: var(--color-bg);">
              <iframe src="${photo.imageUrl}" frameborder="0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
            </div>
            ${photo.description ? `<p style="margin: 0; font-size: var(--fs-md); color: var(--color-text-secondary); line-height: 1.5; padding: var(--sp-1) var(--sp-2); border-left: 3px solid var(--color-primary); background: var(--color-surface-hover); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">${photo.description}</p>` : ''}
          </div>
        `;
      } else {
        photosGrid.innerHTML += `
          <div class="masonry-item gallery-item selectable-item" data-id="${photo.id}" data-url="${photo.imageUrl}" data-name="${photo.title || 'photo'}.jpg" style="position: relative;">
            <img src="${photo.imageUrl}" alt="${photo.title}" class="gallery-image" loading="lazy" style="width:100%; border-radius: var(--radius-lg); display:block; object-fit:cover;">
            <button class="save-btn" onclick="handleSavedPageRemove(event, 'photos', '${photo.id}')" title="Remove from Saved" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.5); border: none; cursor: pointer; padding: 6px; border-radius: 50%; color: var(--brand-sky); display: flex; align-items: center; justify-content: center; z-index: 5; transition: transform 0.2s, background 0.2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>
        `;
      }
    });
  }

  // Toggle Visibility
  docsContainer.style.display = docCount > 0 ? 'grid' : 'none';
  photosGrid.style.display = photoCount > 0 ? 'grid' : 'none';

  const totalCount = docCount + photoCount;
  if (totalCount === 0) {
    emptyState.style.display = 'block';
    if (countContainer) countContainer.textContent = 'No saved items found.';
  } else {
    emptyState.style.display = 'none';
    if (countContainer) countContainer.textContent = `Showing ${totalCount} saved item${totalCount > 1 ? 's' : ''}`;
  }

  // Re-run scroll reveal if any
  if (typeof setupScrollReveal === 'function') {
    setupScrollReveal();
  }

  // Reset selection managers since items are re-rendered
  if (docsSelectionManager) docsSelectionManager.clearSelection();
  if (photosSelectionManager) photosSelectionManager.clearSelection();
}

// Remove item from saved state on this page
window.handleSavedPageRemove = async function(event, collection, id) {
  event.stopPropagation();
  event.preventDefault();
  
  if (typeof SaveService !== 'undefined') {
    try {
      await SaveService.toggleSave(collection, id);
      Toast.show('Item removed from saved.', 'success');
      // Reload and re-render
      await loadSavedData();
    } catch (err) {
      console.error("Remove saved item error:", err);
    }
  }
};

// Setup tabs
function setupTabs() {
  const tabsContainer = document.getElementById('saved-tabs');
  if (!tabsContainer) return;

  tabsContainer.querySelectorAll('.filter-chip').forEach(btn => {
    btn.onclick = () => {
      tabsContainer.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      renderSavedItems();
    };
  });
}

// Setup Modals (Lightboxes / Document Previews)
function setupModals() {
  setupDocModal();
  setupPhotoModal();
}

// Setup Preview Modal for documents (lyrics, sermons, mipui-aw)
function setupDocModal() {
  if (document.getElementById('doc-modal')) return;

  const modalMarkup = `
    <div class="modal-backdrop lightbox-modal" id="doc-modal" style="background: rgba(0,0,0,0.95); padding: 0;">
      <div style="position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; padding: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(0,0,0,0.5); z-index: 10;">
          <h3 id="modal-doc-title" style="color: white; margin: 0; font-size: 1.2rem; font-weight: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Document</h3>
          <div style="display: flex; gap: 16px; align-items: center;">
             <button id="modal-doc-save" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;" title="Save Item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>
             <a href="#" id="modal-doc-download" download style="color: white; text-decoration: none; display: flex; align-items: center; gap: 8px;" title="Download">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             </a>
             <button id="close-doc-modal" aria-label="Close" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        </div>
        <div style="flex: 1; position: relative; width: 100%; height: 100%; background: #fff;">
          <iframe id="modal-doc-iframe" src="" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalMarkup;
  document.body.appendChild(div.firstElementChild);

  const closeBtn = document.getElementById('close-doc-modal');
  const closeAction = () => {
    const iframe = document.getElementById('modal-doc-iframe');
    if (iframe) iframe.src = 'about:blank';
    ModalSystem.close('doc-modal');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeAction);
}

function openDocModal(docId, type) {
  let doc = null;
  if (type === 'lyrics') doc = fetchedLyrics.find(d => d.id === docId);
  else if (type === 'sermons') doc = fetchedSermons.find(d => d.id === docId);
  else if (type === 'mipui-aw') doc = fetchedDocuments.find(d => d.id === docId);

  if (!doc) return;

  const modalTitle = document.getElementById('modal-doc-title');
  const modalDownload = document.getElementById('modal-doc-download');
  const modalIframe = document.getElementById('modal-doc-iframe');
  
  const saveBtn = document.getElementById('modal-doc-save');
  if (saveBtn) {
    const updateSaveBtnState = () => {
      const isSaved = typeof SaveService !== 'undefined' && SaveService.isSaved(type, docId);
      saveBtn.innerHTML = isSaved 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
      saveBtn.title = isSaved ? 'Remove from Saved' : 'Save Item';
    };
    
    updateSaveBtnState();
    
    saveBtn.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        await SaveService.toggleSave(type, docId);
        updateSaveBtnState();
        Toast.show(SaveService.isSaved(type, docId) ? 'Item saved!' : 'Item removed from saved.', 'success');
        await loadSavedData();
      } catch (err) {
        console.error("Error toggling save in modal:", err);
      }
    };
  }

  if (modalTitle) modalTitle.textContent = doc.title;

  let fileId = '';
  const url = doc.downloadUrl || doc.fileUrl || '';
  if (url && url !== '#') {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    } else {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) fileId = idMatch[1];
    }
  }

  if (modalIframe) {
    if (fileId) {
      modalIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (url && url !== '#') {
      modalIframe.src = url;
    } else {
      modalIframe.src = 'about:blank';
    }
  }

  if (modalDownload) {
    if (url && url !== '#') {
      modalDownload.style.display = 'flex';
      modalDownload.href = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : url;
      modalDownload.onclick = () => {
        Toast.show(`Downloading ${doc.title}...`, 'success');
      };
    } else {
      modalDownload.style.display = 'flex';
      modalDownload.href = '#';
      modalDownload.removeAttribute('target');
      modalDownload.onclick = (e) => {
        e.preventDefault();
        Toast.show(`Downloading ${doc.title} (Simulated)...`, 'success');
      };
    }
  }

  ModalSystem.open('doc-modal');
}

// Setup Photo Modal (Lightbox)
function setupPhotoModal() {
  if (document.getElementById('photo-modal')) return;

  const modalMarkup = `
    <div class="modal-backdrop lightbox-modal" id="photo-modal" style="background: rgba(0,0,0,0.95); user-select: none; padding: 0;">
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 0;">
        <button id="close-photo-modal" aria-label="Back" style="position: absolute; top: 16px; left: 16px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: background 0.2s;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
        <button id="modal-photo-save" style="position: absolute; top: 16px; right: 64px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: background 0.2s;" title="Save Item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>
        <a id="modal-download" href="#" download style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); text-decoration: none; transition: background 0.2s;" title="Download"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>
        <button id="modal-prev" class="lightbox-nav-btn" aria-label="Previous" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❮</button>
        <button id="modal-next" class="lightbox-nav-btn" aria-label="Next" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❯</button>
        <img src="" alt="" id="modal-image" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalMarkup;
  document.body.appendChild(div.firstElementChild);

  // Close Button
  const closeBtn = document.getElementById('close-photo-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => ModalSystem.close('photo-modal'));
  }

  // Navigation Buttons
  const prevBtn = document.getElementById('modal-prev');
  const nextBtn = document.getElementById('modal-next');
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(-1); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(1); });

  // Download Button
  const dlBtn = document.getElementById('modal-download');
  if (dlBtn) {
    dlBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const url = dlBtn.href;
      const filename = dlBtn.getAttribute('download') || 'photo.jpg';
      try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(url, '_blank');
      }
    });
  }

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('photo-modal');
    if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === 'Escape') ModalSystem.close('photo-modal');
    }
  });

  // Swipe and Zoom Navigation (Google Drive Style)
  const modalImg = document.getElementById('modal-image');
  if (modalImg && !window.savedTouchZoomHandler) {
    window.savedTouchZoomHandler = new TouchZoomHandler(
      modalImg, 
      modal, 
      () => navigateLightbox(1), // Swipe left -> next
      () => navigateLightbox(-1) // Swipe right -> prev
    );
  }
}

function navigateLightbox(direction) {
  if (currentLightboxPhotos.length === 0) return;
  currentLightboxIndex += direction;
  if (currentLightboxIndex < 0) currentLightboxIndex = currentLightboxPhotos.length - 1;
  if (currentLightboxIndex >= currentLightboxPhotos.length) currentLightboxIndex = 0;
  updateLightboxContent();
}

function updateLightboxContent() {
  const photo = currentLightboxPhotos[currentLightboxIndex];
  if (!photo) return;

  if (window.savedTouchZoomHandler) {
    window.savedTouchZoomHandler.reset();
  }

  const modalImage = document.getElementById('modal-image');
  const modalDownload = document.getElementById('modal-download');
  const saveBtn = document.getElementById('modal-photo-save');

  if (modalImage) {
    modalImage.style.opacity = '0';
    setTimeout(() => {
      modalImage.src = photo.imageUrl;
      modalImage.onload = () => modalImage.style.opacity = '1';
    }, 150);
    modalImage.style.transition = 'opacity 0.2s';
  }
  if (modalDownload) {
    modalDownload.href = photo.imageUrl;
    modalDownload.setAttribute('download', `${photo.title || 'photo'}.jpg`);
  }

  if (saveBtn) {
    const updateSaveBtnState = () => {
      const isSaved = typeof SaveService !== 'undefined' && SaveService.isSaved('photos', photo.id);
      saveBtn.innerHTML = isSaved 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
      saveBtn.title = isSaved ? 'Remove from Saved' : 'Save Item';
    };

    updateSaveBtnState();

    saveBtn.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        await SaveService.toggleSave('photos', photo.id);
        updateSaveBtnState();
        Toast.show(SaveService.isSaved('photos', photo.id) ? 'Item saved!' : 'Item removed from saved.', 'success');
        await loadSavedData();
      } catch (err) {
        console.error("Error toggling save in modal:", err);
      }
    };
  }
}

function openPhotoModal(photoId) {
  if (currentLightboxPhotos.length === 0) {
    currentLightboxPhotos = fetchedPhotos.filter(p => !(p.imageUrl && p.imageUrl.includes('embeddedfolderview')));
  }
  
  currentLightboxIndex = currentLightboxPhotos.findIndex(p => p.id === photoId);
  if (currentLightboxIndex === -1) {
    currentLightboxIndex = 0;
  }
  
  updateLightboxContent();
  ModalSystem.open('photo-modal');
}

// Setup Selection Manager and Bulk Download
function setupSelection() {
  const selectAllCb = document.getElementById('select-all-cb');
  const btnDownload = document.getElementById('btn-bulk-download');
  const btnRemove = document.getElementById('btn-bulk-save');
  const countSpan = document.getElementById('selected-count');

  if (!selectAllCb || (!btnDownload && !btnRemove)) return;

  const onSelectionChange = () => {
    const totalDocs = docsSelectionManager ? docsSelectionManager.selectedItems.size : 0;
    const totalPhotos = photosSelectionManager ? photosSelectionManager.selectedItems.size : 0;
    const totalSelected = totalDocs + totalPhotos;

    countSpan.textContent = totalSelected;
    const hasSel = totalSelected > 0;
    if (btnDownload) { btnDownload.disabled = !hasSel; btnDownload.style.opacity = hasSel ? '1' : '0.5'; }
    if (btnRemove) { btnRemove.disabled = !hasSel; btnRemove.style.opacity = hasSel ? '1' : '0.5'; }

    // Update Select All checkbox state
    const docsInDOM = document.querySelectorAll('#saved-docs-list .selectable-item').length;
    const photosInDOM = document.querySelectorAll('#saved-photos-grid .selectable-item').length;
    const totalInDOM = docsInDOM + photosInDOM;

    selectAllCb.checked = (hasSel && totalSelected === totalInDOM);
  };

  // Initialize SelectionManager for documents list
  docsSelectionManager = new SelectionManager(
    'saved-docs-list',
    '.selectable-item',
    onSelectionChange,
    (id) => {
      // Find item type
      const docEl = document.querySelector(`#saved-docs-list .selectable-item[data-id="${id}"]`);
      const type = docEl ? docEl.dataset.type : 'lyrics';
      openDocModal(id, type);
    }
  );

  // Initialize SelectionManager for photos grid
  photosSelectionManager = new SelectionManager(
    'saved-photos-grid',
    '.selectable-item',
    onSelectionChange,
    (id) => {
      openPhotoModal(id);
    }
  );

  // Handle Select All
  selectAllCb.onchange = (e) => {
    if (e.target.checked) {
      if (docsSelectionManager) docsSelectionManager.selectAll();
      if (photosSelectionManager) photosSelectionManager.selectAll();
    } else {
      if (docsSelectionManager) docsSelectionManager.clearSelection();
      if (photosSelectionManager) photosSelectionManager.clearSelection();
    }
  };

  // Handle Bulk Download Click — downloads each file individually
  btnDownload.onclick = async () => {
    const selectedDocs = docsSelectionManager ? docsSelectionManager.selectedItems : new Set();
    const selectedPhotos = photosSelectionManager ? photosSelectionManager.selectedItems : new Set();
    
    if (selectedDocs.size === 0 && selectedPhotos.size === 0) return;

    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Downloading...';
    btnDownload.disabled = true;

    try {
      const files = [
        ...Array.from(selectedDocs).map(item => JSON.parse(item)),
        ...Array.from(selectedPhotos).map(item => JSON.parse(item))
      ];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          let downloadUrl = file.url;
          // Format Google Drive download URLs correctly if needed
          const fileIdMatch = file.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (fileIdMatch && fileIdMatch[1]) {
            downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
          } else {
            const idMatch = file.url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
               downloadUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
            }
          }

          const a = document.createElement('a');
          a.href = downloadUrl;
          a.target = '_blank';
          a.download = file.name || `saved_file_${i}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          if (i < files.length - 1) await new Promise(r => setTimeout(r, 800));
        } catch (err) {
          console.error("Failed to trigger download:", file.url, err);
          window.open(file.url, '_blank');
        }
      }

      if (window.Toast) Toast.show(`Downloaded ${files.length} file${files.length > 1 ? 's' : ''}!`, 'success');
    } catch (err) {
      console.error("Error downloading files:", err);
    } finally {
      btnDownload.innerHTML = originalText;
      btnDownload.disabled = false;

      // Clear selection
      if (docsSelectionManager) docsSelectionManager.clearSelection();
      if (photosSelectionManager) photosSelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  };

  if (btnRemove) {
    btnRemove.onclick = async () => {
      const selectedDocs = docsSelectionManager ? docsSelectionManager.selectedItems : new Set();
      const selectedPhotos = photosSelectionManager ? photosSelectionManager.selectedItems : new Set();
      
      if (selectedDocs.size === 0 && selectedPhotos.size === 0) return;

      const originalHtml = btnRemove.innerHTML;
      btnRemove.innerHTML = '⏳';
      btnRemove.disabled = true;

      try {
        if (typeof SaveService !== 'undefined') {
          const selectedNodes = document.querySelectorAll('.selectable-item.selected');
          const promises = Array.from(selectedNodes).map(node => {
            const id = node.dataset.id;
            const collection = node.dataset.type || 'photos';
            return SaveService.toggleSave(collection, id);
          });
          
          await Promise.all(promises);
          if (window.Toast) Toast.show(`Removed ${selectedNodes.length} items from saved.`, 'success');
          await loadSavedData();
        }
      } catch (err) {
        console.error("Error removing selected items:", err);
      } finally {
        btnRemove.innerHTML = originalHtml;
        btnRemove.disabled = false;
        
        if (docsSelectionManager) docsSelectionManager.clearSelection();
        if (photosSelectionManager) photosSelectionManager.clearSelection();
        if (selectAllCb) selectAllCb.checked = false;
      }
    };
  }
}

// Utility: Format Date
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}
