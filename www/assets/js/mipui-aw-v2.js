/* ============================================
   KṬP Saikhamakawn — Mipui Aw Feed Logic
   Renders Mipui Aw documents as Instagram-style posts.
   ============================================ */

let currentCategory = 'All';
let currentSubCategory = 'All';
let searchQuery = '';
let currentSort = 'newest';
let currentPage = 1;
const itemsPerPage = 15;

const MipuiAwList = [];

// Helper to extract year from Mipui Aw titles
function getYear(d) {
  if (d.title && typeof d.title === 'string') {
    const parts = d.title.split('.');
    if (parts.length > 1) {
      let yr = parts[parts.length - 1].trim().replace(/[^0-9]/g, '');
      if (yr.length === 2) yr = "20" + yr;
      if (yr.length === 4) return yr;
    }
    const match = d.title.match(/(20\d{2})/);
    if (match) return match[1];
  }
  return d.date ? new Date(d.date).getFullYear().toString() : "Unknown";
}

function getMonthName(d) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (d.title && typeof d.title === 'string') {
    for (let m of monthNames) {
      if (d.title.toLowerCase().includes(m.toLowerCase())) return m;
    }
    const parts = d.title.split('.');
    if (parts.length > 1) {
      let mIndex = parseInt(parts[1].trim());
      if (!isNaN(mIndex) && mIndex >= 1 && mIndex <= 12) {
        return monthNames[mIndex - 1];
      }
    }
  }
  if (d.date) {
    const dt = new Date(d.date);
    if (!isNaN(dt.getTime())) return monthNames[dt.getMonth()];
  }
  return "Unknown";
}

document.addEventListener('DOMContentLoaded', async () => {
  setupSearchAndSort();
  setupPreviewModal();
  setupBulkDownload();

  try {
    const data = await DbService.get('mipuiaw');
    if (data && Array.isArray(data)) {
      MipuiAwList.push(...data.map(d => {
        if (d.downloadUrl && typeof convertDriveUrl === 'function') {
          d.downloadUrl = convertDriveUrl(d.downloadUrl, 'file');
        }
        return d;
      }));
    }
  } catch (error) {
    console.error("Error loading Mipui Aw database:", error);
  }

  // Populate dynamic categories (Years)
  const years = new Set();
  MipuiAwList.forEach(d => {
    const y = getYear(d);
    if (y !== "Unknown") years.add(y);
  });
  const sortedYears = Array.from(years).sort((a,b) => b.localeCompare(a));
  
  const chipsContainer = document.getElementById('category-chips');
  if (chipsContainer) {
    chipsContainer.innerHTML = `<button class="filter-chip active" data-category="All">All</button>` + 
      sortedYears.map(y => `<button class="filter-chip" data-category="${y}">${y}</button>`).join('');
    
    chipsContainer.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        currentPage = 1;
        renderFeed();
      });
    });
  }

  // Populate dynamic subcategories (Months)
  const months = new Set();
  MipuiAwList.forEach(d => {
    const m = getMonthName(d);
    if (m !== "Unknown") months.add(m);
  });
  const monthOrder = { "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6, "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12 };
  const sortedMonths = Array.from(months).sort((a,b) => monthOrder[a] - monthOrder[b]);
  
  const subChipsContainer = document.getElementById('subcategory-chips');
  if (subChipsContainer) {
    subChipsContainer.innerHTML = `<button class="subfilter-chip active" data-subcategory="All">All</button>` + 
      sortedMonths.map(m => `<button class="subfilter-chip" data-subcategory="${m}">${m}</button>`).join('');
      
    subChipsContainer.querySelectorAll('.subfilter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        subChipsContainer.querySelectorAll('.subfilter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSubCategory = btn.dataset.subcategory;
        currentPage = 1;
        renderFeed();
      });
    });
  }

  renderFeed();
});

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
        renderFeed();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      renderFeed();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderFeed();
    });
  }
}

function renderFeed() {
  const listContainer = document.getElementById('documents-list');
  const paginationContainer = document.getElementById('pagination-container');
  const countContainer = document.getElementById('doc-count');

  if (!listContainer) return;

  // Filter items
  let filtered = MipuiAwList;
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(d => (d.title || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q));
  }
  
  if (currentCategory !== 'All') {
    filtered = filtered.filter(d => getYear(d) === currentCategory);
  }
  
  if (currentSubCategory !== 'All') {
    filtered = filtered.filter(d => getMonthName(d) === currentSubCategory);
  }
  
  if (currentSort === 'newest') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (currentSort === 'oldest') {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (currentSort === 'a-z') {
    filtered.sort((a, b) => (a.title||'').localeCompare(b.title||''));
  } else if (currentSort === 'z-a') {
    filtered.sort((a, b) => (b.title||'').localeCompare(a.title||''));
  }

  // Paginate items
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const items = filtered.slice(startIndex, endIndex);

  // Update results count
  if (countContainer) {
    countContainer.textContent = totalItems === 0 ? 'No Mipui Aw found' : `Showing ${startIndex + 1}–${endIndex} of ${totalItems}`;
  }

  if (items.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state" style="width: 100%;">
        <div class="empty-state-icon">📄</div>
        <h3>No Mipui Aw Found</h3>
        <p>Try adjusting your search or category filters.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Remove Instagram feed style overrides
  listContainer.style.gridTemplateColumns = '';
  listContainer.style.maxWidth = '';
  listContainer.style.margin = '';

  listContainer.innerHTML = items.map(doc => {
    return `
    <div class="modern-doc-card selectable-item" data-id="${doc.id}" data-url="${doc.downloadUrl && doc.downloadUrl !== '#' ? doc.downloadUrl : ''}" data-name="${doc.title}.pdf">
      <div class="modern-doc-icon">PDF</div>
      <div class="modern-doc-content" style="display: flex; align-items: center; min-height: 40px;">
        <h3 class="modern-doc-title" style="margin: 0;">${doc.title}</h3>
      </div>
      <div class="modern-doc-action">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
      </div>
    </div>
    `;
  }).join('');

  // Render pagination buttons
  if (paginationContainer) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    let html = `<button class="btn-page ${currentPage === 1 ? 'disabled' : ''}" onclick="changePage(${currentPage - 1})">&laquo; Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="btn-page ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span style="color: var(--color-text-tertiary);">...</span>`;
      }
    }
    html += `<button class="btn-page ${currentPage === totalPages ? 'disabled' : ''}" onclick="changePage(${currentPage + 1})">Next &raquo;</button>`;
    paginationContainer.innerHTML = html;
  }
}

window.changePage = function(newPage) {
  currentPage = newPage;
  renderFeed();
  document.getElementById('documents-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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
             <button id="modal-doc-save" aria-label="Save" title="Save Document" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
               <svg id="modal-doc-save-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
             </button>
             <a href="#" id="modal-doc-download" download style="color: white; text-decoration: none; display: flex; align-items: center; gap: 8px;" title="Download">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             </a>
             <button id="close-doc-modal" aria-label="Close" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        </div>
        <div style="flex: 1; position: relative; width: 100%; height: 100%; background: #fff;">
          <iframe id="modal-doc-iframe" src="" style="width: 100%; height: 100%; border: none;"></iframe>
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
  const doc = MipuiAwList.find(d => d.id === docId);
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
      modalDownload.onclick = async (e) => {
        if (window.Capacitor && window.Capacitor.isNativePlatform() && window.NativeDownload) {
          e.preventDefault();
          await window.NativeDownload(modalDownload.href, `${doc.title}.pdf`);
        } else {
          Toast.show(`Downloading ${doc.title}...`, 'success');
        }
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

  const saveBtn = document.getElementById('modal-doc-save');
  const saveIcon = document.getElementById('modal-doc-save-icon');
  if (saveBtn && window.SaveService) {
    const isSaved = SaveService.isSaved('mipuiaw', doc.id);
    if (isSaved) {
      saveIcon.setAttribute('fill', 'currentColor');
    } else {
      saveIcon.setAttribute('fill', 'none');
    }
    
    // Remove old listeners to prevent duplicates
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    newSaveBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const currentlySaved = SaveService.isSaved('mipuiaw', doc.id);
      const icon = document.getElementById('modal-doc-save-icon');
      if (currentlySaved) {
        await SaveService.unsaveItem('mipuiaw', doc.id);
        if(window.Toast) Toast.show('Mipui Aw removed from saved', 'success');
        icon.setAttribute('fill', 'none');
      } else {
        await SaveService.saveItem('mipuiaw', doc.id, {
          title: doc.title || 'Mipui Aw',
          url: downloadUrl,
          date: doc.date || new Date().toISOString()
        });
        if(window.Toast) Toast.show('Mipui Aw saved!', 'success');
        icon.setAttribute('fill', 'currentColor');
      }
    });
  }

  ModalSystem.open('doc-modal');
}

// ========================
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

  // Handle Download Selected
  if (btnDownload) {
    btnDownload.addEventListener('click', async () => {
      const selectedIds = Array.from(docSelectionManager.getSelected());
      if (selectedIds.length === 0) return;
      
      const originalText = btnDownload.innerHTML;
      btnDownload.innerHTML = '⏳ Downloading...';
      btnDownload.disabled = true;
      
      try {
        let delay = 0;
        for (let i = 0; i < selectedIds.length; i++) {
          const id = selectedIds[i];
          const doc = MipuiAwList.find(d => d.id === id);
          if (doc && doc.downloadUrl && doc.downloadUrl !== '#') {
            let dlUrl = doc.downloadUrl;
            let fileId = '';
            const fileIdMatch = dlUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
              fileId = fileIdMatch[1];
            } else {
              const idMatch = dlUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
              if (idMatch && idMatch[1]) fileId = idMatch[1];
            }
            if (fileId) {
              dlUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
            
            if (window.Capacitor && window.Capacitor.isNativePlatform() && window.NativeDownload) {
              await window.NativeDownload(dlUrl, `${doc.title}.pdf`);
              if (i < selectedIds.length - 1) await new Promise(r => setTimeout(r, 1000));
            } else {
              const a = document.createElement('a');
              a.href = dlUrl;
              a.download = doc.title;
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              if (i < selectedIds.length - 1) await new Promise(r => setTimeout(r, 500));
            }
          }
        }
        if (window.Toast) Toast.show(`Downloaded ${selectedIds.length} Mipui Aw!`, 'success');
      } catch (err) {
        console.error("Error downloading files:", err);
      } finally {
        btnDownload.innerHTML = originalText;
        btnDownload.disabled = false;
        docSelectionManager.clearSelection();
        if (selectAllCb) selectAllCb.checked = false;
      }
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const selectedIds = Array.from(docSelectionManager.getSelected());
      if (selectedIds.length === 0) return;
      
      const originalHtml = btnSave.innerHTML;
      btnSave.innerHTML = '⏳';
      btnSave.disabled = true;
      
      try {
        if (window.SaveService) {
          const promises = selectedIds.map(id => {
             const docObj = MipuiAwList.find(d => d.id === id);
             if (!docObj) return Promise.resolve();
             return SaveService.saveItem('mipuiaw', docObj.id, {
               title: docObj.title || 'Mipui Aw',
               url: docObj.downloadUrl || docObj.fileUrl || '',
               date: docObj.date || new Date().toISOString()
             });
          });
          await Promise.all(promises);
          if(window.Toast) Toast.show(`Saved ${selectedIds.length} items!`, 'success');
        }
      } catch (err) {
        console.error("Bulk save error:", err);
      } finally {
        btnSave.innerHTML = originalHtml;
        btnSave.disabled = false;
        docSelectionManager.clearSelection();
        if (selectAllCb) selectAllCb.checked = false;
      }
    });
  }
}
