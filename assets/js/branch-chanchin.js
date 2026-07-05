/* ============================================
   KṬP Saikhamakawn — BranchChanchin Page Logic
   Handles filtering, sorting, pagination,
   and reading notes preview modal.
   ============================================ */

let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'manual';
let currentPage = 1;
const itemsPerPage = 1000;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await DbService.get('settings');
    if (settings && settings.branchChanchinCategories && Array.isArray(settings.branchChanchinCategories)) {
      BranchChanchinCategories.length = 0;
      BranchChanchinCategories.push('All', ...settings.branchChanchinCategories.filter(c => c !== 'All'));
    }
  } catch (err) {
    console.error("Error loading custom BranchChanchinCategories:", err);
  }

  renderCategoryChips();
  setupSearchAndSort();
  setupPreviewModal();

  try {
    const data = await DbService.get('branch-chanchin');
    if (data && Array.isArray(data)) {
      BranchChanchin.length = 0;
      BranchChanchin.push(...data.map(s => {
        if (s.downloadUrl) s.downloadUrl = convertDriveUrl(s.downloadUrl, 'file');
        return s;
      }));
    }
  } catch (error) {
    console.error("Error loading branch-chanchin database:", error);
  }

  renderBranchChanchin();
});

// ========================
// RENDER CATEGORY CHIPS
// ========================
function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  container.innerHTML = BranchChanchinCategories.map(cat => `
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
      currentPage = 1; // Reset to page 1 on filter change
      renderBranchChanchin();
    });
  });
}

// ========================
// SETUP SEARCH AND SORT
// ========================
function setupSearchAndSort() {
  const searchInput = document.getElementById('branch-chanchin-search');
  const sortSelect = document.getElementById('branch-chanchin-sort');
  const clearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        searchQuery = e.target.value;
        currentPage = 1;
        renderBranchChanchin();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      renderBranchChanchin();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderBranchChanchin();
    });
  }
}

// ========================
// RENDER SERMONS LIST
// ========================
function renderBranchChanchin() {
  const listContainer = document.getElementById('branch-chanchin-list');
  const paginationContainer = document.getElementById('pagination-container');
  const countContainer = document.getElementById('branch-chanchin-count');

  if (!listContainer) return;

  // 1. Get filtered items
  const filtered = SearchEngine.filter(BranchChanchin, {
    query: searchQuery,
    category: currentCategory,
    sort: currentSort,
    searchFields: ['title', 'speaker', 'topic', 'description', 'scripture'],
    categoryField: 'topic'
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
        <div class="empty-state-icon">📖</div>
        <h3>No BranchChanchin Found</h3>
        <p>Try adjusting your search or topic filters.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  listContainer.innerHTML = paginationData.items.map(branchChanchin => {
    const safeTitle = (branchChanchin.title || '').replace(/<[^>]*>?/gm, '').trim();
    return `
    <div class="modern-doc-card selectable-item" data-id="${branchChanchin.id}" data-url="${branchChanchin.fileUrl && branchChanchin.fileUrl !== '#' ? branchChanchin.fileUrl : ''}" data-name="${safeTitle}.${String(branchChanchin.fileType||'PDF').toLowerCase()}">
      ${branchChanchin.topic ? `
      <div class="modern-doc-header">
        <span class="modern-doc-badge">${branchChanchin.topic}</span>
      </div>
      ` : ''}
      <div class="modern-doc-content">
        <h3 class="modern-doc-title" title="${safeTitle}">${safeTitle}</h3>
        ${branchChanchin.description ? `<div class="modern-doc-desc">${branchChanchin.description.replace(/<[^>]*>?/gm, '').trim()}</div>` : ''}
        <div class="modern-doc-meta">
          ${branchChanchin.speaker ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${branchChanchin.speaker}</span>` : ''}
          ${branchChanchin.scripture ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> ${branchChanchin.scripture}</span>` : ''}
        </div>
      </div>
    </div>
  `;
  }).join('');

  // Re-run scroll reveal
  setupScrollReveal();

  // Render pagination buttons
  SearchEngine.renderPagination(paginationContainer, paginationData, (newPage) => {
    currentPage = newPage;
    renderBranchChanchin();
    // Scroll smoothly to top of results
    document.getElementById('branch-chanchin-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ========================
// PREVIEW MODAL LOGIC
// ========================
function setupPreviewModal() {
  if (document.getElementById('branch-chanchin-modal')) return;



  const modalMarkup = `
    <div class="modal-backdrop" id="branch-chanchin-modal">
      <div class="modal" style="max-width: 700px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="modal-header">
          <h3 id="modal-branch-chanchin-title" style="margin: 0; font-size: var(--fs-lg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Branch Chanchin Notes</h3>
          <div style="display: flex; gap: var(--sp-2); align-items: center;">
             <a href="#" id="modal-branch-chanchin-download" download style="color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: var(--radius-md); text-decoration: none; transition: all var(--transition-fast);" title="Download" onmouseover="this.style.background='var(--color-bg-hover)'; this.style.color='var(--color-text)'" onmouseout="this.style.background='transparent'; this.style.color='var(--color-text-secondary)'">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             </a>
             <button class="modal-close" id="close-branch-chanchin-modal" aria-label="Close modal">&times;</button>
          </div>
        </div>
        <div class="modal-body" style="flex: 1; overflow-y: auto; padding: var(--sp-5);">
          <div id="modal-branch-chanchin-content" style="line-height: 1.7; font-size: 1.1rem; color: var(--color-text); word-wrap: break-word; text-align: justify; font-family: 'Times New Roman', Times, Arial, serif;"></div>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalMarkup;
  document.body.appendChild(div.firstElementChild);

  const closeBtn = document.getElementById('close-branch-chanchin-modal');
  const closeAction = () => {
    const contentDiv = document.getElementById('modal-branch-chanchin-content');
    if (contentDiv) contentDiv.innerHTML = '';
    ModalSystem.close('branch-chanchin-modal');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeAction);
}

function openPreviewModal(branchChanchinId) {
  const branchChanchin = BranchChanchin.find(s => s.id === branchChanchinId);
  if (!branchChanchin) return;

  const modalTitle = document.getElementById('modal-branch-chanchin-title');
  const modalDownload = document.getElementById('modal-branch-chanchin-download');
  const modalContent = document.getElementById('modal-branch-chanchin-content');

  if (modalTitle) modalTitle.textContent = branchChanchin.title;

  if (modalContent) {
    modalContent.innerHTML = branchChanchin.description || '<p style="text-align: center; color: #777;">No content available.</p>';
  }

  if (modalDownload) modalDownload.style.display = 'none';

  ModalSystem.open('branch-chanchin-modal');
}

// BULK DOWNLOAD LOGIC
// ========================
let branchChanchinSelectionManager = null;

function setupBulkDownload() {
  const selectAllCb = document.getElementById('select-all-cb');
  const btnDownload = document.getElementById('btn-bulk-download');
  const btnSave = document.getElementById('btn-bulk-save');
  const countSpan = document.getElementById('selected-count');
  
  if (!selectAllCb || (!btnDownload && !btnSave)) return;

  branchChanchinSelectionManager = new SelectionManager(
    'branch-chanchin-list',
    '.selectable-item',
    (selectedItems) => {
      countSpan.textContent = selectedItems.size;
      const hasSel = selectedItems.size > 0;
      if (btnDownload) { btnDownload.disabled = !hasSel; btnDownload.style.opacity = hasSel ? '1' : '0.5'; }
      if (btnSave) { btnSave.disabled = !hasSel; btnSave.style.opacity = hasSel ? '1' : '0.5'; }
      
      const totalItems = document.querySelectorAll('#branch-chanchin-list .selectable-item[data-url]:not([data-url=""])').length;
      selectAllCb.checked = (hasSel && selectedItems.size === totalItems && totalItems > 0);
    },
    (id) => {
      openPreviewModal(id);
    }
  );

  // Handle Select All
  selectAllCb.addEventListener('change', (e) => {
    if (e.target.checked) {
      branchChanchinSelectionManager.selectAll();
    } else {
      branchChanchinSelectionManager.clearSelection();
    }
  });

  // Handle Download Button — downloads each file individually
  btnDownload.addEventListener('click', async () => {
    const selectedBranchChanchin = branchChanchinSelectionManager.selectedItems;
    if (selectedBranchChanchin.size === 0) return;
    
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Downloading...';
    btnDownload.disabled = true;
    
    try {
      const files = Array.from(selectedBranchChanchin).map(item => JSON.parse(item));
      
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
      
      branchChanchinSelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  });

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const selectedDocs = branchChanchinSelectionManager.selectedItems;
      if (selectedDocs.size === 0) return;
      
      const originalHtml = btnSave.innerHTML;
      btnSave.innerHTML = '⏳';
      btnSave.disabled = true;
      
      try {
        if (window.SaveService) {
          const selectedNodes = document.querySelectorAll('#branch-chanchin-list .selectable-item.selected');
          const promises = Array.from(selectedNodes).map(node => {
             const id = node.dataset.id;
             const docObj = BranchChanchin.find(d => d.id === id) || { id, fileUrl: node.dataset.url, title: node.dataset.name };
             return SaveService.saveItem('branch-chanchin', docObj.id, {
               title: docObj.title || 'BranchChanchin',
               url: docObj.fileUrl || docObj.url,
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
        branchChanchinSelectionManager.clearSelection();
        selectAllCb.checked = false;
      }
    });
  }
}

// Initialize bulk download when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupBulkDownload, 500); // Wait for initial render
});
