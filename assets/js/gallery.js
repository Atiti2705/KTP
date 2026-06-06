/* ============================================
   KṬP Saikhamakawn — Photo Gallery Logic
   Handles filtering, masonry grid, load more,
   and lightbox/zoom functionality.
   ============================================ */

let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'newest';
let currentPage = 1;
const itemsPerPage = 12;

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

  container.innerHTML = PhotoCategories.map(cat => `
    <button class="filter-chip ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">
      ${cat}
    </button>
  `).join('');

  // Add click events
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
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
      <div class="masonry-item gallery-item reveal" data-id="${photo.id}">
        <img src="${photo.imageUrl}" alt="${photo.title}" class="gallery-image" loading="lazy">
        <div class="gallery-overlay">
          <h4 class="gallery-overlay-title">${photo.title}</h4>
          <p class="gallery-overlay-meta">📅 ${formatDate(photo.date)} • ${photo.category}</p>
        </div>
        <div class="gallery-overlay-actions">
          <button class="gallery-action-btn view-btn" data-id="${photo.id}" aria-label="View larger image">🔍</button>
          <a href="${photo.imageUrl}" download="${photo.title}.jpg" class="gallery-action-btn download-btn" data-id="${photo.id}" aria-label="Download image">⬇️</a>
        </div>
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

  // Attach event handlers for opening modal when clicking on gallery items or the zoom button
  grid.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't open modal if download button is clicked
      if (e.target.closest('.download-btn')) return;
      const photoId = item.dataset.id;
      openPhotoModal(photoId);
    });
  });
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
  // We will dynamic inject the lightbox modal markup into the body if it doesn't exist
  if (document.getElementById('photo-modal')) return;

  const modalMarkup = `
    <div class="modal-backdrop lightbox-modal" id="photo-modal">
      <div class="modal">
        <div class="modal-header" style="border: none; padding-bottom: 0;">
          <h3>Photo Details</h3>
          <button class="modal-close" id="close-photo-modal" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body" style="padding: var(--sp-4);">
          <div style="text-align: center; background: #000; border-radius: var(--radius-lg); overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 250px;">
            <img src="" alt="" class="lightbox-image" id="modal-image" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
          </div>
          <div class="lightbox-info" style="margin-top: var(--sp-4);">
            <h4 id="modal-title" style="font-size: var(--fs-lg); margin-bottom: var(--sp-2);"></h4>
            <p id="modal-desc" style="color: var(--color-text-secondary); font-size: var(--fs-sm); margin-bottom: var(--sp-4);"></p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span id="modal-meta" style="font-size: var(--fs-xs); color: var(--color-text-tertiary);"></span>
              <a href="#" class="btn btn-primary btn-sm" id="modal-download" download>⬇ Download Image</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalMarkup;
  document.body.appendChild(div.firstElementChild);

  const closeBtn = document.getElementById('close-photo-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      ModalSystem.close('photo-modal');
    });
  }
}

function openPhotoModal(photoId) {
  const photo = Photos.find(p => p.id === photoId);
  if (!photo) return;

  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalMeta = document.getElementById('modal-meta');
  const modalDownload = document.getElementById('modal-download');

  if (modalImage) modalImage.src = photo.imageUrl;
  if (modalTitle) modalTitle.textContent = photo.title;
  if (modalDesc) modalDesc.textContent = photo.description;
  if (modalMeta) modalMeta.textContent = `📅 ${formatDateLong(photo.date)} • Category: ${photo.category}`;
  if (modalDownload) {
    modalDownload.href = photo.imageUrl;
    modalDownload.download = `${photo.title}.svg`;
  }

  ModalSystem.open('photo-modal');
}
