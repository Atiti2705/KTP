/* ============================================
   KṬP Saikhamakawn — Photo Gallery Logic
   Handles filtering, masonry grid, load more,
   and lightbox/zoom functionality.
   ============================================ */

let activeAlbumKey = null;
let currentCategory = 'All';
let currentSubCategory = 'All';
let currentYear = 'All';
let searchQuery = '';
let currentSort = 'newest';
let currentPage = 1;
const itemsPerPage = 100;
let currentLightboxPhotos = [];
let currentLightboxIndex = 0;
let dataLoaded = false;

document.addEventListener('DOMContentLoaded', async () => {
  renderYearFilter();
  renderCategoryChips();
  setupSearchAndSort();
  setupLightbox();

  // 1. Instant render from local cache if available
  try {
    const cached = localStorage.getItem('db_photos');
    if (cached) {
      const cachedData = JSON.parse(cached);
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        Photos.length = 0;
        Photos.push(...cachedData.map(p => {
          if (p.imageUrl) p.imageUrl = convertDriveUrl(p.imageUrl, 'image', 'w400');
          if (p.downloadUrl) p.downloadUrl = convertDriveUrl(p.downloadUrl);
          return p;
        }));
        dataLoaded = true;
        renderYearFilter();
        renderCategoryChips();
        renderGallery();
      }
    }
  } catch (e) {}

  // 2. Fetch fresh data from Firestore asynchronously
  try {
    const data = await DbService.get('photos');
    if (data && Array.isArray(data)) {
      Photos.length = 0;
      Photos.push(...data.map(p => {
        if (p.imageUrl) p.imageUrl = convertDriveUrl(p.imageUrl, 'image', 'w400');
        if (p.downloadUrl) p.downloadUrl = convertDriveUrl(p.downloadUrl);
        return p;
      }));
      try {
        localStorage.setItem('db_photos', JSON.stringify(data));
      } catch (e) {}
    }
  } catch (error) {
    console.error("Error loading photos database:", error);
  } finally {
    dataLoaded = true;
  }

  renderYearFilter();
  renderCategoryChips();
  renderGallery();

  // Check URL params for direct photo opening (from homepage pinned items)
  const urlParams = new URLSearchParams(window.location.search);
  const targetPhotoId = urlParams.get('id');
  if (targetPhotoId) {
    const photo = Photos.find(p => p.id === targetPhotoId);
    if (photo) {
      if (photo.category) {
        activeAlbumKey = photo.category;
      }
      renderGallery();
      setTimeout(() => {
        openPhotoModal(targetPhotoId);
        const el = document.querySelector(`[data-id="${targetPhotoId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    }
  }
});

// ========================
// RENDER YEAR FILTER
// ========================
function renderYearFilter() {
  const container = document.getElementById('year-filter-wrap');
  const row = document.getElementById('year-filter-row');
  if (!container) return;

  const years = Array.from(
    new Set(Photos.map(p => p.date ? String(new Date(p.date).getFullYear()) : null).filter(Boolean))
  ).sort((a, b) => b - a); // newest first

  // (Removed logic that hides Year row if years.length <= 1 so it's always visible)

  if (row) row.style.display = 'flex';
  container.innerHTML = `
    <select id="year-select" class="filter-select" style="width: 100%;">
      <option value="All" ${currentYear === 'All' ? 'selected' : ''}>All Years</option>
      ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
    </select>
  `;

  const sel = container.querySelector('#year-select');
  if (sel) {
    sel.addEventListener('change', (e) => {
      activeAlbumKey = null;
      currentYear = e.target.value;
      currentCategory = 'All'; // reset category when year changes
      currentSubCategory = 'All';
      currentPage = 1;
      renderCategoryChips(); // category options may change per year
      renderGallery();
    });
  }
}

function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  const row = document.getElementById('category-filter-row');
  if (!container) return;

  // Exclude 'By Year' from the category dropdown — year is its own separate filter now
  const cats = PhotoCategories.filter(c => c !== 'By Year');

  // Count how many distinct categories are present in the currently year-filtered photos
  const presentCats = new Set(
    Photos
      .filter(p => currentYear === 'All' || (p.date && String(new Date(p.date).getFullYear()) === currentYear))
      .map(p => p.category)
      .filter(Boolean)
  );

  // (Removed logic that hides Category row if presentCats.size <= 1 so it's always visible)

  if (row) row.style.display = 'flex';
  container.innerHTML = `
    <select id="category-select" class="filter-select" style="width: 100%;">
      ${cats.map(cat =>
        `<option value="${cat}" ${cat === currentCategory ? 'selected' : ''}>${cat}</option>`
      ).join('')}
    </select>
  `;

  const select = container.querySelector('#category-select');
  if (select) {
    select.addEventListener('change', (e) => {
      activeAlbumKey = null;
      currentCategory = e.target.value;
      currentSubCategory = 'All';
      currentPage = 1;
      renderSubCategoryChips();
      renderGallery();
    });
  }
  renderSubCategoryChips();
}

// ========================
// RENDER SUB CATEGORY CHIPS
// ========================
function renderSubCategoryChips() {
  const container = document.getElementById('subcategory-chips');
  if (!container) return;

  const hide = () => {
    container.style.display = 'none';
    currentSubCategory = 'All';
  };

  if (currentCategory === 'All') { hide(); return; }

  // Gather subcategories respecting both current year and category
  const photosInCat = Photos.filter(p => {
    const matchCat = p.category === currentCategory;
    const matchYear = currentYear === 'All' || (p.date && String(new Date(p.date).getFullYear()) === currentYear);
    return matchCat && matchYear;
  });

  const subcats = new Set();
  photosInCat.forEach(p => {
    if (p.subcategory) {
      const subStr = String(p.subcategory).trim();
      if (subStr !== '') subcats.add(subStr);
    }
  });

  const getMonthIndex = (str) => {
    if (!str) return -1;
    const lower = String(str).toLowerCase();
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    for (let i = 0; i < months.length; i++) { if (lower.startsWith(months[i])) return i; }
    const shorts = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    for (let i = 0; i < shorts.length; i++) { if (lower === shorts[i] || lower.startsWith(shorts[i]+' ')) return i; }
    return -1;
  };

  const uniqueSubCats = Array.from(subcats).sort((a, b) => {
    const ia = getMonthIndex(a), ib = getMonthIndex(b);
    if (ia !== -1 && ib !== -1) {
      return currentSort === 'oldest' ? ia - ib : ib - ia;
    }
    return currentSort === 'oldest' ? a.localeCompare(b) : b.localeCompare(a);
  });

  // (Removed logic that hides subcategory if < 2 subcats so it's always visible when a category is selected)

  container.style.display = 'flex';
  container.innerHTML = `
    <select id="subcategory-select" class="filter-select" style="width: 100%;">
      <option value="All" ${currentSubCategory === 'All' ? 'selected' : ''}>All</option>
      ${uniqueSubCats.map(s =>
        `<option value="${s}" ${s === currentSubCategory ? 'selected' : ''}>${s}</option>`
      ).join('')}
    </select>
  `;

  const select = container.querySelector('#subcategory-select');
  if (select) {
    select.addEventListener('change', (e) => {
      activeAlbumKey = null;
      currentSubCategory = e.target.value;
      currentPage = 1;
      renderGallery();
    });
  }
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
        activeAlbumKey = null;
        searchQuery = e.target.value;
        currentPage = 1;
        renderGallery();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      activeAlbumKey = null;
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      renderGallery();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeAlbumKey = null;
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
  let filtered = SearchEngine.filter(Photos, {
    query: searchQuery,
    category: 'All', // we handle category ourselves below
    sort: currentSort,
    searchFields: ['title', 'description'],
    categoryField: 'category'
  });

  if (currentYear !== 'All') {
    filtered = filtered.filter(p => p.date && String(new Date(p.date).getFullYear()) === currentYear);
  }
  if (currentCategory !== 'All') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }
  if (currentSubCategory !== 'All') {
    filtered = filtered.filter(p => p.subcategory === currentSubCategory);
  }

  // Photo HTML Helper
  const getPhotoHtml = (photo) => {
    const isFolder = photo.imageUrl && photo.imageUrl.includes('embeddedfolderview');
    if (isFolder) {
      return `
        <div class="masonry-item gallery-item" data-id="${photo.id}" style="grid-column: 1 / -1; width: 100%; padding: var(--sp-4); background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--sp-3); margin-bottom: var(--sp-5);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: var(--sp-2); border-bottom: 1px solid var(--color-border-light);">
            <div style="display: flex; gap: var(--sp-3); align-items: center;">
              <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: rgba(var(--color-primary-rgb), 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px;">📁</div>
              <div>
                <h4 style="margin: 0 0 4px 0; font-size: var(--fs-lg); color: var(--color-text); font-weight: var(--fw-bold);">${photo.title}</h4>
                <p style="margin: 0; font-size: var(--fs-sm); color: var(--color-text-secondary); display: flex; gap: var(--sp-2); align-items: center;">
                  <span>📅 ${formatDate(photo.date)}</span>
                </p>
              </div>
            </div>
            <a href="${photo.imageUrl.replace('embeddedfolderview', 'folderview')}" target="_blank" class="btn btn-outline btn-sm" style="display: flex; align-items: center; gap: 8px; border-radius: var(--radius-full);">
              <span>Open in Drive</span><span>↗️</span>
            </a>
          </div>
          <div style="position: relative; width: 100%; padding-top: 56.25%; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border-light); background: var(--color-bg);">
            <iframe src="${photo.imageUrl}" frameborder="0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
          </div>
          ${photo.description ? `<p style="margin: 0; font-size: var(--fs-md); color: var(--color-text-secondary); line-height: 1.5; padding: var(--sp-1) var(--sp-2); border-left: 3px solid var(--color-primary); background: var(--color-surface-hover); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">${photo.description}</p>` : ''}
        </div>
      `;
    }
    const imgSrc = photo.imageUrl;
    const imgFallback1 = imgSrc.replace(/=w\d+/, '=w400');
    const imgFallback2 = imgSrc.replace(/=w\d+/, '=w200');
    return `
      <div class="masonry-item gallery-item selectable-item" data-id="${photo.id}" data-url="${photo.imageUrl}" data-name="${photo.title || 'photo'}.jpg" style="position: relative;">
        ${photo.isAlbumCover ? '<div style="position: absolute; top: 8px; right: 8px; background: var(--brand-sky); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 12px; z-index: 2; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">Cover</div>' : ''}
        <img loading="lazy" src="${imgSrc}" alt="${photo.title}" class="gallery-image"
          onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='${imgFallback1}';}else if(this.dataset.retry==='1'){this.dataset.retry='2';this.src='${imgFallback2}';}else if(this.dataset.retry==='2'){this.dataset.retry='3';this.src='assets/images/logo.png';this.style.objectFit='contain';this.style.padding='20%';this.style.opacity='0.3';}">
      </div>
    `;
  };

  // Handle View States
  if (activeAlbumKey === null) {
    // === LEVEL 1: CATEGORY ALBUMS ===
    document.getElementById('album-header-section').style.display = 'none';
    const selectionToolbar = document.getElementById('selection-toolbar');
    if(selectionToolbar) selectionToolbar.style.display = 'none';

    const albumsMap = new Map();
    filtered.forEach(photo => {
      const cat = photo.category || 'General';
      const key = cat;
      if (!albumsMap.has(key)) {
        albumsMap.set(key, { key: key, title: cat, photos: [], coverPhoto: null });
      }
      const album = albumsMap.get(key);
      album.photos.push(photo);
      if (photo.isAlbumCover && (!photo.subcategory || photo.subcategory === '')) {
        album.coverPhoto = photo;
      } else if (photo.isAlbumCover && !album.coverPhoto) {
        album.coverPhoto = photo;
      }
    });

    const albums = Array.from(albumsMap.values());
    albums.forEach(album => {
      if (!album.coverPhoto && album.photos.length > 0) {
        album.coverPhoto = album.photos[0];
      }
    });

    albums.sort((a, b) => {
      const datesA = a.photos.map(p => SearchEngine._getDate(p)).filter(Boolean);
      const datesB = b.photos.map(p => SearchEngine._getDate(p)).filter(Boolean);
      const dateA = datesA.length > 0 ? Math.max(...datesA) : 0;
      const dateB = datesB.length > 0 ? Math.max(...datesB) : 0;
      if (currentSort === 'oldest') return dateA - dateB;
      if (currentSort === 'a-z') return a.title.localeCompare(b.title);
      if (currentSort === 'z-a') return b.title.localeCompare(a.title);
      return dateB - dateA;
    });

    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedAlbums = albums.slice(0, startIdx + itemsPerPage);
    
    if (countContainer) {
      countContainer.textContent = albums.length === 0 ? 'No albums found' : `Showing ${paginatedAlbums.length} of ${albums.length} albums`;
    }

    if (albums.length === 0) {
      grid.innerHTML = dataLoaded ? `
        <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
          <div class="empty-state-icon">🗂️</div>
          <h3>No Albums Found</h3>
        </div>` : `<div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);"><div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>Loading albums...</div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    grid.innerHTML = paginatedAlbums.map(album => {
      let imgSrc = 'assets/images/logo.png';
      if (album.coverPhoto && album.coverPhoto.imageUrl) {
        imgSrc = album.coverPhoto.imageUrl;
        if (!imgSrc.includes('embeddedfolderview')) imgSrc = imgSrc.replace(/=w\d+/, '=w400');
        else imgSrc = 'assets/images/logo.png';
      }
      return `
        <div class="masonry-item album-card" onclick="openAlbum('${album.key}')">
          <div class="album-card-container">
            <img loading="lazy" src="${imgSrc}" alt="${album.title}">
            <div class="album-card-overlay"></div>
            <div class="album-card-content">
              <h3>${album.title}</h3>
              <p>🗂️ ${album.photos.length} Photo${album.photos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (loadMoreBtn) loadMoreBtn.style.display = (startIdx + itemsPerPage < albums.length) ? 'block' : 'none';

  } else if (!activeAlbumKey.includes('::')) {
    // === LEVEL 2: INSIDE CATEGORY (Subcategories + Loose Photos) ===
    document.getElementById('album-header-section').style.display = 'block';
    
    const cat = activeAlbumKey;
    filtered = filtered.filter(p => (p.category || 'General') === cat);
    document.getElementById('album-title-display').textContent = cat;

    const subcatsMap = new Map();
    const loosePhotos = [];

    filtered.forEach(photo => {
      if (photo.subcategory && photo.subcategory.trim() !== '') {
        const sub = photo.subcategory.trim();
        const key = `${cat}::${sub}`;
        if (!subcatsMap.has(key)) {
          subcatsMap.set(key, { key: key, title: sub, photos: [], coverPhoto: null });
        }
        const album = subcatsMap.get(key);
        album.photos.push(photo);
        if (photo.isAlbumCover) album.coverPhoto = photo;
      } else {
        loosePhotos.push(photo);
      }
    });

    const getMonthIndex = (str) => {
      if (!str) return -1;
      const lower = String(str).toLowerCase();
      const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
      for (let i = 0; i < months.length; i++) { if (lower.startsWith(months[i])) return i; }
      const shorts = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      for (let i = 0; i < shorts.length; i++) { if (lower === shorts[i] || lower.startsWith(shorts[i]+' ')) return i; }
      return -1;
    };

    const subAlbums = Array.from(subcatsMap.values());
    subAlbums.forEach(album => {
      if (!album.coverPhoto && album.photos.length > 0) album.coverPhoto = album.photos[0];
    });

    subAlbums.sort((a, b) => {
      const monthA = getMonthIndex(a.title);
      const monthB = getMonthIndex(b.title);
      const datesA = a.photos.map(p => SearchEngine._getDate(p)).filter(Boolean);
      const datesB = b.photos.map(p => SearchEngine._getDate(p)).filter(Boolean);
      const dateA = datesA.length > 0 ? Math.max(...datesA) : 0;
      const dateB = datesB.length > 0 ? Math.max(...datesB) : 0;

      if (currentSort === 'oldest') {
        if (dateA && dateB && dateA !== dateB) return dateA - dateB;
        if (monthA !== -1 && monthB !== -1) return monthA - monthB;
        return a.title.localeCompare(b.title);
      } else if (currentSort === 'a-z') {
        return a.title.localeCompare(b.title);
      } else if (currentSort === 'z-a') {
        return b.title.localeCompare(a.title);
      } else {
        // default 'newest': latest photo date first, then newest month
        if (dateA && dateB && dateA !== dateB) return dateB - dateA;
        if (monthA !== -1 && monthB !== -1) return monthB - monthA;
        return b.title.localeCompare(a.title);
      }
    });

    const combinedItems = [...subAlbums, ...loosePhotos];
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = combinedItems.slice(0, startIdx + itemsPerPage);

    currentLightboxPhotos = loosePhotos.filter(p => !(p.imageUrl && p.imageUrl.includes('embeddedfolderview')));

    if (countContainer) {
      countContainer.textContent = combinedItems.length === 0 ? 'No items found' : `Showing ${paginatedItems.length} of ${combinedItems.length} items`;
    }

    if (combinedItems.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; width: 100%;"><div class="empty-state-icon">📸</div><h3>No Photos Found</h3></div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    grid.innerHTML = paginatedItems.map(item => {
      if (item.photos && Array.isArray(item.photos)) {
        // Render subcategory album
        let imgSrc = 'assets/images/logo.png';
        if (item.coverPhoto && item.coverPhoto.imageUrl) {
          imgSrc = item.coverPhoto.imageUrl;
          if (!imgSrc.includes('embeddedfolderview')) imgSrc = imgSrc.replace(/=w\d+/, '=w400');
          else imgSrc = 'assets/images/logo.png';
        }
        return `
          <div class="masonry-item album-card" onclick="openAlbum('${item.key}')">
            <div class="album-card-container">
              <img loading="lazy" src="${imgSrc}" alt="${item.title}">
              <div class="album-card-overlay"></div>
              <div class="album-card-content">
                <h3>${item.title}</h3>
                <p>🗂️ ${item.photos.length} Photo${item.photos.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        `;
      } else {
        return getPhotoHtml(item);
      }
    }).join('');

    if (loadMoreBtn) loadMoreBtn.style.display = (startIdx + itemsPerPage < combinedItems.length) ? 'block' : 'none';

  } else {
    // === LEVEL 3: INSIDE SUBCATEGORY (Photos only) ===
    document.getElementById('album-header-section').style.display = 'block';
    
    const [cat, sub] = activeAlbumKey.split('::');
    filtered = filtered.filter(p => (p.category || 'General') === cat && p.subcategory === sub);
    
    document.getElementById('album-title-display').textContent = `${cat} - ${sub}`;
    currentLightboxPhotos = filtered.filter(p => !(p.imageUrl && p.imageUrl.includes('embeddedfolderview')));

    const paginationData = SearchEngine.loadMore(filtered, currentPage, itemsPerPage);

    if (countContainer) {
      countContainer.textContent = paginationData.items.length === 0 ? 'No photos found' : `Showing ${paginationData.showing} of ${paginationData.totalItems} photos`;
    }

    if (paginationData.items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; width: 100%;"><div class="empty-state-icon">📸</div><h3>No Photos Found</h3></div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    grid.innerHTML = paginationData.items.map(photo => getPhotoHtml(photo)).join('');
    if (loadMoreBtn) loadMoreBtn.style.display = paginationData.hasMore ? 'block' : 'none';
  }

  setupScrollReveal();
}

function createSlug(str) {
  if (!str) return '';
  return str.toString().toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

window.openAlbum = function(albumKey) {
  activeAlbumKey = albumKey;
  currentPage = 1;
  const slug = createSlug(albumKey);
  history.pushState({ albumKey: activeAlbumKey }, "", "?album=" + slug);
  renderGallery();
};

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.albumKey !== undefined) {
    activeAlbumKey = e.state.albumKey;
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    const targetAlbum = urlParams.get('album');
    if (targetAlbum) {
      const cleanTarget = targetAlbum.toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundKey = Array.from(new Set(Photos.map(p => p.category).filter(Boolean))).find(cat => {
        const cleanCat = cat.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanCat === cleanTarget || cleanCat.includes(cleanTarget);
      });
      activeAlbumKey = foundKey || targetAlbum;
    } else {
      activeAlbumKey = null;
    }
  }
  currentPage = 1;
  renderGallery();
});

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('btn-back-to-albums');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (activeAlbumKey && activeAlbumKey.includes('::')) {
        activeAlbumKey = activeAlbumKey.split('::')[0];
        const slug = createSlug(activeAlbumKey);
        history.pushState({ albumKey: activeAlbumKey }, "", "?album=" + slug);
      } else {
        activeAlbumKey = null;
        history.pushState({ albumKey: null }, "", window.location.pathname);
      }
      currentPage = 1;
      
      const selectionToolbar = document.getElementById('selection-toolbar');
      if (selectionToolbar) selectionToolbar.style.display = 'none';
      if (typeof gallerySelectionManager !== 'undefined' && gallerySelectionManager) {
        gallerySelectionManager.clearSelection();
      }
      const selectAllCb = document.getElementById('select-all-cb');
      if (selectAllCb) selectAllCb.checked = false;
      
      renderGallery();
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const albumParam = urlParams.get('album');
  if (albumParam) {
    activeAlbumKey = albumParam;
    history.replaceState({ albumKey: activeAlbumKey }, "", window.location.search);
  } else {
    history.replaceState({ albumKey: null }, "", window.location.pathname);
  }

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
        
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 12px; z-index: 10;">
          <button id="modal-save" aria-label="Save" title="Save Photo" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: background 0.2s;">
            <svg id="modal-save-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
          <a id="modal-download" href="#" download style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); text-decoration: none; transition: background 0.2s;" title="Download"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>
        </div>

        <button id="modal-prev" class="lightbox-nav-btn" aria-label="Previous" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❮</button>
        <button id="modal-next" class="lightbox-nav-btn" aria-label="Next" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❯</button>
        <img loading="lazy" src="" alt="" id="modal-image" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">
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

  // Download Button is handled dynamically in openLightbox to prevent duplicate downloads


  // Save Button
  const saveBtn = document.getElementById('modal-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const photo = currentLightboxPhotos[currentLightboxIndex];
      if (!photo) return;
      
      if (!window.SaveService) {
        if(window.Toast) Toast.show('Save service is not available', 'error');
        return;
      }
      
      const isSaved = SaveService.isSaved('photos', photo.id);
      if (isSaved) {
        await SaveService.unsaveItem('photos', photo.id);
        if(window.Toast) Toast.show('Photo removed from saved', 'success');
      } else {
        await SaveService.saveItem('photos', photo.id, {
          title: photo.title || 'Photo',
          url: photo.imageUrl,
          date: photo.date || new Date().toISOString()
        });
        if(window.Toast) Toast.show('Photo saved!', 'success');
      }
      updateLightboxContent(); // Refresh icon
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

  // Swipe and Zoom Navigation (Google Drive Style)
  const modalImg = document.getElementById('modal-image');
  if (modalImg && !window.galleryTouchZoomHandler) {
    window.galleryTouchZoomHandler = new TouchZoomHandler(
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

  if (window.galleryTouchZoomHandler) {
    window.galleryTouchZoomHandler.reset();
  }

  const modalImage = document.getElementById('modal-image');
  const modalDownload = document.getElementById('modal-download');

  if (modalImage) {
    let lowResUrl = photo.imageUrl;
    let highResUrl = photo.imageUrl;
    if (highResUrl.includes('lh3.googleusercontent.com')) {
      // The w400 thumbnail is already in browser cache from the gallery grid
      lowResUrl = highResUrl.split('=')[0] + '=w400';
      highResUrl = highResUrl.split('=')[0] + '=w1200';
    }
    
    // 1. Hide the old image instantly
    modalImage.style.transition = 'none';
    modalImage.style.opacity = '0';
    modalImage.style.filter = 'none';
    modalImage.onload = null;
    
    // 2. Wait exactly one full render frame to guarantee the screen is cleared visually!
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 3. Once the screen is guaranteed clear, set up the new image
        modalImage.onload = () => {
          modalImage.onload = null; // Ensure this only runs once per photo
          modalImage.style.transition = 'opacity 0.15s ease-out';
          modalImage.style.opacity = '1';
          
          // 4. Load the high-res version silently in the background
          const loader = new Image();
          loader.onload = () => {
            // Only swap to high-res if the user hasn't swiped away to another photo
            if (currentLightboxPhotos[currentLightboxIndex]?.id === photo.id) {
              modalImage.src = highResUrl;
            }
          };
          loader.src = highResUrl;
        };
        
        modalImage.src = lowResUrl;
        
        // Fallback for browsers that load from cache instantly and skip the onload event
        if (modalImage.complete && modalImage.naturalWidth > 0) {
          modalImage.onload();
        }
      });
    });
  }
  if (modalDownload) {
    let dlUrl = photo.imageUrl;
    if (dlUrl.includes('lh3.googleusercontent.com') && !dlUrl.includes('=s0')) {
      dlUrl = dlUrl.split('=')[0] + '=s0';
    }
    
    modalDownload.href = '#';
    modalDownload.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (modalDownload.dataset.downloading === 'true') return;
      
      modalDownload.dataset.downloading = 'true';
      const originalHtml = modalDownload.innerHTML;
      modalDownload.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>';
      
      try {
        await window.forceDownload(dlUrl, `${photo.title || 'photo'}.jpg`);
      } finally {
        modalDownload.innerHTML = originalHtml;
        modalDownload.dataset.downloading = 'false';
      }
    };
  }
  
  // Update Save Icon state
  const saveIcon = document.getElementById('modal-save-icon');
  if (saveIcon && window.SaveService) {
    const isSaved = SaveService.isSaved('photos', photo.id);
    if (isSaved) {
      saveIcon.setAttribute('fill', 'currentColor');
    } else {
      saveIcon.setAttribute('fill', 'none');
    }
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
  const btnSave = document.getElementById('btn-bulk-save');
  const countSpan = document.getElementById('selected-count');
  
  if (!selectAllCb || (!btnDownload && !btnSave)) return;

  // Initialize SelectionManager
  gallerySelectionManager = new SelectionManager(
    'gallery-grid',
    '.selectable-item',
    (selectedItems) => {
      // Callback when selection changes
      countSpan.textContent = selectedItems.size;
      const hasSel = selectedItems.size > 0;
      if (btnDownload) { btnDownload.disabled = !hasSel; btnDownload.style.opacity = hasSel ? '1' : '0.5'; }
      if (btnSave) { btnSave.disabled = !hasSel; btnSave.style.opacity = hasSel ? '1' : '0.5'; }
      
      // Update "Select All" checkbox state
      const totalItems = document.querySelectorAll('#gallery-grid .selectable-item').length;
      selectAllCb.checked = (hasSel && selectedItems.size === totalItems);
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

  // Handle Download Button — downloads each file individually
  btnDownload.addEventListener('click', async () => {
    const selectedPhotos = gallerySelectionManager.selectedItems;
    if (selectedPhotos.size === 0) return;
    
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Downloading...';
    btnDownload.disabled = true;
    
    try {
      const files = Array.from(selectedPhotos).map(item => JSON.parse(item));
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let dlUrl = file.url;
        if (dlUrl.includes('lh3.googleusercontent.com') && !dlUrl.includes('=s0')) {
          dlUrl = dlUrl.split('=')[0] + '=s0';
        }
        try {
          const response = await fetch(dlUrl, { mode: 'cors' });
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = file.name || `photo_${i}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          // Small delay between downloads to prevent browser blocking
          if (i < files.length - 1) await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.error("Failed to download file:", dlUrl, err);
          window.open(dlUrl, '_blank');
        }
      }
      
      if (window.Toast) Toast.show(`Downloaded ${files.length} photo${files.length > 1 ? 's' : ''}!`, 'success');
    } catch (err) {
      console.error("Error downloading files:", err);
    } finally {
      btnDownload.innerHTML = originalText;
      btnDownload.disabled = false;
      
      // Clear selection
      gallerySelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  });

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const selectedDocs = gallerySelectionManager.selectedItems;
      if (selectedDocs.size === 0) return;
      
      const originalHtml = btnSave.innerHTML;
      btnSave.innerHTML = '⏳';
      btnSave.disabled = true;
      
      try {
        if (window.SaveService) {
          const selectedNodes = document.querySelectorAll('#gallery-grid .selectable-item.selected');
          const promises = Array.from(selectedNodes).map(node => {
             const photoId = node.dataset.id;
             const photoObj = Photos.find(p => p.id === photoId) || { id: photoId, imageUrl: node.dataset.url, title: node.dataset.name };
             return SaveService.saveItem('photos', photoObj.id, {
               title: photoObj.title || 'Photo',
               url: photoObj.imageUrl || photoObj.url,
               date: photoObj.date || new Date().toISOString()
             });
          });
          await Promise.all(promises);
          if(window.Toast) Toast.show(`Saved ${selectedNodes.length} items!`, 'success');
        }
      } catch (err) {
        console.error("Bulk save error:", err);
      } finally {
        btnSave.innerHTML = originalHtml;
        btnSave.disabled = false;
        gallerySelectionManager.clearSelection();
        selectAllCb.checked = false;
      }
    });
  }
}

// Initialize bulk download when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupBulkDownload, 500); // Wait for initial render
});

