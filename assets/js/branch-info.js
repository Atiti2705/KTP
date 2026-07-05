document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('ob-container');
  if (!container) return;

  const dataType = container.getAttribute('data-type');
  if (!dataType) {
    console.error("No data-type specified on #ob-container");
    return;
  }

  function formatDriveImageLink(url) {
    if (!url) return '';
    const match = url.trim().match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url.trim();
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

  function renderGrid(itemsToRender) {
    if (itemsToRender.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-secondary); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
          <div style="font-size: 3rem; margin-bottom: var(--sp-3);">📸</div>
          <h3>No Records Found</h3>
          <p>No matching records found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = itemsToRender.map(item => {
      const primaryImage = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : item.imageUrl;
      const imgHtml = primaryImage 
        ? `<img loading="lazy" src="${formatDriveImageLink(primaryImage)}" alt="${item.title || 'Photo'}" loading="lazy">` 
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-tertiary); font-size: var(--fs-xs);">No Image Provided</div>`;
      
      const titleHtml = item.title ? `<h3 class="ob-title">${item.title}</h3>` : '';
      const textHtml = item.content ? `<div class="ob-text ob-text-clamped">${item.content}</div>` : '';

      return `
        <div class="ob-card" data-id="${item.id}">
          <div class="ob-image-wrapper">
            ${imgHtml}
          </div>
          <div class="ob-content-wrapper">
            ${titleHtml}
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
    const finalUrl = primaryImage ? formatDriveImageLink(primaryImage) : '';
    
    biLightboxImage.style.opacity = '0';
    setTimeout(() => {
      biLightboxImage.src = finalUrl;
      biLightboxImage.onload = () => biLightboxImage.style.opacity = '1';
    }, 150);
    biLightboxImage.style.transition = 'opacity 0.2s ease-in-out';
    
    biLightboxTitle.textContent = item.title || '';
    biLightboxText.textContent = item.content || '';
    
    const docsContainer = document.getElementById('bi-lightbox-docs');
    if (docsContainer) {
      if (item.documentFiles && item.documentFiles.length > 0) {
        docsContainer.innerHTML = item.documentFiles.map(doc => `
          <a href="#" onclick="window.open('${doc.url}', '_blank'); event.preventDefault(); event.stopPropagation(); return false;" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.5); border-radius: var(--radius-full); text-decoration: none; color: white; backdrop-filter: blur(4px); font-size: var(--fs-sm); transition: background 0.2s; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 99999; position: relative;">
            <span>📄</span>
            <span style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${doc.name}</span>
          </a>
        `).join('');
      } else {
        docsContainer.innerHTML = '';
      }
    }    
    let fileId = '';
    if (primaryImage) {
      const match = primaryImage.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    }
    biLightboxDownload.href = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : (primaryImage || '#');
  }

  function closeBiLightbox(fromHistory = false) {
    biLightbox.classList.remove('active');
    biLightbox.style.display = 'none';
    document.body.style.overflow = '';
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

  if (biLightboxDownload) {
    biLightboxDownload.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const url = biLightboxDownload.href;
      if (!url || url === '#') return;
      const prevHtml = biLightboxDownload.innerHTML;
      biLightboxDownload.innerHTML = '<span style="font-size: 14px;">⏳</span>';
      try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'photo.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(url, '_blank');
      }
      biLightboxDownload.innerHTML = prevHtml;
    });
  }

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
    if (detailModal.classList.contains('active')) {
      closeModal(true);
    } else if (biLightbox.style.display === 'flex') {
      closeBiLightbox(true);
    }
  });

  closeBtn.addEventListener('click', () => closeModal());
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });

  // Event delegation for opening the modal
  container.addEventListener('click', (e) => {
    const card = e.target.closest('.ob-card');
    if (!card) return;
    
    const id = card.getAttribute('data-id');
    const item = baseItems.find(i => i.id === id);
    if (!item) return;

    const isPhotoOnlyModal = ['Kohhran Upa', 'branch-ob', 'branch-committee', 'group-committee', 'sub-committee'].includes(dataType);

    if (isPhotoOnlyModal) {
      currentLightboxItems = baseItems;
      currentLightboxIndex = baseItems.findIndex(i => i.id === id);
      updateBiLightboxImage();
      biLightbox.classList.add('active');
      biLightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      history.pushState({ modalId: 'bi-lightbox' }, '', '#lightbox');
      return;
    }

    modalTitleElem.textContent = item.title || '';
    
    // Safely render content and append document links if any
    const escapedContent = (item.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let textHtml = escapedContent;
    
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
                <img loading="lazy" src="${formatDriveImageLink(url)}" alt="${item.title || 'Photo'}">
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
      modalImgContainer.innerHTML = `<img loading="lazy" src="${formatDriveImageLink(item.imageUrls[0])}" class="ob-modal-image" alt="${item.title || 'Photo'}">`;
    } else if (item.imageUrl) {
      modalImgContainer.innerHTML = `<img loading="lazy" src="${formatDriveImageLink(item.imageUrl)}" class="ob-modal-image" alt="${item.title || 'Photo'}">`;
    } else {
      modalImgContainer.innerHTML = '';
    }
    
    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    history.pushState({ modalId: 'ob-detail-modal' }, '', '#ob-detail-modal');
  });

  try {
    const collectionName = container.getAttribute('data-collection') || 'branch-info';
    const items = await DbService.get(collectionName) || [];
    
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
    
    uniqueYears.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });

    // Initial render
    applyFilters();

    // Event listeners
    searchInput.addEventListener('input', applyFilters);
    yearSelect.addEventListener('change', applyFilters);
    
  } catch (error) {
    console.error(`Error loading ${collectionName} for ${dataType}:`, error);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--brand-red); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--brand-red);">
        <p>⚠️ Failed to load records. Please try again later.</p>
      </div>
    `;
  }
});
