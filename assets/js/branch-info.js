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
      const imgHtml = item.imageUrl 
        ? `<img src="${formatDriveImageLink(item.imageUrl)}" alt="${item.title || 'Photo'}" loading="lazy">` 
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
      /* Layout Overrides for Horizontal Cards */
      .ob-grid:not([data-type="Kohhran Upa"]) {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important;
        gap: var(--sp-4) !important;
      }
      @media (max-width: 600px) {
        .ob-grid:not([data-type="Kohhran Upa"]) {
          grid-template-columns: 1fr !important;
        }
      }
      .ob-grid:not([data-type="Kohhran Upa"]) .ob-card {
        cursor: pointer;
        flex-direction: row !important;
        padding: var(--sp-4);
        gap: var(--sp-4);
        align-items: center;
      }
      .ob-grid:not([data-type="Kohhran Upa"]) .ob-image-wrapper {
        width: 100px !important;
        height: 100px !important;
        aspect-ratio: auto !important;
        flex-shrink: 0;
        border-radius: var(--radius-md);
        background: var(--color-bg-alt);
      }
      .ob-grid:not([data-type="Kohhran Upa"]) .ob-content-wrapper {
        padding: 0 !important;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .ob-grid:not([data-type="Kohhran Upa"]) .ob-title {
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
        max-height: 300px;
        object-fit: contain;
        display: block;
        background: var(--color-bg-hover);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
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

    modalTitleElem.textContent = item.title || '';
    modalTextElem.textContent = item.content || '';
    
    if (item.imageUrl) {
      modalImgContainer.innerHTML = `<img src="${formatDriveImageLink(item.imageUrl)}" class="ob-modal-image" alt="${item.title || 'Photo'}">`;
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
