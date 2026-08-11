/* ============================================
   KṬP Saikhamakawn — Hla Lyrics Logic
   Handles filtering by Mizo Alphabet, searching,
   sorting, pagination, and details preview.
   ============================================ */

const mizoAlphabets = ['All', 'A', 'AW', 'B', 'CH', 'D', 'E', 'F', 'G', 'NG', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'Ṭ', 'U', 'V', 'Z'];

let currentAlphabet = 'All';
let searchQuery = '';
let currentSort = 'a-z';
let currentPage = 1;
const itemsPerPage = 1000;
const Lyrics = [];

let dataLoaded = false;

document.addEventListener('DOMContentLoaded', async () => {
  renderAlphabetChips();
  setupSearchAndSort();
  setupPreviewModal();

  // Instant render from localStorage cache
  try {
    const cached = localStorage.getItem('db_lyrics');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        Lyrics.length = 0;
        Lyrics.push(...parsed);
        renderLyrics();
      }
    }
  } catch (e) {}

  try {
    const data = await DbService.get('lyrics');
    if (data && Array.isArray(data)) {
      Lyrics.length = 0;
      Lyrics.push(...data.map(d => {
        if (d.downloadUrl) d.downloadUrl = convertDriveUrl(d.downloadUrl, 'file');
        return d;
      }));
    }
  } catch (error) {
    console.error("Error loading lyrics database:", error);
  } finally {
    dataLoaded = true;
  }

  renderLyrics();

  // Check URL params for deep linking (SEO & Sharing)
  const urlParams = new URLSearchParams(window.location.search);
  const targetSong = urlParams.get('song') || urlParams.get('title') || urlParams.get('id');
  if (targetSong) {
    const cleanTarget = targetSong.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = Lyrics.find(d => {
      if (d.id === targetSong) return true;
      const cleanTitle = (d.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanTitle.includes(cleanTarget) || cleanTarget.includes(cleanTitle);
    });
    if (found) {
      document.title = `${found.title} — Mizo Hla Lyrics | KṬP Saikhamakawn`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && found.lyrics) {
        metaDesc.setAttribute('content', `${found.title} Mizo Hla Lyrics: ${found.lyrics.substring(0, 150).replace(/[\r\n]+/g, ' ')}...`);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', `${found.title} — Mizo Hla Lyrics`);
      setTimeout(() => openPreviewModal(found.id), 300);
    }
  }
});

function createSongSlug(title) {
  if (!title) return '';
  return title.toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ========================
// RENDER ALPHABET CHIPS
// ========================
function renderAlphabetChips() {
  const select = document.getElementById('alphabet-select');
  if (!select) return;

  select.innerHTML = mizoAlphabets.map(alpha => `
    <option value="${alpha}" ${alpha === currentAlphabet ? 'selected' : ''}>
      ${alpha === 'All' ? 'All' : alpha}
    </option>
  `).join('');

  // Add change event
  select.addEventListener('change', (e) => {
    currentAlphabet = e.target.value;
    currentPage = 1; // Reset to page 1 on filter change
    renderLyrics();
  });
}

// ========================
// SETUP SEARCH AND SORT
// ========================
function setupSearchAndSort() {
  const searchInput = document.getElementById('doc-search');
  const sortSelect = document.getElementById('lyric-sort');
  const clearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        searchQuery = e.target.value;
        currentPage = 1;
        renderLyrics();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      renderLyrics();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderLyrics();
    });
  }
}

// ========================
// RENDER LYRICS LIST
// ========================
function renderLyrics() {
  const listContainer = document.getElementById('lyrics-list');
  const paginationContainer = document.getElementById('pagination-container');
  const countContainer = document.getElementById('doc-count');

  if (!listContainer) return;

  let filtered = [...Lyrics];

  // 1. Filter by Alphabet
  if (currentAlphabet !== 'All') {
    filtered = filtered.filter(lyric => {
      // Strip any leading numbers, spaces, or punctuation so "1. Pathian Hla" becomes "PATHIAN HLA"
      const cleanTitle = (lyric.title || '').trim().toUpperCase().replace(/^[^A-ZṬ]+/, '');
      if (currentAlphabet === 'AW') {
        return cleanTitle.startsWith('AW');
      } else if (currentAlphabet === 'A') {
        return cleanTitle.startsWith('A') && !cleanTitle.startsWith('AW');
      } else if (currentAlphabet === 'CH') {
        return cleanTitle.startsWith('CH');
      } else if (currentAlphabet === 'NG') {
        return cleanTitle.startsWith('NG');
      } else if (currentAlphabet === 'N') {
        return cleanTitle.startsWith('N') && !cleanTitle.startsWith('NG');
      } else {
        return cleanTitle.startsWith(currentAlphabet);
      }
    });
  }

  // 2. Filter by Search Query
  if (searchQuery && searchQuery.trim() !== '') {
    const terms = searchQuery.toLowerCase().trim().split(/\s+/);
    filtered = filtered.filter(lyric => {
      const title = (lyric.title || '').toLowerCase();
      const desc = (lyric.description || '').toLowerCase();
      return terms.every(term => title.includes(term) || desc.includes(term));
    });
  }

  // 3. Sort
  const mizoSortStr = (str) => {
    if (!str) return '';
    return String(str).toUpperCase()
      .replace(/AW/g, 'A~')
      .replace(/CH/g, 'C~')
      .replace(/NG/g, 'G~')
      .replace(/Ṭ/g, 'T~');
  };

  if (currentSort === 'a-z') {
    filtered.sort((a, b) => mizoSortStr(a.title).localeCompare(mizoSortStr(b.title)));
  } else if (currentSort === 'z-a') {
    filtered.sort((a, b) => mizoSortStr(b.title).localeCompare(mizoSortStr(a.title)));
  } else if (currentSort === 'newest') {
    filtered.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
  } else if (currentSort === 'oldest') {
    filtered.sort((a,b) => new Date(a.date||0) - new Date(b.date||0));
  }

  // 4. Paginate items
  const paginationData = SearchEngine.paginate(filtered, currentPage, itemsPerPage);

  // Update results count
  SearchEngine.renderResultsInfo(countContainer, {
    totalItems: filtered.length,
    currentPage: paginationData.currentPage,
    perPage: itemsPerPage
  });

  // 5. Render items
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
          <div class="empty-state-icon">🎵</div>
          <h3>No Lyrics Found</h3>
          <p>Try adjusting your search or alphabet filter.</p>
        </div>
      `;
    }
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  listContainer.innerHTML = paginationData.items.map(doc => `
    <div class="doc-card selectable-item" data-id="${doc.id}" data-url="${doc.downloadUrl && doc.downloadUrl !== '#' ? doc.downloadUrl : ''}" data-name="${doc.title}.${(doc.fileType||'PDF').toLowerCase()}" style="position: relative; align-items: center; padding: 10px 14px; min-height: auto; gap: 12px; display: flex;">
      
      <div class="file-icon" style="font-size: 1.1rem; width: 34px; height: 34px; background: rgba(135, 206, 235, 0.15); color: var(--brand-sky); display: flex; align-items: center; justify-content: center; border-radius: 8px; flex-shrink: 0;">🎵</div>
      <div class="doc-card-content" style="flex: 1; min-width: 0;">
        <h3 class="doc-card-title" style="margin-bottom: 0; font-size: 0.95rem; line-height: 1.3; font-weight: 500; word-wrap: break-word;">${doc.title}</h3>
      </div>
    </div>
  `).join('');

  // Re-run scroll reveal
  setupScrollReveal();

  // Render pagination buttons
  SearchEngine.renderPagination(paginationContainer, paginationData, (newPage) => {
    currentPage = newPage;
    renderLyrics();
    // Scroll smoothly to top of results
    document.getElementById('lyrics-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <h3 id="modal-doc-title" style="color: white; margin: 0; font-size: 1.2rem; font-weight: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Lyric</h3>
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

  const originalTitle = document.title;
  const closeBtn = document.getElementById('close-doc-modal');
  const closeAction = () => {
    const iframe = document.getElementById('modal-doc-iframe');
    if (iframe) iframe.src = '';
    ModalSystem.close('doc-modal');
    document.title = originalTitle;
    try {
      history.pushState(null, '', window.location.pathname);
    } catch(e) {}
  };

  if (closeBtn) closeBtn.addEventListener('click', closeAction);
}

function openPreviewModal(docId) {
  const doc = Lyrics.find(d => d.id === docId);
  if (!doc) return;

  const modalTitle = document.getElementById('modal-doc-title');
  const modalDownload = document.getElementById('modal-doc-download');
  const modalIframe = document.getElementById('modal-doc-iframe');

  if (modalTitle) modalTitle.textContent = doc.title;

  // Update Page Title and URL for Google SEO & Direct Link Sharing
  if (doc.title) {
    document.title = `${doc.title} Lyrics — KṬP Saikhamakawn`;
    try {
      const slug = createSongSlug(doc.title);
      const newUrl = `${window.location.pathname}?song=${encodeURIComponent(slug)}`;
      history.pushState({ docId: doc.id }, '', newUrl);
    } catch(e) {}
  }

  let fileId = '';
  if (doc.downloadUrl && doc.downloadUrl !== '#') {
    const fileIdMatch = doc.downloadUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    } else {
      const idMatch = doc.downloadUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) fileId = idMatch[1];
    }
  }

  if (modalIframe) {
    if (fileId) {
      modalIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (doc.downloadUrl && doc.downloadUrl !== '#') {
      modalIframe.src = doc.downloadUrl;
    } else {
      modalIframe.src = 'about:blank';
    }
  }

  if (modalDownload) {
    if (doc.downloadUrl && doc.downloadUrl !== '#') {
      modalDownload.style.display = 'flex';
      modalDownload.href = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : doc.downloadUrl;
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
let lyricSelectionManager = null;

function setupBulkDownload() {
  const selectAllCb = document.getElementById('select-all-cb');
  const btnDownload = document.getElementById('btn-bulk-download');
  const btnSave = document.getElementById('btn-bulk-save');
  const countSpan = document.getElementById('selected-count');
  
  if (!selectAllCb || (!btnDownload && !btnSave)) return;

  lyricSelectionManager = new SelectionManager(
    'lyrics-list',
    '.selectable-item',
    (selectedItems) => {
      countSpan.textContent = selectedItems.size;
      const hasSel = selectedItems.size > 0;
      if (btnDownload) { btnDownload.disabled = !hasSel; btnDownload.style.opacity = hasSel ? '1' : '0.5'; }
      if (btnSave) { btnSave.disabled = !hasSel; btnSave.style.opacity = hasSel ? '1' : '0.5'; }
      
      const totalItems = document.querySelectorAll('#lyrics-list .selectable-item[data-url]:not([data-url=""])').length;
      selectAllCb.checked = (hasSel && selectedItems.size === totalItems && totalItems > 0);
    },
    (id) => {
      openPreviewModal(id);
    }
  );

  // Handle Select All
  selectAllCb.addEventListener('change', (e) => {
    if (e.target.checked) {
      lyricSelectionManager.selectAll();
    } else {
      lyricSelectionManager.clearSelection();
    }
  });

  // Handle Download Button — downloads each file individually
  btnDownload.addEventListener('click', async () => {
    const selectedDocs = lyricSelectionManager.selectedItems;
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
      
      lyricSelectionManager.clearSelection();
      selectAllCb.checked = false;
    }
  });

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const selectedDocs = lyricSelectionManager.selectedItems;
      if (selectedDocs.size === 0) return;
      
      const originalHtml = btnSave.innerHTML;
      btnSave.innerHTML = '⏳';
      btnSave.disabled = true;
      
      try {
        if (window.SaveService) {
          const selectedNodes = document.querySelectorAll('#lyrics-list .selectable-item.selected');
          const promises = Array.from(selectedNodes).map(node => {
             const id = node.dataset.id;
             const docObj = Lyrics.find(d => d.id === id) || { id, downloadUrl: node.dataset.url, title: node.dataset.name };
             return SaveService.saveItem('lyrics', docObj.id, {
               title: docObj.title || 'Lyric',
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
        lyricSelectionManager.clearSelection();
        selectAllCb.checked = false;
      }
    });
  }
}

// Initialize bulk download when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupBulkDownload, 500); // Wait for initial render
});
