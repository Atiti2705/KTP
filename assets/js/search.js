/* ============================================
   KṬP Saikhamakawn — Search & Filter Engine
   Reusable search, filter, sort, pagination
   ============================================ */

const SearchEngine = {
  /**
   * Filter an array of items by search query, category, and sort order
   * @param {Array} items - Data array to filter
   * @param {Object} options - Filter options
   * @param {string} options.query - Search text
   * @param {string} options.category - Category filter ('All' = no filter)
   * @param {string} options.sort - Sort order ('newest','oldest','a-z','z-a')
   * @param {Array} options.searchFields - Fields to search in (e.g. ['title','description'])
   * @param {string} options.categoryField - Field name for category (default 'category')
   * @returns {Array} Filtered and sorted items
   */
  filter(items, options = {}) {
    const {
      query = '',
      category = 'All',
      sort = 'newest',
      searchFields = ['title', 'description'],
      categoryField = 'category'
    } = options;

    let results = [...items];

    // Filter by category
    if (category && category !== 'All') {
      results = results.filter(item => item[categoryField] === category);
    }

    // Filter by search query
    if (query.trim()) {
      const terms = String(query).toLowerCase().trim().split(/\s+/);
      results = results.filter(item =>
        terms.every(term =>
          searchFields.some(field => {
            const val = item[field];
            return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
          })
        )
      );
    }

    // Sort
    results = this.sort(results, sort);

    return results;
  },

  /**
   * Helper to extract date from title if it matches DD.MM.YYYY or DD.MM.YY, otherwise fallback to item.date
   */
  _getDate(item) {
    if (item.title) {
      const dateMatch = item.title.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        let year = parseInt(dateMatch[3], 10);
        if (dateMatch[3].length === 2) year += 2000;
        return new Date(year, month, day);
      }
    }
    return new Date(item.date);
  },

  /**
   * Sort items
   */
  sort(items, order = 'manual') {
    const sorted = [...items];
    switch (order) {
      case 'manual':
        sorted.sort((a, b) => {
          const aIdx = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
          const bIdx = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
          // If orderIndex is identical, fallback to newest
          if (aIdx === bIdx) return this._getDate(b) - this._getDate(a);
          return aIdx - bIdx;
        });
        break;
      case 'newest':
        sorted.sort((a, b) => this._getDate(b) - this._getDate(a));
        break;
      case 'oldest':
        sorted.sort((a, b) => this._getDate(a) - this._getDate(b));
        break;
      case 'a-z':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    return sorted;
  },

  /**
   * Paginate results
   * @param {Array} items - Full results array
   * @param {number} page - Current page (1-indexed)
   * @param {number} perPage - Items per page
   * @returns {Object} { items, totalPages, currentPage, totalItems, hasMore }
   */
  paginate(items, page = 1, perPage = 12) {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);
    const start = (currentPage - 1) * perPage;
    const paginatedItems = items.slice(start, start + perPage);

    return {
      items: paginatedItems,
      totalPages,
      currentPage,
      totalItems,
      hasMore: currentPage < totalPages
    };
  },

  /**
   * Get items for "Load More" mode (returns all items up to current page)
   */
  loadMore(items, page = 1, perPage = 12) {
    const end = page * perPage;
    return {
      items: items.slice(0, end),
      hasMore: end < items.length,
      totalItems: items.length,
      showing: Math.min(end, items.length)
    };
  },

  /**
   * Get featured items
   */
  getFeatured(items, limit = 6) {
    return items.filter(item => item.featured).slice(0, limit);
  },

  /**
   * Render pagination buttons
   */
  renderPagination(container, { totalPages, currentPage }, onPageChange) {
    if (!container || totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';

    // Previous button
    html += `<button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}" aria-label="Previous page">‹</button>`;

    // Page numbers
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      html += `<button class="pagination-btn" data-page="1">1</button>`;
      if (start > 2) html += `<span class="pagination-btn" style="border:none;cursor:default;">…</span>`;
    }

    for (let i = start; i <= end; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span class="pagination-btn" style="border:none;cursor:default;">…</span>`;
      html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    html += `<button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" aria-label="Next page">›</button>`;

    container.innerHTML = html;

    // Attach click handlers
    container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page >= 1 && page <= totalPages && page !== currentPage) {
          onPageChange(page);
        }
      });
    });
  },

  /**
   * Render results count info
   */
  renderResultsInfo(container, { totalItems, currentPage, perPage = 12 }) {
    if (!container) return;
    if (totalItems === 0) {
      container.textContent = 'No results found';
      return;
    }
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);
    container.textContent = `Showing ${start}–${end} of ${totalItems}`;
  }
};
