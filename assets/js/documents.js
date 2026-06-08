/* ============================================
   KṬP Saikhamakawn — Mipui Aw (Documents) Logic
   Handles filtering, sorting, pagination,
   and details preview modal.
   ============================================ */

let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'manual';
let currentPage = 1;
const itemsPerPage = 1000;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await DbService.get('settings');
    if (settings && settings.documentCategories && Array.isArray(settings.documentCategories)) {
      DocumentCategories.length = 0;
      DocumentCategories.push('All', ...settings.documentCategories.filter(c => c !== 'All'));
    }
  } catch (err) {
    console.error("Error loading custom DocumentCategories:", err);
  }

  renderCategoryChips();
  setupSearchAndSort();
  setupPreviewModal();

  try {
    const data = await DbService.get('documents');
    if (data && Array.isArray(data)) {
      Documents.length = 0;
      Documents.push(...data.map(d => {
        if (d.downloadUrl) d.downloadUrl = convertDriveUrl(d.downloadUrl, 'file');
        return d;
      }));
    }
  } catch (error) {
    console.error("Error loading documents database:", error);
  }

  renderDocuments();
});

// ========================
// RENDER CATEGORY CHIPS
// ========================
function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  container.className = 'modern-filter-container';

  container.innerHTML = DocumentCategories.map(cat => `
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
      currentPage = 1; // Reset to page 1 on filter change
      renderDocuments();
    });
  });
}

// ========================
// SETUP SEARCH AND SORT
// ========================
function setupSearchAndSort() {
  const searchInput = document.getElementById('doc-search');
  const sortSelect = document.getElementById('doc-sort');
  const clearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        searchQuery = e.target.value;
        currentPage = 1;
        renderDocuments();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      renderDocuments();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderDocuments();
    });
  }
}

// ========================
// RENDER DOCUMENTS LIST
// ========================
function renderDocuments() {
  const listContainer = document.getElementById('documents-list');
  const paginationContainer = document.getElementById('pagination-container');
  const countContainer = document.getElementById('doc-count');

  if (!listContainer) return;

  // 1. Get filtered items
  const filtered = SearchEngine.filter(Documents, {
    query: searchQuery,
    category: currentCategory,
    sort: currentSort,
    searchFields: ['title', 'description', 'category'],
    categoryField: 'category'
  });

  // 2. Paginate items
  const paginationData = SearchEngine.paginate(filtered, currentPage, itemsPerPage);

  // Update results count
  SearchEngine.renderResultsInfo(countContainer, {
    totalItems: filtered.length,
    currentPage: paginationData.currentPage,
    perPage: itemsPerPage
  });

  // 3. Render items
  if (paginationData.items.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
        <div class="empty-state-icon">📄</div>
        <h3>No Documents Found</h3>
        <p>Try adjusting your search or category filters.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  listContainer.innerHTML = paginationData.items.map(doc => `
    <div class="doc-card reveal selectable-item" data-id="${doc.id}" data-url="${doc.downloadUrl && doc.downloadUrl !== '#' ? doc.downloadUrl : ''}" data-name="${doc.title}.${doc.fileType.toLowerCase()}" style="position: relative;">
      
      <div class="file-icon file-icon-${doc.fileType.toLowerCase()}">${doc.fileType}</div>
      <div class="doc-card-content">
        <h3 class="doc-card-title">${doc.title}</h3>
        <p class="doc-card-desc">${doc.description}</p>
        <div class="doc-card-meta">
          <span>📅 ${formatDate(doc.date)}</span>
          <span>📁 ${doc.fileSize}</span>
          <span class="badge badge-primary" style="padding: 2px 8px;">${doc.category}</span>
        </div>
      </div>
      <div class="doc-card-actions">
        <!-- Buttons removed for cleaner UI; double-click/tap now handles preview -->
      </div>
    </div>
  `).join('');

  // Re-run scroll reveal
  setupScrollReveal();

  // Render pagination buttons
  SearchEngine.renderPagination(paginationContainer, paginationData, (newPage) => {
    currentPage = newPage;
    renderDocuments();
    // Scroll smoothly to top of results
    document.getElementById('documents-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ========================
// PREVIEW MODAL LOGIC
// ========================
function setupPreviewModal() {
  if (document.getElementById('doc-modal')) return;

  const modalMarkup = `
    <div class="modal-backdrop" id="doc-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 id="modal-doc-title">Document Details</h3>
          <button class="modal-close" id="close-doc-modal" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
          <div style="padding: var(--sp-4); background: var(--color-bg-alt); border-radius: var(--radius-lg); border: 1px solid var(--color-border); margin-bottom: var(--sp-4);">
            <p style="font-weight: var(--fw-semibold); margin-bottom: var(--sp-2); font-size: var(--fs-sm); text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Description</p>
            <p id="modal-doc-desc" style="color: var(--color-text-secondary); font-size: var(--fs-sm); line-height: var(--lh-relaxed);"></p>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--sp-3); font-size: var(--fs-sm); padding: var(--sp-2);">
            <div style="display:flex; justify-content:space-between; border-bottom: 1px solid var(--color-border-light); padding-bottom:var(--sp-2);">
              <span style="color: var(--color-text-secondary);">📅 Published Date:</span>
              <strong id="modal-doc-date"></strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom: 1px solid var(--color-border-light); padding-bottom:var(--sp-2);">
              <span style="color: var(--color-text-secondary);">📁 File Type:</span>
              <strong id="modal-doc-type" style="text-transform: uppercase;"></strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:var(--sp-2);">
              <span style="color: var(--color-text-secondary);">⚖️ File Size:</span>
              <strong id="modal-doc-size"></strong>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-close-modal-footer">Close</button>
          <a href="#" class="btn btn-primary" id="modal-doc-download" download>⬇ Download File</a>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalMarkup;
  document.body.appendChild(div.firstElementChild);

  const closeBtn = document.getElementById('close-doc-modal');
  const closeFooterBtn = document.getElementById('btn-close-modal-footer');

  const closeAction = () => ModalSystem.close('doc-modal');

  if (closeBtn) closeBtn.addEventListener('click', closeAction);
  if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeAction);
}

function openPreviewModal(docId) {
  const doc = Documents.find(d => d.id === docId);
  if (!doc) return;

  const modalTitle = document.getElementById('modal-doc-title');
  const modalDesc = document.getElementById('modal-doc-desc');
  const modalDate = document.getElementById('modal-doc-date');
  const modalType = document.getElementById('modal-doc-type');
  const modalSize = document.getElementById('modal-doc-size');
  const modalDownload = document.getElementById('modal-doc-download');

  if (modalTitle) modalTitle.textContent = doc.title;
  if (modalDesc) modalDesc.textContent = doc.description;
  if (modalDate) modalDate.textContent = formatDateLong(doc.date);
  if (modalType) modalType.textContent = doc.fileType;
  if (modalSize) modalSize.textContent = doc.fileSize;
  if (modalDownload) {
    modalDownload.href = doc.downloadUrl || '#';
    if (doc.downloadUrl && doc.downloadUrl !== '#') {
      modalDownload.target = '_blank';
      modalDownload.onclick = () => {
        Toast.show(`Opening ${doc.title}...`, 'success');
        ModalSystem.close('doc-modal');
      };
    } else {
      modalDownload.removeAttribute('target');
      modalDownload.onclick = (e) => {
        e.preventDefault();
        Toast.show(`Downloading ${doc.title} (Simulated)...`, 'success');
        ModalSystem.close('doc-modal');
      };
    }
  }

  ModalSystem.open('doc-modal');
}

// BULK DOWNLOAD LOGIC
// ========================
let docSelectionManager = null;

function setupBulkDownload() {
  const selectAllCb = document.getElementById('select-all-cb');
  const btnDownload = document.getElementById('btn-bulk-download');
  const countSpan = document.getElementById('selected-count');
  
  if (!selectAllCb || !btnDownload) return;

  docSelectionManager = new SelectionManager(
    'documents-list',
    '.selectable-item',
    (selectedItems) => {
      countSpan.textContent = selectedItems.size;
      if (selectedItems.size > 0) {
        btnDownload.disabled = false;
        btnDownload.style.opacity = '1';
      } else {
        btnDownload.disabled = true;
        btnDownload.style.opacity = '0.5';
      }
      
      const totalItems = document.querySelectorAll('#documents-list .selectable-item[data-url]:not([data-url=""])').length;
      selectAllCb.checked = (selectedItems.size > 0 && selectedItems.size === totalItems && totalItems > 0);
    },
    (id) => {
      openPreviewModal(id);
    }
  );

  // Handle Select All
  selectAllCb.addEventListener('change', (e) => {
    if (e.target.checked) {
      docSelectionManager.selectAll();
    } else {
      docSelectionManager.clearSelection();
    }
  });

  // Handle Download Button
  btnDownload.addEventListener('click', async () => {
    const selectedDocs = docSelectionManager.selectedItems;
    if (selectedDocs.size === 0) return;
    
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Zipping...';
    btnDownload.disabled = true;
    
    try {
      const zip = new JSZip();
      const files = Array.from(selectedDocs).map(item => JSON.parse(item));
      
      const promises = files.map(async (file, index) => {
        try {
          const response = await fetch(file.url, { mode: 'cors' });
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          
          let finalName = file.name;
          if (!finalName.includes('.')) finalName += '.pdf';
          finalName = `${index}_${finalName}`; // prevent duplicates
          
          zip.file(finalName, blob);
        } catch (err) {
          console.error("Failed to fetch file for zip:", file.url, err);
        }
      });
      
      await Promise.all(promises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'KTP_Mipui_Aw.zip');
      
    } catch (err) {
      console.error("Error creating zip:", err);
      alert("Failed to create zip file. Please try downloading files individually.");
    } finally {
      btnDownload.innerHTML = originalText;
      btnDownload.disabled = false;
      
      docSelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  });
}

// Initialize bulk download when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupBulkDownload, 500); // Wait for initial render
});
