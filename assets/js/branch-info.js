document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('ob-container');
  if (!container) return;

  const dataType = container.getAttribute('data-type');
  if (!dataType) {
    console.error("No data-type specified on #ob-container");
    return;
  }



  // Inject Toolbar (Search & Filter) above the grid
  const toolbarHtml = `
    <div style="display: flex; flex-wrap: wrap; gap: var(--sp-3); justify-content: space-between; align-items: center; margin-bottom: var(--sp-4);">
      <div style="flex: 1; min-width: 200px; max-width: 400px; position: relative;">
        <input type="text" id="ob-search" placeholder="Search by name or year..." class="form-input" style="padding-left: 36px; width: 100%;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
      <div style="display: ${dataType === 'Kohhran Upa' ? 'none' : 'flex'}; align-items: center; gap: 8px;">
        <label for="ob-year-filter" style="font-size: var(--fs-sm); color: var(--color-text-secondary); font-weight: var(--fw-medium);">Year:</label>
        <select id="ob-year-filter" class="filter-select" style="padding: 6px 12px; border-radius: var(--radius-md);">
          <option value="all">All Years</option>
        </select>
      </div>
    </div>
  `;
  
  // Create a wrapper for the toolbar and insert it before the grid
  const toolbarWrapper = document.createElement('div');
  toolbarWrapper.innerHTML = toolbarHtml;
  container.parentNode.insertBefore(toolbarWrapper, container);

  const searchInput = document.getElementById('ob-search');
  const yearSelect = document.getElementById('ob-year-filter');

  let baseItems = [];
  let dataLoaded = false;

  function renderGrid(itemsToRender) {
    if (itemsToRender.length === 0) {
      if (!dataLoaded) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);">
            <div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>
            Loading records...
          </div>
        `;
      } else {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-secondary); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
            <div style="font-size: 3rem; margin-bottom: var(--sp-3);">📸</div>
            <h3>No Records Found</h3>
            <p>No matching records found.</p>
          </div>
        `;
      }
      return;
    }

    container.innerHTML = itemsToRender.map(item => {
      const primaryImage = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : item.imageUrl;
      
      let photoCountBadge = '';
      if (item.imageUrls && item.imageUrls.length > 1) {
        photoCountBadge = `
          <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(4px); z-index: 2; pointer-events: none;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            ${item.imageUrls.length}
          </div>
        `;
      }

      const imgWrapperHtml = primaryImage
        ? `<div class="ob-image-wrapper" style="position: relative;">
             <img loading="lazy" src="${convertDriveUrl(primaryImage)}" alt="${item.title || 'Photo'}" loading="lazy">
             ${photoCountBadge}
           </div>`
        : '';
      
      const titleHtml = item.title ? `<h3 class="ob-title">${item.title}</h3>` : '';
      let dateHtml = '';
      if (item.date && !['Kohhran Upa', 'branch-ob', 'branch-committee', 'group-committee', 'sub-committee'].includes(dataType)) {
        const dateObj = new Date(item.date);
        if (!isNaN(dateObj)) {
          const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          dateHtml = `
            <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--color-bg-hover); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: var(--sp-2); font-weight: 500; align-self: flex-start; border: 1px solid var(--color-border);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7; transform: translateY(-1px); flex-shrink: 0;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span style="line-height: 1;">${formattedDate}</span>
            </div>
          `;
        }
      }
      const textHtml = item.content ? `<div class="ob-text ob-text-clamped">${item.content}</div>` : '';

      return `
        <div class="ob-card" data-id="${item.id}">
          ${imgWrapperHtml}
          <div class="ob-content-wrapper">
            ${titleHtml}
            ${dateHtml}
            ${textHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterYear = yearSelect.value;

    let result = [...baseItems];

    // Filter by year
    if (filterYear !== 'all') {
      result = result.filter(item => (item.year || item.title) === filterYear);
    }

    // Filter by search
    if (searchTerm) {
      result = result.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(searchTerm);
        const contentMatch = (item.content || '').toLowerCase().includes(searchTerm);
        return titleMatch || contentMatch;
      });
    }

    renderGrid(result);
  }

// Add Modal & Layout CSS
  const modalStyles = `
    <style>
      .ob-card {
        cursor: pointer;
      }
      /* Layout Overrides for Horizontal Cards */
      .ob-grid:not([data-type="Kohhran Upa"]):not([data-type="branch-ob"]):not([data-type="branch-committee"]):not([data-type="group-committee"]):not([data-type="sub-committee"]) {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important;
        gap: var(--sp-4) !important;
      }
      @media (max-width: 600px) {
        .ob-grid:not([data-type="Kohhran Upa"]):not([data-type="branch-ob"]):not([data-type="branch-committee"]):not([data-type="group-committee"]):not([data-type="sub-committee"]) {
          grid-template-columns: 1fr !important;
        }
      }
      .ob-grid:not([data-type="Kohhran Upa"]):not([data-type="branch-ob"]):not([data-type="branch-committee"]):not([data-type="group-committee"]):not([data-type="sub-committee"]) .ob-card {
        cursor: pointer;
        flex-direction: row !important;
        padding: var(--sp-4);
        gap: var(--sp-4);
        align-items: center;
      }
      .ob-grid:not([data-type="Kohhran Upa"]):not([data-type="branch-ob"]):not([data-type="branch-committee"]):not([data-type="group-committee"]):not([data-type="sub-committee"]) .ob-image-wrapper {
        width: 100px !important;
        height: 100px !important;
        aspect-ratio: auto !important;
        flex-shrink: 0;
        border-radius: var(--radius-md);
        background: var(--color-bg-alt);
      }
      .ob-grid:not([data-type="Kohhran Upa"]):not([data-type="branch-ob"]):not([data-type="branch-committee"]):not([data-type="group-committee"]):not([data-type="sub-committee"]) .ob-content-wrapper {
        padding: 0 !important;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .ob-grid:not([data-type="Kohhran Upa"]):not([data-type="branch-ob"]):not([data-type="branch-committee"]):not([data-type="group-committee"]):not([data-type="sub-committee"]) .ob-title {
        font-size: var(--fs-base) !important;
        margin-bottom: 4px !important;
      }

      /* Modal and text clamping */
      .ob-text-clamped {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: var(--fs-sm);
      }
      
      .ob-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        padding: var(--sp-4);
      }
      .ob-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      .ob-modal-content {
        background: var(--color-bg-card);
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        border-radius: var(--radius-lg);
        overflow-y: auto;
        position: relative;
        transform: translateY(20px);
        transition: transform 0.3s ease;
        box-shadow: var(--shadow-xl);
      }
      .ob-modal-overlay.active .ob-modal-content {
        transform: translateY(0);
      }
      .ob-modal-close {
        position: absolute;
        top: var(--sp-3);
        right: var(--sp-3);
        background: var(--color-bg-hover);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        color: var(--color-text);
        box-shadow: var(--shadow-sm);
      }
      .ob-modal-image {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: contain;
        display: block;
        background: var(--color-bg-hover);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      }
      .ob-modal-slider-wrapper {
        position: relative;
        width: 100%;
        background: var(--color-bg-hover);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        overflow: hidden;
      }
      .ob-modal-slider {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
      }
      .ob-modal-slider::-webkit-scrollbar {
        display: none;
      }
      .ob-modal-slide {
        flex-shrink: 0;
        width: 100%;
        max-height: 400px;
        scroll-snap-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ob-modal-slide img {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: contain;
      }
      .ob-modal-dots {
        position: absolute;
        bottom: 12px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 6px;
        z-index: 5;
      }
      .ob-modal-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255,255,255,0.5);
        transition: background 0.3s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .ob-modal-dot.active {
        background: #fff;
        transform: scale(1.2);
      }
      .ob-modal-body {
        padding: var(--sp-5);
      }
      .ob-modal-title {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
        margin-bottom: var(--sp-3);
        color: var(--color-text);
        overflow-wrap: anywhere;
        word-wrap: break-word;
        word-break: break-word;
      }
      .ob-modal-text {
        font-size: var(--fs-base);
        color: var(--color-text-secondary);
        line-height: 1.7;
        white-space: pre-line;
        overflow-wrap: anywhere;
          word-wrap: break-word;
          word-break: break-word;
        }
    </style>
  `;
  document.head.insertAdjacentHTML('beforeend', modalStyles);

  // Robust cross-origin image download to bypass Android Drive app intent
  async function forceImageDownload(url, filename, fallbackBtn) {
    if (url.includes('lh3.googleusercontent.com') && !url.includes('/d/') && !url.includes('=s0')) {
      url = url.split('=')[0] + '=s0';
    }
    
    const fallbackToDocs = () => {
      const driveIdMatch = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
      if (driveIdMatch && driveIdMatch[1]) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          window.forceDownload(`https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}`);
          if (window.Toast) Toast.show('Downloading...', 'success');
      } else {
          window.forceDownload(url);
          if (window.Toast) Toast.show('Unable to auto-download. Please long-press the image to save.', 'info');
      }
      if (fallbackBtn) {
        fallbackBtn.innerHTML = fallbackBtn.dataset.originalText;
        fallbackBtn.disabled = false;
      }
    };

    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('fetch failed');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        if (fallbackBtn) {
          fallbackBtn.innerHTML = fallbackBtn.dataset.originalText;
          fallbackBtn.disabled = false;
        }
    } catch (e) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                if (fallbackBtn) {
                  fallbackBtn.innerHTML = fallbackBtn.dataset.originalText;
                  fallbackBtn.disabled = false;
                }
            }, 'image/jpeg', 0.95);
        };
        img.onerror = fallbackToDocs;
        img.src = url;
    }
  }

  // Global download handler for card buttons
  window.downloadBiCardImage = async function(btn, imgUrl, titleStr, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!imgUrl) return;

    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>';
    btn.disabled = true;

    let url = convertDriveUrl(imgUrl);
    let safeTitle = (titleStr || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_') + '.jpg';
    forceImageDownload(url, safeTitle, btn);
  };

  // Add Modal HTML
  const modalHtml = `
    <div class="ob-modal-overlay" id="ob-detail-modal">
      <div class="ob-modal-content">
        <button class="ob-modal-close" id="ob-modal-close" aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div id="ob-modal-img-container"></div>
        <div class="ob-modal-body">
          <h3 class="ob-modal-title" id="ob-modal-title"></h3>
          <div class="ob-modal-text" id="ob-modal-text"></div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Add Fullscreen Lightbox HTML for Kohhran Upa
  const lightboxHtml = `
    <div class="modal-backdrop lightbox-modal" id="bi-lightbox" style="background: rgba(0,0,0,0.95); user-select: none; padding: 0; display: none; z-index: 99999;">
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 0;">
        <button id="bi-lightbox-close" aria-label="Back" style="position: absolute; top: 16px; left: 16px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: background 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        
        <div id="bi-lightbox-counter" style="position: absolute; top: 16px; left: 64px; background: rgba(255,255,255,0.15); color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; z-index: 10; backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center;"></div>
        
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 12px; z-index: 10;">
          <a id="bi-lightbox-download" href="#" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); text-decoration: none; transition: background 0.2s;" title="Download">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </a>
        </div>

        <button id="bi-lightbox-prev" class="lightbox-nav-btn" aria-label="Previous" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❮</button>
        <button id="bi-lightbox-next" class="lightbox-nav-btn" aria-label="Next" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❯</button>
        
        <img loading="lazy" src="" alt="" id="bi-lightbox-image" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">
        
        <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; text-align: center; color: white; z-index: 20;">
          <h3 id="bi-lightbox-title" style="margin: 0; font-size: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);"></h3>
          <p id="bi-lightbox-text" style="margin: 4px 0 0 0; font-size: 1rem; text-shadow: 0 1px 3px rgba(0,0,0,0.8); opacity: 0.9; max-height: 20vh; overflow-y: auto;"></p>
          <div id="bi-lightbox-docs" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;"></div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', lightboxHtml);

  // Lightbox Elements
  const biLightbox = document.getElementById('bi-lightbox');
  const biLightboxImage = document.getElementById('bi-lightbox-image');
  const biLightboxTitle = document.getElementById('bi-lightbox-title');
  const biLightboxText = document.getElementById('bi-lightbox-text');
  const biLightboxDownload = document.getElementById('bi-lightbox-download');
  let currentLightboxItems = [];
  let currentLightboxIndex = 0;

  function updateBiLightboxImage() {
    if (currentLightboxItems.length === 0) return;
    
    if (window.biTouchZoomHandler) {
      window.biTouchZoomHandler.reset();
    }
    
    const item = currentLightboxItems[currentLightboxIndex];
    const primaryImage = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : item.imageUrl;
    const finalUrl = primaryImage ? convertDriveUrl(primaryImage) : '';
    
    biLightboxImage.style.opacity = '0';
    setTimeout(() => {
      biLightboxImage.src = finalUrl;
      biLightboxImage.onload = () => biLightboxImage.style.opacity = '1';
    }, 150);
    biLightboxImage.style.transition = 'opacity 0.2s ease-in-out';
    
    const counter = document.getElementById('bi-lightbox-counter');
    if (counter) {
      const currentId = item.id;
      const sameItemPhotos = currentLightboxItems.filter(i => i.id === currentId);
      const firstIndexOfId = currentLightboxItems.findIndex(i => i.id === currentId);
      const relativeIndex = currentLightboxIndex - firstIndexOfId + 1;
      
      if (sameItemPhotos.length > 1) {
        counter.textContent = `${relativeIndex} / ${sameItemPhotos.length}`;
        counter.style.display = 'flex';
      } else {
        counter.style.display = 'none';
      }
    }
    
    if (['Kohhran Upa', 'branch-ob', 'branch-committee', 'group-committee', 'sub-committee', 'lawmpuina', 'sunna', 'news'].includes(dataType)) {
      biLightboxTitle.style.display = 'none';
      biLightboxText.style.display = 'none';
    } else {
      biLightboxTitle.style.display = 'block';
      biLightboxText.style.display = 'block';
      biLightboxTitle.textContent = item.title || '';
      biLightboxText.textContent = item.content || '';
    }
    
    const docsContainer = document.getElementById('bi-lightbox-docs');
    if (docsContainer) {
      if (item.documentFiles && item.documentFiles.length > 0) {
        docsContainer.innerHTML = item.documentFiles.map(doc => `
          <a href="#" onclick="window.forceDownload('${doc.url}'); event.preventDefault(); event.stopPropagation(); return false;" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.5); border-radius: var(--radius-full); text-decoration: none; color: white; backdrop-filter: blur(4px); font-size: var(--fs-sm); transition: background 0.2s; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 99999; position: relative;">
            <span>📄</span>
            <span style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${doc.name}</span>
          </a>
        `).join('');
      } else {
        docsContainer.innerHTML = '';
      }
    }    
    biLightboxDownload.href = finalUrl || '#';
  }

  function closeBiLightbox(fromHistory = false) {
    biLightbox.classList.remove('active');
    biLightbox.style.display = 'none';
    if (!detailModal.classList.contains('active')) {
      document.body.style.overflow = '';
    }
    biLightboxImage.src = '';
    if (!fromHistory && history.state && history.state.modalId === 'bi-lightbox') {
      history.back();
    }
  }

  document.getElementById('bi-lightbox-close')?.addEventListener('click', () => closeBiLightbox());
  
  document.getElementById('bi-lightbox-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxItems.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxItems.length) % currentLightboxItems.length;
    updateBiLightboxImage();
  });
  
  document.getElementById('bi-lightbox-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxItems.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxItems.length;
    updateBiLightboxImage();
  });

  const downloadHandler = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      let url = biLightboxDownload.href;
      if (!url || url === '#') return;
      
      const targetBtn = e.currentTarget;
      targetBtn.dataset.originalText = targetBtn.innerHTML;
      targetBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>';
      
      let titleStr = 'photo';
      if (currentLightboxItems && currentLightboxItems[currentLightboxIndex]) {
          const curItem = currentLightboxItems[currentLightboxIndex];
          titleStr = curItem.title || 'photo';
          if (curItem.id) titleStr += `_${curItem.id}`;
      }
      let safeTitle = titleStr.replace(/[^a-zA-Z0-9_-]/g, '_') + '.jpg';
      
      forceImageDownload(url, safeTitle, targetBtn);
  };

  if (biLightboxDownload) biLightboxDownload.addEventListener('click', downloadHandler);

  // Set up Touch Zoom
  if (biLightboxImage && typeof TouchZoomHandler !== 'undefined') {
    window.biTouchZoomHandler = new TouchZoomHandler(
      biLightboxImage, 
      biLightbox, 
      () => {
        if (currentLightboxItems.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxItems.length;
        updateBiLightboxImage();
      }, 
      () => {
        if (currentLightboxItems.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxItems.length) % currentLightboxItems.length;
        updateBiLightboxImage();
      }
    );
  }

  const detailModal = document.getElementById('ob-detail-modal');
  const closeBtn = document.getElementById('ob-modal-close');
  const modalTitleElem = document.getElementById('ob-modal-title');
  const modalTextElem = document.getElementById('ob-modal-text');
  const modalImgContainer = document.getElementById('ob-modal-img-container');

  function closeModal(fromHistory = false) {
    detailModal.classList.remove('active');
    document.body.style.overflow = '';
    if (!fromHistory && history.state && history.state.modalId === 'ob-detail-modal') {
      history.back();
    }
  }

  window.addEventListener('popstate', (e) => {
    if (biLightbox.style.display === 'flex') {
      closeBiLightbox(true);
    } else if (detailModal.classList.contains('active')) {
      closeModal(true);
    }
  });

  closeBtn.addEventListener('click', () => closeModal());
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });

  // Event delegation for opening the modal
  container.addEventListener('click', (e) => {
    // Don't open lightbox if clicking the download button
    if (e.target.closest('button')) return;

    const card = e.target.closest('.ob-card');
    if (!card) return;
    
    const id = card.getAttribute('data-id');
    const item = baseItems.find(i => i.id === id);
    if (!item) return;

    const isPhotoOnlyModal = ['Kohhran Upa', 'branch-ob', 'branch-committee', 'group-committee', 'sub-committee', 'lawmpuina', 'sunna'].includes(dataType);

    // For news/similar: if the clicked item has no image, skip lightbox and show detail modal instead
    const hasImage = (item.imageUrls && item.imageUrls.length > 0) || item.imageUrl;

    if (isPhotoOnlyModal && hasImage) {
      let flatGallery = [];
      baseItems.forEach(bItem => {
        if (bItem.imageUrls && bItem.imageUrls.length > 0) {
          bItem.imageUrls.forEach(url => {
            flatGallery.push({
              ...bItem,
              imageUrl: url,
              imageUrls: [] // Clear this so updateBiLightboxImage uses imageUrl
            });
          });
        } else if (bItem.imageUrl) {
          flatGallery.push(bItem);
        }
      });
      
      currentLightboxItems = flatGallery;
      currentLightboxIndex = flatGallery.findIndex(i => i.id === id);
      
      updateBiLightboxImage();
      biLightbox.classList.add('active');
      biLightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      history.pushState({ modalId: 'bi-lightbox' }, '', '#lightbox');
      return;
    }

    modalTitleElem.textContent = item.title || '';
    
    // Safely render content and append document links if any
    let textHtml = '';
    if (item.date && !['Kohhran Upa', 'branch-ob', 'branch-committee', 'group-committee', 'sub-committee'].includes(dataType)) {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj)) {
        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        textHtml += `
          <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--color-bg-hover); padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: var(--sp-3); font-weight: 500; border: 1px solid var(--color-border);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7; transform: translateY(-1px); flex-shrink: 0;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span style="line-height: 1;">${formattedDate}</span>
          </div>
        `;
      }
    }
    const escapedContent = (item.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    textHtml += escapedContent;
    
    if (item.documentFiles && item.documentFiles.length > 0) {
      textHtml += `
        <div style="margin-top: var(--sp-4);">
          <h4 style="font-size: var(--fs-md); font-weight: var(--fw-semibold); margin-bottom: var(--sp-3); color: var(--color-text);">Documents & Files</h4>
          <div style="display: flex; flex-direction: column; gap: var(--sp-2);">
            ${item.documentFiles.map(doc => `
              <a href="${doc.url}" target="_blank" style="display: flex; align-items: center; gap: 12px; padding: var(--sp-3); background: var(--color-bg-hover); border-radius: var(--radius-md); text-decoration: none; color: var(--color-text); border: 1px solid var(--color-border); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                <span style="font-size: 24px;">📄</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--fw-medium);">${doc.name}</span>
                <span style="color: var(--brand-sky); font-size: var(--fs-sm); font-weight: var(--fw-bold);">Open ↗</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    modalTextElem.innerHTML = textHtml;
    
    if (item.imageUrls && item.imageUrls.length > 1) {
      modalImgContainer.innerHTML = `
        <div class="ob-modal-slider-wrapper">
          <div class="ob-modal-slider" id="ob-modal-slider">
            ${item.imageUrls.map((url, i) => `
              <div class="ob-modal-slide">
                <img loading="lazy" src="${convertDriveUrl(url)}" alt="${item.title || 'Photo'}">
              </div>
            `).join('')}
          </div>
          <div class="ob-modal-dots" id="ob-modal-dots">
            ${item.imageUrls.map((_, i) => `
              <div class="ob-modal-dot ${i === 0 ? 'active' : ''}"></div>
            `).join('')}
          </div>
        </div>
      `;
      
      const slider = document.getElementById('ob-modal-slider');
      const dots = document.getElementById('ob-modal-dots').querySelectorAll('.ob-modal-dot');
      
      slider.addEventListener('scroll', () => {
        const index = Math.round(slider.scrollLeft / slider.clientWidth);
        dots.forEach((dot, i) => {
          if (i === index) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      });
      
    } else if (item.imageUrls && item.imageUrls.length === 1) {
      modalImgContainer.innerHTML = `<img loading="lazy" src="${convertDriveUrl(item.imageUrls[0])}" class="ob-modal-image" alt="${item.title || 'Photo'}">`;
    } else if (item.imageUrl) {
      modalImgContainer.innerHTML = `<img loading="lazy" src="${convertDriveUrl(item.imageUrl)}" class="ob-modal-image" alt="${item.title || 'Photo'}">`;
    } else {
      modalImgContainer.innerHTML = '';
    }

    const modalImages = modalImgContainer.querySelectorAll('img');
    modalImages.forEach((img, idx) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        let images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
        currentLightboxItems = images.map(url => ({
          ...item,
          imageUrl: url,
          imageUrls: []
        }));
        currentLightboxIndex = idx;
        updateBiLightboxImage();
        biLightbox.classList.add('active');
        biLightbox.style.display = 'flex';
        history.pushState({ modalId: 'bi-lightbox' }, '', '#lightbox');
      });
    });
    
    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    history.pushState({ modalId: 'ob-detail-modal' }, '', '#ob-detail-modal');
  });

  try {
    const collectionName = container.getAttribute('data-collection') || 'branch-info';
    
    // Check localStorage cache first for immediate render (only if cache has matching items)
    try {
      const cached = localStorage.getItem('db_' + collectionName);
      if (cached) {
        const items = JSON.parse(cached) || [];
        const cachedFiltered = items.filter(item => item.category === dataType);
        if (cachedFiltered.length > 0) {
          baseItems = cachedFiltered;
          baseItems.sort((a, b) => {
            const yearA = a.year || a.title || '';
            const yearB = b.year || b.title || '';
            return yearB.localeCompare(yearA);
          });
          const uniqueYears = [...new Set(baseItems.map(item => item.year || item.title).filter(val => val))];
          uniqueYears.sort((a, b) => b.localeCompare(a));
          yearSelect.innerHTML = '<option value="all">All Years</option>';
          uniqueYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
          });
          dataLoaded = true;
          applyFilters();
        }
      }
    } catch(e) {}

    // Fetch data asynchronously
    DbService.get(collectionName).then(items => {
      items = items || [];
      // Filter by the current page's data-type
      baseItems = items.filter(item => item.category === dataType);
  
      // Sort items by year descending
      baseItems.sort((a, b) => {
        const yearA = a.year || a.title || '';
        const yearB = b.year || b.title || '';
        return yearB.localeCompare(yearA);
      });
  
      // Populate Year Filter dynamically based on available years (fallback to title)
      const uniqueYears = [...new Set(baseItems.map(item => item.year || item.title).filter(val => val))];
      uniqueYears.sort((a, b) => b.localeCompare(a)); // Sort newest (highest year) first
      
      yearSelect.innerHTML = '<option value="all">All Years</option>';
      uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      });
  
      // Mark data as loaded and render
      dataLoaded = true;
      applyFilters();
    }).catch(error => {
      console.error(`Error loading ${collectionName} for ${dataType}:`, error);
      dataLoaded = true;
      applyFilters();
    });

    // Event listeners
    searchInput.addEventListener('input', applyFilters);
    yearSelect.addEventListener('change', applyFilters);
    
  } catch (error) {
    console.error(`Error configuring branch-info page:`, error);
  }
});
