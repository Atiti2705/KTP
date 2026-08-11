/* ============================================
   KṬP Saikhamakawn — Mipui Aw (Documents) Logic
   Handles filtering, sorting, pagination,
   and details preview modal.
   ============================================ */

let currentCategory = 'All';
let currentSubCategory = 'All';
let searchQuery = '';
let currentYearFilter = 'All';
let currentPage = 1;
const itemsPerPage = 1000;

let dataLoaded = false;

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

  const targetCollection = window.TARGET_COLLECTION || 'documents';

  // 1. Instant render from localStorage cache
  try {
    const cached = localStorage.getItem('db_' + targetCollection);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        Documents.length = 0;
        Documents.push(...parsed.map(d => {
          if (d.downloadUrl) d.downloadUrl = convertDriveUrl(d.downloadUrl, 'file');
          return d;
        }));
        dataLoaded = true;
        populateYearDropdown();
        renderDocuments();
      }
    }
  } catch (e) {}

  // 2. Fetch fresh data from Firestore asynchronously
  try {
    const data = await DbService.get(targetCollection);
    if (data && Array.isArray(data)) {
      Documents.length = 0;
      Documents.push(...data.map(d => {
        if (d.downloadUrl) d.downloadUrl = convertDriveUrl(d.downloadUrl, 'file');
        return d;
      }));
      try {
        localStorage.setItem('db_' + targetCollection, JSON.stringify(data));
      } catch (e) {}
    }
  } catch (error) {
    console.error("Error loading documents database:", error);
  } finally {
    dataLoaded = true;
  }

  populateYearDropdown();
  renderDocuments();
});

// ========================
// RENDER CATEGORY CHIPS
// ========================
function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  const sortedCategories = [...DocumentCategories].sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    const numA = Number(a.trim());
    const numB = Number(b.trim());
    if (!isNaN(numA) && !isNaN(numB) && a.trim() !== '' && b.trim() !== '') {
      return numB - numA;
    }
    return 0;
  });

  container.innerHTML = sortedCategories.map(cat => `
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
      currentSubCategory = 'All'; // Reset subcategory when category changes
      currentYearFilter = 'All'; // Reset year filter when category changes
      currentPage = 1; // Reset to page 1 on filter change
      populateYearDropdown();
      renderSubCategoryChips();
      renderDocuments();
    });
  });
  renderSubCategoryChips();
}

// ========================
// RENDER SUB CATEGORY CHIPS
// ========================
function renderSubCategoryChips() {
  const container = document.getElementById('subcategory-chips');
  if (!container) return;

  // Only show subcategories if a specific category is selected
  if (currentCategory === 'All') {
    container.style.display = 'none';
    currentSubCategory = 'All';
    return;
  }

  const docsInCat = Documents.filter(d => d.category === currentCategory);
    
  const subcats = new Set();
  docsInCat.forEach(d => {
    if (d.subcategory) {
      const subStr = String(d.subcategory).trim();
      if (subStr !== '') {
        subcats.add(subStr);
      }
    }
  });

  const getMonthIndex = (str) => {
    if (!str) return -1;
    const lower = String(str).toLowerCase();
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    for (let i = 0; i < months.length; i++) {
      if (lower.startsWith(months[i])) return i;
    }
    const shortMonths = ['jan ', 'feb ', 'mar ', 'apr ', 'may ', 'jun ', 'jul ', 'aug ', 'sep ', 'oct ', 'nov ', 'dec '];
    for (let i = 0; i < shortMonths.length; i++) {
      if (lower.startsWith(shortMonths[i])) return i;
    }
    // Also check exact short months
    const exactShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    for (let i = 0; i < exactShorts.length; i++) {
      if (lower === exactShorts[i]) return i;
    }
    return -1;
  };

  const uniqueSubCats = Array.from(subcats).sort((a, b) => {
    const numA = Number(a.trim());
    const numB = Number(b.trim());
    if (!isNaN(numA) && !isNaN(numB) && a.trim() !== '' && b.trim() !== '') {
      return numB - numA;
    }
    const idxA = getMonthIndex(a);
    const idxB = getMonthIndex(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return b.localeCompare(a);
  });

  if (uniqueSubCats.length === 0) {
    container.style.display = 'none';
    currentSubCategory = 'All';
    return;
  }

  container.style.display = 'flex';
  
  container.innerHTML = uniqueSubCats.map(subcat => `
    <button class="subfilter-chip ${subcat === currentSubCategory ? 'active' : ''}" data-subcategory="${subcat}">
      ${subcat}
    </button>
  `).join('');

  container.querySelectorAll('.subfilter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentSubCategory === btn.dataset.subcategory) {
        // Toggle OFF if clicking the already active one
        btn.classList.remove('active');
        currentSubCategory = 'All';
      } else {
        container.querySelectorAll('.subfilter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSubCategory = btn.dataset.subcategory;
      }
      currentPage = 1;
      renderDocuments();
    });
  });
}

// ========================
// SETUP SEARCH AND YEAR FILTER
// ========================
function setupSearchAndSort() {
  const searchInput = document.getElementById('doc-search');
  const yearSelect = document.getElementById('doc-year');
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

  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      currentYearFilter = e.target.value;
      currentPage = 1;
      renderDocuments();
    });
  }
}

function populateYearDropdown() {
  const yearSelect = document.getElementById('doc-year');
  if (!yearSelect) return;
  
  const docs = currentCategory === 'All' ? Documents : Documents.filter(d => d.category === currentCategory);
  const years = new Set();
  docs.forEach(d => {
    if (d.date) {
      const year = d.date.split('-')[0];
      if (year && year.length === 4) years.add(year);
    }
  });
  
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  
  const wasSelected = yearSelect.value;
  yearSelect.innerHTML = '<option value="All">All Years</option>' + 
    sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
    
  if (wasSelected && sortedYears.includes(wasSelected)) {
    yearSelect.value = wasSelected;
    currentYearFilter = wasSelected;
  } else {
    yearSelect.value = 'All';
    currentYearFilter = 'All';
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
  let filtered = SearchEngine.filter(Documents, {
    query: searchQuery,
    category: currentCategory,
    sort: 'newest',
    searchFields: ['title', 'description', 'category'],
    categoryField: 'category'
  });

  if (currentSubCategory !== 'All') {
    filtered = filtered.filter(d => d.subcategory === currentSubCategory);
  }

  if (currentYearFilter !== 'All') {
    filtered = filtered.filter(d => d.date && d.date.startsWith(currentYearFilter));
  }

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
    if (!dataLoaded) {
      listContainer.innerHTML = `
        <div style="grid-column: 1 / -1; width: 100%; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);">
          <div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>
          Loading records...
        </div>
      `;
    } else {
      listContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
          <div class="empty-state-icon">📄</div>
          <h3>No Documents Found</h3>
          <p>Try adjusting your search or category filters.</p>
        </div>
      `;
    }
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  listContainer.innerHTML = paginationData.items.map(doc => {
    let fileId = '';
    const downloadUrl = doc.downloadUrl || doc.fileUrl;
    if (downloadUrl && downloadUrl !== '#') {
      const fileIdMatch = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        fileId = fileIdMatch[1];
      } else {
        const idMatch = downloadUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) fileId = idMatch[1];
      }
    }
    
    let thumbHtml = '';
    if (fileId) {
      thumbHtml = `<img loading="lazy" src="https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400" alt="Preview" class="gdrive-thumbnail">`;
    } else {
      thumbHtml = `<div class="gdrive-no-preview"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>`;
    }

    return `
    <div class="gdrive-card selectable-item" data-id="${doc.id}" data-url="${doc.downloadUrl && doc.downloadUrl !== '#' ? doc.downloadUrl : ''}" data-name="${doc.title}.${String(doc.fileType||'PDF').toLowerCase()}">
      <div class="gdrive-header">
        <div class="gdrive-icon-wrapper">
          <span class="gdrive-pdf-badge">PDF</span>
        </div>
        <div class="gdrive-title" title="${doc.title}">${doc.title}</div>
        <div class="gdrive-menu" title="More Actions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
        </div>
      </div>
      <div class="gdrive-preview-container">
        ${thumbHtml}
      </div>
    </div>
    `;
  }).join('');

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
    <div class="modal-backdrop lightbox-modal" id="doc-modal" style="background: rgba(0,0,0,0.95); padding: 0;">
      <div style="position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; padding: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(0,0,0,0.5); z-index: 10;">
          <h3 id="modal-doc-title" style="color: white; margin: 0; font-size: 1.2rem; font-weight: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Document</h3>
          <div style="display: flex; gap: 16px; align-items: center;">
             <a href="#" id="modal-doc-download" download style="color: white; text-decoration: none; display: flex; align-items: center; gap: 8px;" title="Download">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             </a>
             <button id="close-doc-modal" aria-label="Close" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        </div>
        <div style="flex: 1; position: relative; width: 100%; height: 100%; background: #fff; -webkit-overflow-scrolling: touch; overflow: auto;">
          <iframe id="modal-doc-iframe" src="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>
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
    if (iframe) iframe.src = '';
    ModalSystem.close('doc-modal');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeAction);
}

function openPreviewModal(docId) {
  const doc = Documents.find(d => d.id === docId);
  if (!doc) return;

  const modalTitle = document.getElementById('modal-doc-title');
  const modalDownload = document.getElementById('modal-doc-download');
  const modalIframe = document.getElementById('modal-doc-iframe');

  if (modalTitle) modalTitle.textContent = doc.title;

  let fileId = '';
  const downloadUrl = doc.downloadUrl || doc.fileUrl;
  
  if (downloadUrl && downloadUrl !== '#') {
    const fileIdMatch = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    } else {
      const idMatch = downloadUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) fileId = idMatch[1];
    }
  }

  if (modalIframe) {
    if (fileId) {
      modalIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (downloadUrl && downloadUrl !== '#') {
      modalIframe.src = downloadUrl;
    } else {
      modalIframe.src = 'about:blank';
    }
  }

  if (modalDownload) {
    if (downloadUrl && downloadUrl !== '#') {
      modalDownload.style.display = 'flex';
      modalDownload.href = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : downloadUrl;
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

// BULK DOWNLOAD LOGIC
// ========================
let docSelectionManager = null;

function setupBulkDownload() {
  const selectAllCb = document.getElementById('select-all-cb');
  const btnDownload = document.getElementById('btn-bulk-download');
  const btnSave = document.getElementById('btn-bulk-save');
  const countSpan = document.getElementById('selected-count');
  
  if (!selectAllCb || (!btnDownload && !btnSave)) return;

  docSelectionManager = new SelectionManager(
    'documents-list',
    '.selectable-item',
    (selectedItems) => {
      countSpan.textContent = selectedItems.size;
      const hasSel = selectedItems.size > 0;
      if (btnDownload) { btnDownload.disabled = !hasSel; btnDownload.style.opacity = hasSel ? '1' : '0.5'; }
      if (btnSave) { btnSave.disabled = !hasSel; btnSave.style.opacity = hasSel ? '1' : '0.5'; }
      
      const totalItems = document.querySelectorAll('#documents-list .selectable-item[data-url]:not([data-url=""])').length;
      selectAllCb.checked = (hasSel && selectedItems.size === totalItems && totalItems > 0);
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

  // Handle Download Button — downloads each file individually
  btnDownload.addEventListener('click', async () => {
    const selectedDocs = docSelectionManager.selectedItems;
    if (selectedDocs.size === 0) return;
    
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Downloading...';
    btnDownload.disabled = true;
    
    try {
      const files = Array.from(selectedDocs).map(item => JSON.parse(item));
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const response = await fetch(file.url, { mode: 'cors' });
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          let finalName = file.name;
          if (!finalName.includes('.')) finalName += '.pdf';
          a.download = finalName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          if (i < files.length - 1) await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.error("Failed to download file:", file.url, err);
          window.open(file.url, '_blank');
        }
      }
      
      if (window.Toast) Toast.show(`Downloaded ${files.length} file${files.length > 1 ? 's' : ''}!`, 'success');
    } catch (err) {
      console.error("Error downloading files:", err);
    } finally {
      btnDownload.innerHTML = originalText;
      btnDownload.disabled = false;
      
      docSelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  });

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const selectedDocs = docSelectionManager.selectedItems;
      if (selectedDocs.size === 0) return;
      
      const originalHtml = btnSave.innerHTML;
      btnSave.innerHTML = '⏳';
      btnSave.disabled = true;
      
      try {
        if (window.SaveService) {
          const selectedNodes = document.querySelectorAll('#documents-list .selectable-item.selected');
          const promises = Array.from(selectedNodes).map(node => {
             const id = node.dataset.id;
             const docObj = Documents.find(d => d.id === id) || { id, downloadUrl: node.dataset.url, title: node.dataset.name };
             return SaveService.saveItem('mipui-aw', docObj.id, {
               title: docObj.title || 'Document',
               url: docObj.downloadUrl || docObj.url,
               date: docObj.date || new Date().toISOString()
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
        docSelectionManager.clearSelection();
        selectAllCb.checked = false;
      }
    });
  }
}

// Initialize bulk download when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupBulkDownload, 500); // Wait for initial render
});
