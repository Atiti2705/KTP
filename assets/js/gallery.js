/* ============================================
   KṬP Saikhamakawn — Photo Gallery Logic
   Handles filtering, masonry grid, load more,
   and lightbox/zoom functionality.
   ============================================ */

let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'manual';
let currentPage = 1;
const itemsPerPage = 1000;
let currentLightboxPhotos = [];
let currentLightboxIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await DbService.get('settings');
    if (settings && settings.photoCategories && Array.isArray(settings.photoCategories)) {
      PhotoCategories.length = 0;
      PhotoCategories.push('All', ...settings.photoCategories.filter(c => c !== 'All'));
    }
  } catch (err) {
    console.error("Error loading custom PhotoCategories:", err);
  }

  renderCategoryChips();
  setupSearchAndSort();
  setupLightbox();

  try {
    const data = await DbService.get('photos');
    if (data && Array.isArray(data)) {
      Photos.length = 0;
      Photos.push(...data.map(p => {
        if (p.imageUrl) p.imageUrl = convertDriveUrl(p.imageUrl);
        if (p.downloadUrl) p.downloadUrl = convertDriveUrl(p.downloadUrl);
        return p;
      }));
    }
  } catch (error) {
    console.error("Error loading photos database:", error);
  }

  renderGallery();
});

// ========================
// RENDER CATEGORY CHIPS
// ========================
function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  container.className = 'modern-filter-container';

  container.innerHTML = PhotoCategories.map(cat => `
    <button class="modern-chip ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">
      ${cat}
    </button>
  `).join('');

  // Add click events
  container.querySelectorAll('.modern-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.modern-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      currentPage = 1; // Reset to page 1 on filter
      renderGallery();
    });
  });
}

// ========================
// SETUP SEARCH AND SORT
// ========================
function setupSearchAndSort() {
  const searchInput = document.getElementById('gallery-search');
  const sortSelect = document.getElementById('gallery-sort');
  const clearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    // Debounce search input
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        searchQuery = e.target.value;
        currentPage = 1;
        renderGallery();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      renderGallery();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderGallery();
    });
  }
}

// ========================
// RENDER GALLERY ITEMS
// ========================
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const countContainer = document.getElementById('gallery-count');
  
  if (!grid) return;

  // 1. Get filtered items
  const filtered = SearchEngine.filter(Photos, {
    query: searchQuery,
    category: currentCategory,
    sort: currentSort,
    searchFields: ['title', 'description'],
    categoryField: 'category'
  });

  // Save for lightbox navigation (exclude folders)
  currentLightboxPhotos = filtered.filter(p => !(p.imageUrl && p.imageUrl.includes('embeddedfolderview')));

  // 2. Paginate/Load More items
  const paginationData = SearchEngine.loadMore(filtered, currentPage, itemsPerPage);

  // Update results count
  if (countContainer) {
    if (filtered.length === 0) {
      countContainer.textContent = 'No photos found';
    } else {
      countContainer.textContent = `Showing ${paginationData.showing} of ${paginationData.totalItems} photos`;
    }
  }

  // 3. Render gallery items
  if (paginationData.items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
        <div class="empty-state-icon">📸</div>
        <h3>No Photos Found</h3>
        <p>Try adjusting your search or category filters.</p>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  const itemsHtml = paginationData.items.map(photo => {
    const isFolder = photo.imageUrl && photo.imageUrl.includes('embeddedfolderview');
    
    if (isFolder) {
      return `
        <div class="masonry-item gallery-item reveal" data-id="${photo.id}" style="grid-column: 1 / -1; width: 100%; padding: var(--sp-4); background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--sp-3); margin-bottom: var(--sp-5); transition: transform 0.3s ease, box-shadow 0.3s ease;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: var(--sp-2); border-bottom: 1px solid var(--color-border-light);">
            <div style="display: flex; gap: var(--sp-3); align-items: center;">
              <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: rgba(var(--color-primary-rgb), 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px;">
                📁
              </div>
              <div>
                <h4 style="margin: 0 0 4px 0; font-size: var(--fs-lg); color: var(--color-text); font-weight: var(--fw-bold);">${photo.title}</h4>
                <p style="margin: 0; font-size: var(--fs-sm); color: var(--color-text-secondary); display: flex; gap: var(--sp-2); align-items: center;">
                  <span>📅 ${formatDate(photo.date)}</span>
                  <span>•</span>
                  <span class="badge badge-primary" style="padding: 2px 6px; font-size: 10px;">${photo.category}</span>
                </p>
              </div>
            </div>
            <a href="${photo.imageUrl.replace('embeddedfolderview', 'folderview')}" target="_blank" class="btn btn-outline btn-sm" style="display: flex; align-items: center; gap: 8px; border-radius: var(--radius-full);">
              <span>Open in Drive</span>
              <span>↗️</span>
            </a>
          </div>

          <div style="position: relative; width: 100%; padding-top: 56.25%; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border-light); background: var(--color-bg);">
            <iframe src="${photo.imageUrl}" frameborder="0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
          </div>
          
          ${photo.description ? `<p style="margin: 0; font-size: var(--fs-md); color: var(--color-text-secondary); line-height: 1.5; padding: var(--sp-1) var(--sp-2); border-left: 3px solid var(--color-primary); background: var(--color-surface-hover); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">${photo.description}</p>` : ''}
          
        </div>
      `;
    }

    return `
      <div class="masonry-item gallery-item reveal selectable-item" data-id="${photo.id}" data-url="${photo.imageUrl}" data-name="${photo.title || 'photo'}.jpg" style="position: relative;">
        <img src="${photo.imageUrl}" alt="${photo.title}" class="gallery-image" loading="lazy">
      </div>
    `;
  }).join('');

  grid.innerHTML = itemsHtml;

  // Re-run scroll reveal on newly injected elements
  setupScrollReveal();

  // Setup "Load More" button visibility
  if (loadMoreBtn) {
    if (paginationData.hasMore) {
      loadMoreBtn.style.display = 'block';
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
  // Manual click handlers removed; SelectionManager now handles click/dblclick interactions for selection and preview.
}

// Setup "Load More" button event handler
document.addEventListener('DOMContentLoaded', () => {
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      renderGallery();
    });
  }
});

// ========================
// LIGHTBOX / ZOOM MODAL
// ========================
function setupLightbox() {
  if (document.getElementById('photo-modal')) return;

  const modalMarkup = `
    <div class="modal-backdrop lightbox-modal" id="photo-modal" style="background: rgba(0,0,0,0.95); user-select: none; padding: 0;">
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 0;">
        <button id="close-photo-modal" aria-label="Back" style="position: absolute; top: 16px; left: 16px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: background 0.2s;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
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

  const modal = document.getElementById('photo-modal');

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
    if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === 'Escape') ModalSystem.close('photo-modal');
    }
  });

  // Swipe Navigation
  let touchStartX = 0;
  let touchEndX = 0;
  modal.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });
  modal.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    const minSwipeDistance = 50;
    if (touchEndX < touchStartX - minSwipeDistance) navigateLightbox(1); // Swipe left -> next
    if (touchEndX > touchStartX + minSwipeDistance) navigateLightbox(-1); // Swipe right -> prev
  });
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

  const modalImage = document.getElementById('modal-image');
  const modalDownload = document.getElementById('modal-download');

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
}

function openPhotoModal(photoId) {
  if (currentLightboxPhotos.length === 0) {
    currentLightboxPhotos = Photos.filter(p => !(p.imageUrl && p.imageUrl.includes('embeddedfolderview')));
  }
  
  currentLightboxIndex = currentLightboxPhotos.findIndex(p => p.id === photoId);
  if (currentLightboxIndex === -1) {
    currentLightboxIndex = 0;
  }
  
  updateLightboxContent();
  ModalSystem.open('photo-modal');
}

// BULK DOWNLOAD LOGIC
// ========================
let gallerySelectionManager = null;

function setupBulkDownload() {
  const selectAllCb = document.getElementById('select-all-cb');
  const btnDownload = document.getElementById('btn-bulk-download');
  const countSpan = document.getElementById('selected-count');
  
  if (!selectAllCb || !btnDownload) return;

  // Initialize SelectionManager
  gallerySelectionManager = new SelectionManager(
    'gallery-grid',
    '.selectable-item',
    (selectedItems) => {
      // Callback when selection changes
      countSpan.textContent = selectedItems.size;
      if (selectedItems.size > 0) {
        btnDownload.disabled = false;
        btnDownload.style.opacity = '1';
      } else {
        btnDownload.disabled = true;
        btnDownload.style.opacity = '0.5';
      }
      
      // Update "Select All" checkbox state
      const totalItems = document.querySelectorAll('#gallery-grid .selectable-item').length;
      selectAllCb.checked = (selectedItems.size > 0 && selectedItems.size === totalItems);
    },
    (id) => {
      // Callback for double click / single tap (preview)
      openPhotoModal(id);
    }
  );

  // Handle Select All
  selectAllCb.addEventListener('change', (e) => {
    if (e.target.checked) {
      gallerySelectionManager.selectAll();
    } else {
      gallerySelectionManager.clearSelection();
    }
  });

  // Handle Download Button
  btnDownload.addEventListener('click', async () => {
    const selectedPhotos = gallerySelectionManager.selectedItems;
    if (selectedPhotos.size === 0) return;
    
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Zipping...';
    btnDownload.disabled = true;
    
    try {
      const zip = new JSZip();
      const files = Array.from(selectedPhotos).map(item => JSON.parse(item));
      
      const promises = files.map(async (file, index) => {
        try {
          const response = await fetch(file.url, { mode: 'cors' });
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          
          // Ensure unique filenames
          const ext = file.name.split('.').pop() || 'jpg';
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || `photo_${index}`;
          const finalName = `${baseName}_${index}.${ext}`;
          
          zip.file(finalName, blob);
        } catch (err) {
          console.error("Failed to fetch image for zip:", file.url, err);
        }
      });
      
      await Promise.all(promises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'KTP_Photos.zip');
      
    } catch (err) {
      console.error("Error creating zip:", err);
      alert("Failed to create zip file. Please try downloading files individually.");
    } finally {
      btnDownload.innerHTML = originalText;
      btnDownload.disabled = false;
      
      // Clear selection
      gallerySelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  });
}

// Initialize bulk download when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupBulkDownload, 500); // Wait for initial render
});

