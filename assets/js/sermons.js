/* ============================================
   KṬP Saikhamakawn — Sermons Page Logic
   Handles filtering, sorting, pagination,
   and reading notes preview modal.
   ============================================ */

let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'newest';
let currentPage = 1;
const itemsPerPage = 8;

document.addEventListener('DOMContentLoaded', async () => {
  renderCategoryChips();
  setupSearchAndSort();
  setupPreviewModal();

  try {
    const data = await DbService.get('sermons');
    if (data && Array.isArray(data)) {
      Sermons.length = 0;
      Sermons.push(...data);
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
    <div class="doc-card reveal">
      <div class="file-icon file-icon-${sermon.fileType.toLowerCase()}">${sermon.fileType}</div>
      <div class="doc-card-content">
        <h3 class="doc-card-title">${sermon.title}</h3>
        <p class="doc-card-desc">${sermon.description}</p>
        <div class="doc-card-meta">
          <span>🎙️ ${sermon.speaker}</span>
          <span>📖 ${sermon.scripture}</span>
          <span>📅 ${formatDate(sermon.date)}</span>
          <span class="badge badge-gold" style="padding: 2px 8px;">${sermon.topic}</span>
        </div>
      </div>
      <div class="doc-card-actions">
        <button class="btn btn-outline btn-sm read-btn" data-id="${sermon.id}">📖 Read Notes</button>
        <button class="btn btn-primary btn-sm download-btn" data-id="${sermon.id}">⬇️ Download</button>
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

  // Attach click handlers
  listContainer.querySelectorAll('.read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openPreviewModal(btn.dataset.id);
    });
  });

  listContainer.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sermon = Sermons.find(s => s.id === btn.dataset.id);
      if (sermon) {
        Toast.show(`Downloading ${sermon.title}...`, 'success');
      }
    });
  });
}

// ========================
// PREVIEW MODAL LOGIC
// ========================
function setupPreviewModal() {
  if (document.getElementById('sermon-modal')) return;

  const modalMarkup = `
    <div class="modal-backdrop" id="sermon-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 id="modal-sermon-title">Sermon Notes</h3>
          <button class="modal-close" id="close-sermon-modal" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-4); flex-wrap: wrap; gap: var(--sp-2);">
            <div>
              <span style="color: var(--color-text-secondary); font-size: var(--fs-xs);">SPEAKER</span>
              <h4 id="modal-sermon-speaker" style="font-size: var(--fs-md); font-weight: var(--fw-semibold); color: var(--color-text);"></h4>
            </div>
            <span class="badge badge-gold" id="modal-sermon-topic" style="align-self: center;"></span>
          </div>

          <div style="padding: var(--sp-4); background: rgba(220, 20, 60, 0.05); border-radius: var(--radius-lg); border: 1px dashed rgba(220, 20, 60, 0.2); margin-bottom: var(--sp-4);">
            <p style="font-weight: var(--fw-semibold); margin-bottom: var(--sp-1); font-size: var(--fs-xs); text-transform: uppercase; color: var(--brand-red);">Scripture Reading</p>
            <p id="modal-sermon-scripture" style="font-family: var(--font-heading); font-weight: var(--fw-bold); font-size: var(--fs-md); color: var(--color-text);"></p>
          </div>

          <div style="padding: var(--sp-4); background: var(--color-bg-alt); border-radius: var(--radius-lg); border: 1px solid var(--color-border); margin-bottom: var(--sp-4);">
            <p style="font-weight: var(--fw-semibold); margin-bottom: var(--sp-2); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Summary & Main Points</p>
            <p id="modal-sermon-desc" style="color: var(--color-text-secondary); font-size: var(--fs-sm); line-height: var(--lh-relaxed); white-space: pre-line;"></p>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: var(--fs-xs); color: var(--color-text-tertiary); padding: var(--sp-1);">
            <span>📅 Published: <strong id="modal-sermon-date"></strong></span>
            <span>📁 Format: <strong id="modal-sermon-type"></strong></span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-close-sermon-footer">Close</button>
          <a href="#" class="btn btn-primary" id="modal-sermon-download" download>⬇ Download Sermon Notes</a>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalMarkup;
  document.body.appendChild(div.firstElementChild);

  const closeBtn = document.getElementById('close-sermon-modal');
  const closeFooterBtn = document.getElementById('btn-close-sermon-footer');

  const closeAction = () => ModalSystem.close('sermon-modal');

  if (closeBtn) closeBtn.addEventListener('click', closeAction);
  if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeAction);
}

function openPreviewModal(sermonId) {
  const sermon = Sermons.find(s => s.id === sermonId);
  if (!sermon) return;

  const modalTitle = document.getElementById('modal-sermon-title');
  const modalSpeaker = document.getElementById('modal-sermon-speaker');
  const modalTopic = document.getElementById('modal-sermon-topic');
  const modalScripture = document.getElementById('modal-sermon-scripture');
  const modalDesc = document.getElementById('modal-sermon-desc');
  const modalDate = document.getElementById('modal-sermon-date');
  const modalType = document.getElementById('modal-sermon-type');
  const modalDownload = document.getElementById('modal-sermon-download');

  if (modalTitle) modalTitle.textContent = sermon.title;
  if (modalSpeaker) modalSpeaker.textContent = sermon.speaker;
  if (modalTopic) modalTopic.textContent = sermon.topic;
  if (modalScripture) modalScripture.textContent = sermon.scripture;
  if (modalDesc) {
    modalDesc.innerHTML = `
      1. Introduction to the scripture text.
      2. Key theological takeaway: God's truth is eternal and unchanging.
      3. Practical application for Christian life today:
         - Cultivate daily devotion and study.
         - Show compassion and love in all interactions.
         - Rely on the Holy Spirit's guidance.
      
      Summary:
      ${sermon.description}
    `;
  }
  if (modalDate) modalDate.textContent = formatDateLong(sermon.date);
  if (modalType) modalType.textContent = sermon.fileType;
  if (modalDownload) {
    modalDownload.href = sermon.downloadUrl;
    modalDownload.onclick = () => {
      Toast.show(`Downloading notes: ${sermon.title}...`, 'success');
      ModalSystem.close('sermon-modal');
    };
  }

  ModalSystem.open('sermon-modal');
}
