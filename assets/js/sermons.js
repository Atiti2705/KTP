/* ============================================
   KṬP Saikhamakawn — Sermons Page Logic
   Handles filtering, sorting, pagination,
   and reading notes preview modal.
   ============================================ */

let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'manual';
let currentPage = 1;
const itemsPerPage = 1000;

let dataLoaded = false;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await DbService.get('settings');
    if (settings && settings.sermonCategories && Array.isArray(settings.sermonCategories)) {
      SermonCategories.length = 0;
      SermonCategories.push('All', ...settings.sermonCategories.filter(c => c !== 'All'));
    }
  } catch (err) {
    console.error("Error loading custom SermonCategories:", err);
  }

  renderCategoryChips();
  setupSearchAndSort();
  setupPreviewModal();

  try {
    const data = await DbService.get('sermons');
    if (data && Array.isArray(data)) {
      Sermons.length = 0;
      Sermons.push(...data.map(s => {
        if (s.downloadUrl) s.downloadUrl = convertDriveUrl(s.downloadUrl, 'file');
        return s;
      }));
    }
  } catch (error) {
    console.error("Error loading sermons database:", error);
  } finally {
    dataLoaded = true;
  }

  renderSermons();
});

// ========================
// RENDER CATEGORY CHIPS
// ========================
function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  container.innerHTML = SermonCategories.map(cat => `
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
      renderSermons();
    });
  });
}

// ========================
// SETUP SEARCH AND SORT
// ========================
function setupSearchAndSort() {
  const searchInput = document.getElementById('sermon-search');
  const sortSelect = document.getElementById('sermon-sort');
  const clearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        searchQuery = e.target.value;
        currentPage = 1;
        renderSermons();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      renderSermons();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderSermons();
    });
  }
}

// ========================
// RENDER SERMONS LIST
// ========================
function renderSermons() {
  const listContainer = document.getElementById('sermons-list');
  const paginationContainer = document.getElementById('pagination-container');
  const countContainer = document.getElementById('sermon-count');

  if (!listContainer) return;

  // 1. Get filtered items
  const filtered = SearchEngine.filter(Sermons, {
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
          <div class="empty-state-icon">📖</div>
          <h3>No Sermons Found</h3>
          <p>Try adjusting your search or topic filters.</p>
        </div>
      `;
    }
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  listContainer.innerHTML = paginationData.items.map(sermon => {
    const safeTitle = (sermon.title || '').replace(/<[^>]*>?/gm, '').trim();
    
    // Format date nicely if available
    let dateStr = '';
    if (sermon.date) {
      try {
        const d = new Date(sermon.date);
        if (!isNaN(d)) {
          // Use standard short format or timeAgo if available
          dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          if (typeof timeAgo === 'function') dateStr = timeAgo(sermon.date); // fallback
        }
      } catch (e) {}
    }
    
    let fileId = '';
    const downloadUrl = sermon.fileUrl;
    if (downloadUrl && downloadUrl !== '#') {
      const fileIdMatch = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        fileId = fileIdMatch[1];
      } else {
        const idMatch = downloadUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) fileId = idMatch[1];
      }
    }
    
    let thumbHtml = '📖';
    if (fileId) {
      thumbHtml = `<img loading="lazy" src="https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
    }
    
    return `
    <div class="modern-doc-card selectable-item" data-id="${sermon.id}" data-url="${sermon.fileUrl && sermon.fileUrl !== '#' ? sermon.fileUrl : ''}" data-name="${safeTitle}.${String(sermon.fileType||'PDF').toLowerCase()}">
      <div class="modern-doc-image">
        ${thumbHtml}
      </div>
      <div class="modern-doc-content">
        ${sermon.topic ? `
        <div class="modern-doc-header">
          <span class="modern-doc-badge">${sermon.topic}</span>
        </div>
        ` : ''}
        <h3 class="modern-doc-title" title="${safeTitle}">${safeTitle}</h3>
        ${sermon.description ? `<div class="modern-doc-desc">${sermon.description.replace(/<[^>]*>?/gm, '').trim()}</div>` : ''}
        <div class="modern-doc-meta">
          ${sermon.speaker ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${sermon.speaker}</span>` : ''}
          ${dateStr ? `<span><span class="dot">●</span> ${dateStr}</span>` : ''}
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
    renderSermons();
    // Scroll smoothly to top of results
    document.getElementById('sermons-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ========================
// PREVIEW MODAL LOGIC
// ========================
function setupPreviewModal() {
  if (document.getElementById('sermon-modal')) return;

  const modalMarkup = `
    <div class="modal-backdrop lightbox-modal" id="sermon-modal" style="background: rgba(0,0,0,0.95); padding: 0;">
      <div style="position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; padding: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(0,0,0,0.5); z-index: 10;">
          <h3 id="modal-sermon-title" style="color: white; margin: 0; font-size: 1.2rem; font-weight: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Sermon Notes</h3>
          <div style="display: flex; gap: 16px; align-items: center;">
             <a href="#" id="modal-sermon-download" download style="color: white; text-decoration: none; display: flex; align-items: center; gap: 8px;" title="Download">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             </a>
             <button id="close-sermon-modal" aria-label="Close" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        </div>
        <div style="flex: 1; position: relative; width: 100%; height: 100%; background: #fff; -webkit-overflow-scrolling: touch; overflow: auto;">
          <iframe id="modal-sermon-iframe" src="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalMarkup;
  document.body.appendChild(div.firstElementChild);

  const closeBtn = document.getElementById('close-sermon-modal');
  const closeAction = () => {
    const iframe = document.getElementById('modal-sermon-iframe');
    if (iframe) iframe.src = '';
    ModalSystem.close('sermon-modal');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeAction);
}

function openPreviewModal(sermonId) {
  const sermon = Sermons.find(s => s.id === sermonId);
  if (!sermon) return;

  const modalTitle = document.getElementById('modal-sermon-title');
  const modalDownload = document.getElementById('modal-sermon-download');
  const modalIframe = document.getElementById('modal-sermon-iframe');

  if (modalTitle) modalTitle.textContent = sermon.title;

  let fileId = '';
  const downloadUrl = sermon.downloadUrl || sermon.fileUrl;
  
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
        Toast.show(`Downloading ${sermon.title}...`, 'success');
      };
    } else {
      modalDownload.style.display = 'flex';
      modalDownload.href = '#';
      modalDownload.removeAttribute('target');
      modalDownload.onclick = (e) => {
        e.preventDefault();
        Toast.show(`Downloading notes: ${sermon.title} (Simulated)...`, 'success');
      };
    }
  }

  ModalSystem.open('sermon-modal');
}

// BULK DOWNLOAD LOGIC
// ========================
let sermonSelectionManager = null;

function setupBulkDownload() {
  const selectAllCb = document.getElementById('select-all-cb');
  const btnDownload = document.getElementById('btn-bulk-download');
  const btnSave = document.getElementById('btn-bulk-save');
  const countSpan = document.getElementById('selected-count');
  
  if (!selectAllCb || (!btnDownload && !btnSave)) return;

  sermonSelectionManager = new SelectionManager(
    'sermons-list',
    '.selectable-item',
    (selectedItems) => {
      countSpan.textContent = selectedItems.size;
      const hasSel = selectedItems.size > 0;
      if (btnDownload) { btnDownload.disabled = !hasSel; btnDownload.style.opacity = hasSel ? '1' : '0.5'; }
      if (btnSave) { btnSave.disabled = !hasSel; btnSave.style.opacity = hasSel ? '1' : '0.5'; }
      
      const totalItems = document.querySelectorAll('#sermons-list .selectable-item[data-url]:not([data-url=""])').length;
      selectAllCb.checked = (hasSel && selectedItems.size === totalItems && totalItems > 0);
    },
    (id) => {
      openPreviewModal(id);
    }
  );

  // Handle Select All
  selectAllCb.addEventListener('change', (e) => {
    if (e.target.checked) {
      sermonSelectionManager.selectAll();
    } else {
      sermonSelectionManager.clearSelection();
    }
  });

  // Handle Download Button — downloads each file individually
  btnDownload.addEventListener('click', async () => {
    const selectedSermons = sermonSelectionManager.selectedItems;
    if (selectedSermons.size === 0) return;
    
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Downloading...';
    btnDownload.disabled = true;
    
    try {
      const files = Array.from(selectedSermons).map(item => JSON.parse(item));
      
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
      
      sermonSelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  });

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const selectedDocs = sermonSelectionManager.selectedItems;
      if (selectedDocs.size === 0) return;
      
      const originalHtml = btnSave.innerHTML;
      btnSave.innerHTML = '⏳';
      btnSave.disabled = true;
      
      try {
        if (window.SaveService) {
          const selectedNodes = document.querySelectorAll('#sermons-list .selectable-item.selected');
          const promises = Array.from(selectedNodes).map(node => {
             const id = node.dataset.id;
             const docObj = Sermons.find(d => d.id === id) || { id, fileUrl: node.dataset.url, title: node.dataset.name };
             return SaveService.saveItem('sermons', docObj.id, {
               title: docObj.title || 'Sermon',
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
        sermonSelectionManager.clearSelection();
        selectAllCb.checked = false;
      }
    });
  }
}

// Initialize bulk download when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupBulkDownload, 500); // Wait for initial render
});
