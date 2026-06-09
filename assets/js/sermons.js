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
    listContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
        <div class="empty-state-icon">📖</div>
        <h3>No Sermons Found</h3>
        <p>Try adjusting your search or topic filters.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  listContainer.innerHTML = paginationData.items.map(sermon => `
    <div class="modern-doc-card reveal selectable-item" data-id="${sermon.id}" data-url="${sermon.fileUrl && sermon.fileUrl !== '#' ? sermon.fileUrl : ''}" data-name="${sermon.title}.${String(sermon.fileType||'PDF').toLowerCase()}">
      <div class="modern-doc-icon">📖</div>
      <div class="modern-doc-content" style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
        <h3 class="modern-doc-title" style="margin-bottom: 4px;">${sermon.title}</h3>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          ${sermon.speaker ? `<span style="font-size: 0.75rem; color: var(--color-text-secondary);">🎙️ ${sermon.speaker}</span>` : ''}
          ${sermon.scripture ? `<span style="font-size: 0.75rem; color: var(--color-text-secondary);">📖 ${sermon.scripture}</span>` : ''}
          ${sermon.description ? `<span style="font-size: 0.75rem; color: var(--color-text-tertiary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px;">📝 ${sermon.description}</span>` : ''}
        </div>
      </div>
      <div class="modern-doc-action">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
      </div>
    </div>
  `).join('');

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
        <div style="flex: 1; position: relative; width: 100%; height: 100%; background: #fff;">
          <iframe id="modal-sermon-iframe" src="" style="width: 100%; height: 100%; border: none;"></iframe>
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

  // Handle Download Button
  btnDownload.addEventListener('click', async () => {
    const selectedSermons = sermonSelectionManager.selectedItems;
    if (selectedSermons.size === 0) return;
    
    const originalText = btnDownload.innerHTML;
    btnDownload.innerHTML = '⏳ Zipping...';
    btnDownload.disabled = true;
    
    try {
      const zip = new JSZip();
      const files = Array.from(selectedSermons).map(item => JSON.parse(item));
      
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
      saveAs(content, 'KTP_Sermons.zip');
      
    } catch (err) {
      console.error("Error creating zip:", err);
      alert("Failed to create zip file. Please try downloading files individually.");
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
          selectedNodes.forEach(node => {
             const id = node.dataset.id;
             const docObj = Sermons.find(d => d.id === id) || { id, fileUrl: node.dataset.url, title: node.dataset.name };
             SaveService.saveItem('sermons', docObj.id, {
               title: docObj.title || 'Sermon',
               url: docObj.fileUrl || docObj.url,
               date: docObj.date || new Date().toISOString()
             });
          });
          if(window.Toast) Toast.show(`Saved ${selectedNodes.length} items!`, 'success');
        }
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
