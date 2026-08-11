document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('ob-container');
  if (!container) return;

  const dataType = container.getAttribute('data-type');
  if (!dataType) {
    console.error("No data-type specified on #ob-container");
    return;
  }



  // Inject Toolbar (Search & Filter) above the grid
  const toolbarHtml = `
    <div style="display: flex; flex-direction: column; gap: var(--sp-3); margin-bottom: var(--sp-4);">
      <div style="display: flex; flex-wrap: wrap; gap: var(--sp-3); justify-content: space-between; align-items: center;">
        <button id="btn-back-folders" class="btn btn-outline" style="display: none; padding: 6px 12px; font-size: var(--fs-sm);">
          🔙 Back to Folders
        </button>
        <div style="flex: 1; min-width: 200px; max-width: 400px; position: relative;">
          <input type="text" id="ob-search" placeholder="Search entries..." class="form-input" style="padding-left: 36px; width: 100%;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
      </div>
      <div id="folder-title-container" style="display: none;">
        <h2 id="current-folder-title" style="font-size: var(--fs-xl); color: var(--brand-gold);"></h2>
      </div>
    </div>
  `;
  
  // Create a wrapper for the toolbar and insert it before the grid
  const toolbarWrapper = document.createElement('div');
  toolbarWrapper.innerHTML = toolbarHtml;
  container.parentNode.insertBefore(toolbarWrapper, container);

  const searchInput = document.getElementById('ob-search');
  const btnBackFolders = document.getElementById('btn-back-folders');
  const folderTitleContainer = document.getElementById('folder-title-container');
  const currentFolderTitle = document.getElementById('current-folder-title');

  let baseItems = [];
  let currentCategory = 'All';
  let dataLoaded = false;

  btnBackFolders.addEventListener('click', () => {
    currentCategory = 'All';
    searchInput.value = '';
    history.pushState({ view: 'folders' }, '', window.location.pathname);
    applyFilters();
    window.scrollTo({ top: Math.max(0, container.offsetTop - 100), behavior: 'smooth' });
  });

  function renderGrid(itemsToRender) {
    const urlParams = new URLSearchParams(window.location.search);
    const gjType = urlParams.get('type') || 'branch';
    const settingsFolderKey = gjType === 'kohhran' ? 'kohhranJubileeFolders' : 'goldenJubileeFolders';
    
    let folders = [];
    if (typeof AdminData !== 'undefined') {
       const settings = AdminData.get('settings');
       if (settings && settings[settingsFolderKey] && Array.isArray(settings[settingsFolderKey])) {
          folders = settings[settingsFolderKey].map(c => typeof c === 'string' ? {name: c, style: 'default'} : c);
       }
    } else if (window.appSettings && window.appSettings[settingsFolderKey]) {
       folders = window.appSettings[settingsFolderKey].map(c => typeof c === 'string' ? {name: c, style: 'default'} : c);
    }
    
    if (folders.length === 0) {
       const defaultFolder = gjType === 'kohhran' ? 'Kohhran Golden Jubilee' : 'Branch Golden Jubilee';
       const uniqueNames = Array.from(new Set(baseItems.map(item => item.category).filter(c => c && c !== defaultFolder))).sort();
       folders = uniqueNames.map(n => ({name: n, style: 'default'}));
    }

    if (currentCategory === 'All') {
      btnBackFolders.style.display = 'none';
      folderTitleContainer.style.display = 'none';
      container.className = 'ob-grid reveal revealed';
      
      if (folders.length === 0) {
        if (!dataLoaded) {
          container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);">
              <div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>
              Loading records...
            </div>
          `;
        } else {
          container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-secondary); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
              <div style="font-size: 3rem; margin-bottom: var(--sp-3);">📁</div>
              <h3>No Folders Found</h3>
            </div>
          `;
        }
        return;
      }
      
      // Only show folders that match search if there is a search term
      const searchTerm = searchInput.value.toLowerCase();
      const filteredFolders = searchTerm 
        ? folders.filter(f => f.name.toLowerCase().includes(searchTerm))
        : folders;
        
      let html = '';

      if (filteredFolders.length > 0) {
        html += `<div style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--sp-4); margin-bottom: var(--sp-6);">`;
        html += filteredFolders.map(folder => {
          const folderItems = baseItems.filter(i => i.category === folder.name);
          let count = 0;
          folderItems.forEach(i => {
            const numImages = (i.imageUrls && i.imageUrls.length > 0) ? i.imageUrls.length : (i.imageUrl ? 1 : 0);
            const numDocs = (i.documentFiles && i.documentFiles.length > 0) ? i.documentFiles.length : 0;
            const total = numImages + numDocs;
            count += total > 0 ? total : 1;
          });
          
          let thumb = '';
          for(let i of folderItems) {
             if(i.imageUrls && i.imageUrls[0]) { thumb = i.imageUrls[0]; break; }
             if(i.imageUrl) { thumb = i.imageUrl; break; }
          }
          
          const imgHtml = thumb 
             ? `<img loading="lazy" src="${convertDriveUrl(thumb)}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; filter: brightness(0.9);">` 
             : `<div style="font-size: 3.5rem; text-align: center; color: var(--brand-sky);">📁</div>`;
             
          return `
            <div class="ob-card folder-card" data-folder="${folder.name}" data-style="${folder.style}" style="cursor: pointer; text-align: center; flex-direction: column !important; padding: 0 !important; overflow: hidden; border: 2px solid transparent; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--brand-gold)';" onmouseout="this.style.borderColor='transparent';">
               <div class="ob-image-wrapper" style="width: 100% !important; height: 120px !important; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); border-radius: 0;">
                  ${imgHtml}
               </div>
               <div class="ob-content-wrapper" style="align-items: center; padding: var(--sp-3) !important;">
                  <h3 class="ob-title" style="margin-bottom: 2px !important; font-size: var(--fs-md) !important;">${folder.name}</h3>
                  <div style="font-size: var(--fs-sm); color: var(--color-text-tertiary); font-weight: var(--fw-medium);">${count} items</div>
               </div>
            </div>
          `;
        }).join('');
        html += `</div>`;
      }
      
      if (itemsToRender && itemsToRender.length > 0) {
        html += itemsToRender.map(item => {
          const primaryImage = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : item.imageUrl;
          const imgHtml = primaryImage 
            ? `<img loading="lazy" src="${convertDriveUrl(primaryImage)}" alt="${item.title || 'Photo'}">` 
            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-tertiary); font-size: var(--fs-xs);">No Image</div>`;
          
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
      
      if (!html) {
        if (!dataLoaded) {
          html = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);">
              <div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>
              Loading records...
            </div>
          `;
        } else {
          html = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-secondary); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
              <div style="font-size: 3rem; margin-bottom: var(--sp-3);">🔍</div>
              <h3>No Items Match Search</h3>
            </div>
          `;
        }
      }
      
      container.innerHTML = html;
      
      container.querySelectorAll('.folder-card').forEach(card => {
          card.addEventListener('click', () => {
              const folderName = card.getAttribute('data-folder');
              currentCategory = folderName;
              searchInput.value = ''; // clear search when entering folder
              history.pushState({ view: 'folder', category: folderName }, '', '#folder=' + encodeURIComponent(folderName));
              applyFilters();
              window.scrollTo({ top: Math.max(0, container.offsetTop - 100), behavior: 'smooth' });
          });
      });
      return;
    } else {
      btnBackFolders.style.display = 'inline-flex';
      folderTitleContainer.style.display = 'block';
      currentFolderTitle.textContent = `📁 ${currentCategory}`;
    }

    if (itemsToRender.length === 0) {
      if (!dataLoaded) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-tertiary);">
            <div class="loading-spinner" style="margin: 0 auto var(--sp-3) auto;"></div>
            Loading records...
          </div>
        `;
      } else {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--color-text-secondary); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
            <div style="font-size: 3rem; margin-bottom: var(--sp-3);">📭</div>
            <h3>Folder is Empty</h3>
            <p>No matching records found.</p>
          </div>
        `;
      }
      return;
    }

    const currentFolderObj = folders.find(f => (f.name || '').trim() === (currentCategory || '').trim()) || { style: 'default' };
    const folderStyle = currentFolderObj.style;
    let effectiveStyle = folderStyle;
    
    // Auto-detect if a default folder is actually just a photo gallery
    if (effectiveStyle === 'default' && itemsToRender.length > 0) {
      const isAllPhotos = itemsToRender.every(item => {
        const hasImage = item.imageUrl || (item.imageUrls && item.imageUrls.length > 0);
        const hasContentOrDocs = item.content || (item.documentFiles && item.documentFiles.length > 0);
        return hasImage && !hasContentOrDocs;
      });
      if (isAllPhotos) {
        effectiveStyle = 'gallery';
      }
    }

    // Reset container classes based on style
    container.className = 'reveal revealed';
    if (effectiveStyle === 'gallery') {
      container.classList.add('masonry-grid');
    } else if (effectiveStyle === 'list') {
      container.classList.add('doc-list-grid');
    } else {
      container.classList.add('ob-grid');
    }

    if (effectiveStyle === 'gallery') {
      container.innerHTML = itemsToRender.map(item => {
        const images = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
        if (images.length === 0) return '';
        
        return images.map(img => `
          <div class="masonry-item gallery-item selectable-item photo-card" data-id="${item.id}" style="position: relative;" data-url="${convertDriveUrl(img)}">
            <img src="${convertDriveUrl(img)}" alt="${(item.title || 'Photo').replace(/\"/g, '&quot;')}" class="gallery-image" loading="lazy">
            ${item.title ? `
            <div class="gallery-overlay">
              <h3 style="color: white; font-size: var(--fs-md); font-weight: var(--fw-medium); margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${item.title}</h3>
            </div>` : ''}
          </div>
        `).join('');
      }).join('');
    } else if (effectiveStyle === 'list') {
      container.classList.add('gdrive-grid');
      container.innerHTML = itemsToRender.map(item => {
        const docFiles = (item.documentFiles && item.documentFiles.length > 0) ? item.documentFiles : [];
        if (docFiles.length === 0) {
          const imgUrl = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (item.imageUrl || '#');
          docFiles.push({ url: imgUrl, name: item.title || 'Untitled Document' });
        }
        
        return docFiles.map(doc => {
          const url = doc.url;
          let fileId = '';
          if (url && url !== '#') {
            const fileIdMatch = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) fileId = fileIdMatch[1];
          }
          
          let thumbHtml = '';
          if (fileId) {
            thumbHtml = `<img loading="lazy" src="https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400" alt="Preview" loading="lazy" class="gdrive-thumbnail">`;
          } else {
            thumbHtml = `<div class="gdrive-no-preview"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>`;
          }

          const titleStr = doc.name || item.title || 'Untitled Document';
          return `
            <div class="gdrive-card selectable-item gj-doc-card" data-url="${url}" data-title="${titleStr.replace(/"/g, '&quot;')}">
              <div class="gdrive-header">
                <div class="gdrive-icon-wrapper">
                  <span class="gdrive-pdf-badge">PDF</span>
                </div>
                <div class="gdrive-title" title="${titleStr.replace(/"/g, '&quot;')}">${titleStr}</div>
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
      }).join('');
    } else {
      // Default (Cards)
      container.innerHTML = itemsToRender.map(item => {
        const images = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : ['']);
        
        return images.map(img => {
          const hasLongText = !!item.content;
          
          if (!hasLongText && img) {
            // Render as a gallery photo card
            return `
              <div class="photo-card selectable-item" data-id="${item.id}" style="position: relative;" data-url="${convertDriveUrl(img)}">
                <img src="${convertDriveUrl(img)}" alt="${(item.title || 'Photo').replace(/\"/g, '&quot;')}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md);" loading="lazy">
                ${(item.title || item.year) ? `
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: var(--sp-4) var(--sp-3) var(--sp-3); border-bottom-left-radius: var(--radius-md); border-bottom-right-radius: var(--radius-md);">
                  ${item.title ? `<h3 style="color: white; font-size: var(--fs-sm); font-weight: var(--fw-medium); margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${item.title}</h3>` : ''}
                  ${item.year ? `<div style="color: rgba(255,255,255,0.8); font-size: 0.75rem; margin-top: 4px;">${item.year}</div>` : ''}
                </div>` : ''}
              </div>
            `;
          }

          // Render as a standard ob-card
          const imgHtml = img 
            ? `<img loading="lazy" src="${convertDriveUrl(img)}" alt="${(item.title || 'Photo').replace(/\"/g, '&quot;')}">` 
            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-tertiary); font-size: var(--fs-xs);">No Image</div>`;
          
          const titleHtml = item.title ? `<h3 class="ob-title">${item.title}</h3>` : '';
          const yearHtml = item.year ? `<div class="ob-year">${item.year}</div>` : '';
          const contentHtml = item.content ? `<div class="ob-content">${item.content}</div>` : '';

          return `
            <div class="ob-card selectable-item photo-card" data-id="${item.id}" data-url="${img ? convertDriveUrl(img) : ''}">
              <div class="ob-img-container">${imgHtml}</div>
              <div class="ob-info">
                ${titleHtml}
                ${yearHtml}
                ${contentHtml}
              </div>
            </div>
          `;
        }).join('');
      }).join('');
    }
  }

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    let result = [...baseItems];
    const urlParams = new URLSearchParams(window.location.search);
    const gjType = urlParams.get('type') || 'branch';
    const defaultFolder = gjType === 'kohhran' ? 'Kohhran Golden Jubilee' : 'Branch Golden Jubilee';

    // Filter by Category
    if (currentCategory === 'All') {
       result = result.filter(item => item.category === defaultFolder);
    } else {
       result = result.filter(item => item.category === currentCategory);
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
        max-height: 400px;
        object-fit: contain;
        display: block;
        background: var(--color-bg-hover);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      }
      .ob-modal-slider-wrapper {
        position: relative;
        width: 100%;
        background: var(--color-bg-hover);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        overflow: hidden;
      }
      .ob-modal-slider {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
      }
      .ob-modal-slider::-webkit-scrollbar {
        display: none;
      }
      .ob-modal-slide {
        flex-shrink: 0;
        width: 100%;
        max-height: 400px;
        scroll-snap-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ob-modal-slide img {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: contain;
      }
      .ob-modal-dots {
        position: absolute;
        bottom: 12px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 6px;
        z-index: 5;
      }
      .ob-modal-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255,255,255,0.5);
        transition: background 0.3s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .ob-modal-dot.active {
        background: #fff;
        transform: scale(1.2);
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
      
      /* New Layout Grids */
      .photo-gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--sp-4);
      }
      .photo-card {
        aspect-ratio: 1;
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: transform var(--transition-base), box-shadow var(--transition-base);
      }
      .photo-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      .photo-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-base);
      }
      .photo-card:hover img {
        transform: scale(1.05);
      }
      .photo-overlay {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        padding: var(--sp-4) var(--sp-3) var(--sp-3);
      }
      .photo-title {
        color: white;
        font-size: var(--fs-sm);
        margin: 0;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      }
      
      .doc-list-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      @media (min-width: 640px) {
        .doc-list-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
      }
      @media (min-width: 1024px) {
        .doc-list-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      .doc-card {
        transition: transform var(--transition-base), border-color var(--transition-base);
      }
      .doc-card:hover {
        transform: translateX(4px);
        border-color: var(--brand-sky);
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

  // Add Document Preview Modal HTML
  const docModalHtml = `
    <div class="modal-backdrop lightbox-modal" id="gj-doc-modal" style="background: rgba(0,0,0,0.95); padding: 0; display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000;">
      <div style="position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; padding: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(0,0,0,0.5); z-index: 10;">
          <h3 id="gj-modal-doc-title" style="color: white; margin: 0; font-size: 1.2rem; font-weight: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Document</h3>
          <div style="display: flex; gap: 16px; align-items: center;">
             <a href="#" id="gj-modal-doc-download" download target="_blank" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 8px;" title="Download">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             </a>
             <button id="gj-close-doc-modal" aria-label="Close" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
        </div>
        <div style="flex: 1; position: relative; width: 100%; height: 100%; background: #fff; -webkit-overflow-scrolling: touch; overflow: auto;">
          <iframe id="gj-modal-doc-iframe" src="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', docModalHtml);

  // Document Modal Logic
  const gjDocModal = document.getElementById('gj-doc-modal');
  const gjCloseDocModal = document.getElementById('gj-close-doc-modal');
  const gjModalDocTitle = document.getElementById('gj-modal-doc-title');
  const gjModalDocDownload = document.getElementById('gj-modal-doc-download');
  const gjModalDocIframe = document.getElementById('gj-modal-doc-iframe');

  function closeGjDocModal(fromHistory = false) {
    gjDocModal.classList.remove('active');
    gjDocModal.style.display = 'none';
    document.body.style.overflow = '';
    gjModalDocIframe.src = '';
    if (!fromHistory && history.state && history.state.modalId === 'gj-doc-modal') {
      history.back();
    }
  }

  function openGjDocModal(url, title) {
    gjModalDocTitle.textContent = title || 'Document';
    
    let fileId = '';
    if (url && url !== '#') {
      const fileIdMatch = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) fileId = fileIdMatch[1];
    }
    
    if (fileId) {
      gjModalDocIframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
      gjModalDocDownload.href = `https://drive.google.com/uc?export=download&id=${fileId}`;
    } else {
      gjModalDocIframe.src = url || 'about:blank';
      gjModalDocDownload.href = url || '#';
    }
    
    gjDocModal.classList.add('active');
    gjDocModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    history.pushState({ modalId: 'gj-doc-modal' }, '', '#preview');
  }

  if (gjCloseDocModal) gjCloseDocModal.addEventListener('click', () => closeGjDocModal());
  if (gjDocModal) {
    gjDocModal.addEventListener('click', (e) => {
      if (e.target === gjDocModal) closeGjDocModal();
    });
  }

  // Add Photo Lightbox Modal HTML
  const photoLightboxHtml = `
    <div class="modal-backdrop lightbox-modal" id="gj-photo-lightbox" style="background: rgba(0,0,0,0.95); user-select: none; padding: 0; display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000;">
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 0;">
        <button id="gj-close-photo-lightbox" aria-label="Back" style="position: absolute; top: 16px; left: 16px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: background 0.2s;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
        
        <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 12px; z-index: 10;">
          <a id="gj-lightbox-download" href="#" download target="_blank" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); text-decoration: none; transition: background 0.2s;" title="Download"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>
        </div>
        
        <button id="gj-lightbox-prev" class="lightbox-nav-btn" aria-label="Previous" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❮</button>
        <button id="gj-lightbox-next" class="lightbox-nav-btn" aria-label="Next" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; transition: background 0.2s;">❯</button>
        <img loading="lazy" src="" alt="" id="gj-lightbox-image" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', photoLightboxHtml);

  const gjPhotoLightbox = document.getElementById('gj-photo-lightbox');
  const gjLightboxImage = document.getElementById('gj-lightbox-image');
  const gjLightboxDownload = document.getElementById('gj-lightbox-download');
  
  let currentLightboxItems = [];
  let currentLightboxIndex = 0;

  function closeGjLightbox(fromHistory = false) {
    gjPhotoLightbox.classList.remove('active');
    gjPhotoLightbox.style.display = 'none';
    document.body.style.overflow = '';
    gjLightboxImage.src = '';
    if (!fromHistory && history.state && history.state.modalId === 'gj-photo-lightbox') {
      history.back();
    }
  }

  function updateLightboxImage() {
    if (currentLightboxItems.length === 0) return;
    
    if (window.gjTouchZoomHandler) {
      window.gjTouchZoomHandler.reset();
    }
    
    const item = currentLightboxItems[currentLightboxIndex];
    const primaryImage = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : item.imageUrl;
    const finalUrl = primaryImage ? convertDriveUrl(primaryImage) : '';
    
    if (gjLightboxImage) {
      gjLightboxImage.style.opacity = '0';
      setTimeout(() => {
        gjLightboxImage.src = finalUrl;
        gjLightboxImage.onload = () => gjLightboxImage.style.opacity = '1';
      }, 150);
      gjLightboxImage.style.transition = 'opacity 0.2s ease-in-out';
    }    
    let fileId = '';
    if (primaryImage) {
      const match = primaryImage.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    }
    if (gjLightboxDownload) {
      let dlUrl = finalUrl;
      if (dlUrl && dlUrl.includes('lh3.googleusercontent.com') && !dlUrl.includes('=s0')) {
        dlUrl = dlUrl.split('=')[0] + '=s0';
      }
      gjLightboxDownload.href = '#';
      gjLightboxDownload.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        let titleStr = 'photo';
        if (currentLightboxItems && currentLightboxItems[currentLightboxIndex]) {
            const curItem = currentLightboxItems[currentLightboxIndex];
            titleStr = curItem.title || 'photo';
            if (curItem.id) titleStr += `_${curItem.id}`;
        }
        let safeTitle = titleStr.replace(/[^a-zA-Z0-9_-]/g, '_');
        window.forceDownload(dlUrl, `${safeTitle}.jpg`);
      };
    }
  }

  function openGjLightbox(id, clickedUrl) {
    currentLightboxItems = [];
    baseItems.forEach(i => {
      const matchCat = currentCategory === 'All' || (i.category || '').trim() === (currentCategory || '').trim();
      if (!matchCat) return;
      const images = (i.imageUrls && i.imageUrls.length > 0) ? i.imageUrls : (i.imageUrl ? [i.imageUrl] : []);
      images.forEach(img => {
        currentLightboxItems.push({
          id: i.id,
          imageUrl: img,
          imageUrls: [img],
          title: i.title
        });
      });
    });
    
    if (clickedUrl) {
      currentLightboxIndex = currentLightboxItems.findIndex(i => convertDriveUrl(i.imageUrl) === clickedUrl || i.imageUrl === clickedUrl);
    } else {
      currentLightboxIndex = currentLightboxItems.findIndex(i => String(i.id) === String(id));
    }
    if (currentLightboxIndex === -1) currentLightboxIndex = 0;
    
    updateLightboxImage();
    gjPhotoLightbox.classList.add('active');
    gjPhotoLightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    history.pushState({ modalId: 'gj-photo-lightbox' }, '', '#lightbox');
  }

  const lightboxCloseBtn = document.getElementById('gj-close-photo-lightbox');
  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', () => closeGjLightbox());
  }
  
  if (gjPhotoLightbox) {
    gjPhotoLightbox.addEventListener('click', (e) => {
      if (e.target === gjPhotoLightbox) closeGjLightbox();
    });
  }
  document.getElementById('gj-lightbox-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxItems.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxItems.length) % currentLightboxItems.length;
    updateLightboxImage();
  });
  document.getElementById('gj-lightbox-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxItems.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxItems.length;
    updateLightboxImage();
  });

  if (gjLightboxImage && typeof TouchZoomHandler !== 'undefined' && !window.gjTouchZoomHandler) {
    window.gjTouchZoomHandler = new TouchZoomHandler(
      gjLightboxImage, 
      gjPhotoLightbox, 
      () => {
        if (currentLightboxItems.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxItems.length;
        updateLightboxImage();
      }, 
      () => {
        if (currentLightboxItems.length <= 1) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxItems.length) % currentLightboxItems.length;
        updateLightboxImage();
      }
    );
  }

  // Download handler is set dynamically in updateLightboxImage to prevent duplicate downloads



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
    if (gjPhotoLightbox.style.display === 'flex') {
      closeGjLightbox(true);
    } else if (gjDocModal.style.display === 'flex') {
      closeGjDocModal(true);
    } else if (detailModal.classList.contains('active')) {
      closeModal(true);
    } else if (e.state && e.state.view === 'folder' && e.state.category) {
      currentCategory = e.state.category;
      searchInput.value = '';
      applyFilters();
    } else {
      currentCategory = 'All';
      searchInput.value = '';
      applyFilters();
    }
  });

  closeBtn.addEventListener('click', () => closeModal());
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });

  // Allow clicking images inside the detail modal to view them fullscreen in the Lightbox
  modalImgContainer.addEventListener('click', (e) => {
    const slide = e.target.closest('.ob-modal-slide') || e.target.closest('.ob-modal-image');
    if (!slide) return;
    
    const id = detailModal.getAttribute('data-id');
    const item = baseItems.find(i => i.id === id);
    if (!item) return;

    let images = [];
    if (item.imageUrls && item.imageUrls.length > 0) {
      images = item.imageUrls;
    } else if (item.imageUrl) {
      images = [item.imageUrl];
    }
    
    if (images.length === 0) return;

    currentLightboxItems = images.map(url => ({ 
      id: item.id,
      title: item.title,
      imageUrl: url, 
      imageUrls: [url] 
    }));
    
    let clickedIndex = 0;
    if (slide.classList.contains('ob-modal-slide') && slide.parentElement) {
       clickedIndex = Array.from(slide.parentElement.children).indexOf(slide);
    }
    
    currentLightboxIndex = clickedIndex >= 0 ? clickedIndex : 0;
    updateLightboxImage();
    gjPhotoLightbox.classList.add('active');
    gjPhotoLightbox.style.display = 'flex';
    history.pushState({ modalId: 'gj-photo-lightbox' }, '', '#lightbox');
  });

  // Event delegation for opening the modal
  container.addEventListener('click', (e) => {
    // Open Document Preview Modal if they clicked a gj-doc-card
    const docCard = e.target.closest('.gj-doc-card');
    if (docCard) {
      e.preventDefault();
      e.stopPropagation();
      openGjDocModal(docCard.getAttribute('data-url'), docCard.getAttribute('data-title'));
      return;
    }

    // Open Lightbox if they clicked a gallery photo card
    const photoCard = e.target.closest('.photo-card');
    if (photoCard) {
      e.preventDefault();
      e.stopPropagation();
      openGjLightbox(photoCard.getAttribute('data-id'), photoCard.getAttribute('data-url'));
      return;
    }

    // Only open ob-detail-modal if it's an ob-card (default)
    const card = e.target.closest('.ob-card:not(.folder-card)');
    if (!card) return;
    
    const id = card.getAttribute('data-id');
    const item = baseItems.find(i => i.id === id);
    if (!item) return;

    detailModal.setAttribute('data-id', id);
    modalTitleElem.textContent = item.title || '';
    
    // Safely render content and append document links if any
    const escapedContent = (item.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let textHtml = escapedContent;
    
    if (item.documentFiles && item.documentFiles.length > 0) {
      textHtml += `
        <div style="margin-top: var(--sp-4);">
          <h4 style="font-size: var(--fs-md); font-weight: var(--fw-semibold); margin-bottom: var(--sp-3); color: var(--color-text);">Documents & Files</h4>
          <div style="display: flex; flex-direction: column; gap: var(--sp-2);">
            ${item.documentFiles.map(doc => `
              <a href="${doc.url}" target="_blank" style="display: flex; align-items: center; gap: 12px; padding: var(--sp-3); background: var(--color-bg-hover); border-radius: var(--radius-md); text-decoration: none; color: var(--color-text); border: 1px solid var(--color-border); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                <span style="font-size: 24px;">📄</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--fw-medium);">${doc.name}</span>
                <span style="color: var(--brand-sky); font-size: var(--fs-sm); font-weight: var(--fw-bold);">Open ↗</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }
    modalTextElem.innerHTML = textHtml;
    
    if (item.imageUrls && item.imageUrls.length > 1) {
      modalImgContainer.innerHTML = `
        <div class="ob-modal-slider-wrapper">
          <div class="ob-modal-slider" id="ob-modal-slider">
            ${item.imageUrls.map((url, i) => `
              <div class="ob-modal-slide" style="cursor: zoom-in;" title="Click to view fullscreen">
                <img loading="lazy" src="${convertDriveUrl(url, 'image', 'w1600')}" alt="${item.title || 'Photo'}">
              </div>
            `).join('')}
          </div>
          <div class="ob-modal-dots" id="ob-modal-dots">
            ${item.imageUrls.map((_, i) => `
              <div class="ob-modal-dot ${i === 0 ? 'active' : ''}"></div>
            `).join('')}
          </div>
        </div>
      `;
      
      const slider = document.getElementById('ob-modal-slider');
      const dots = document.getElementById('ob-modal-dots').querySelectorAll('.ob-modal-dot');
      
      slider.addEventListener('scroll', () => {
        const index = Math.round(slider.scrollLeft / slider.clientWidth);
        dots.forEach((dot, i) => {
          if (i === index) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      });
      
    } else if (item.imageUrls && item.imageUrls.length === 1) {
      modalImgContainer.innerHTML = `<img loading="lazy" src="${convertDriveUrl(item.imageUrls[0], 'image', 'w1600')}" class="ob-modal-image" alt="${item.title || 'Photo'}" style="cursor: zoom-in;" title="Click to view fullscreen">`;
    } else if (item.imageUrl) {
      modalImgContainer.innerHTML = `<img loading="lazy" src="${convertDriveUrl(item.imageUrl, 'image', 'w1600')}" class="ob-modal-image" alt="${item.title || 'Photo'}" style="cursor: zoom-in;" title="Click to view fullscreen">`;
    } else {
      modalImgContainer.innerHTML = '';
    }
    
    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    history.pushState({ modalId: 'ob-detail-modal' }, '', '#details');
  });

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const gjType = urlParams.get('type') || 'branch';
    const collectionName = gjType === 'kohhran' ? 'Kohhran Golden Jubilee' : 'Golden Jubilee';
    const defaultCategoryName = gjType === 'kohhran' ? 'Kohhran Golden Jubilee' : 'Branch Golden Jubilee';
    
    // Update header based on type
    const headerTitle = document.querySelector('h1.reveal');
    if (headerTitle) {
      headerTitle.textContent = defaultCategoryName;
    }
    document.title = `${defaultCategoryName} — KṬP Saikhamakawn`;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = defaultCategoryName;
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) metaTitle.content = `${defaultCategoryName} — KṬP Saikhamakawn`;
    const metaOgDesc = document.querySelector('meta[property="og:description"]');
    if (metaOgDesc) metaOgDesc.content = defaultCategoryName;
    // 1. Instant render from localStorage cache
    try {
      const cached = localStorage.getItem('db_' + collectionName);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseItems = parsed;
          baseItems.sort((a, b) => {
            if (a.date && b.date) return new Date(b.date) - new Date(a.date);
            const yearA = a.year || a.title || '';
            const yearB = b.year || b.title || '';
            return yearB.localeCompare(yearA);
          });
          dataLoaded = true;
          applyFilters();
        }
      }
    } catch (e) {}

    // 2. Fetch data and settings concurrently asynchronously
    const [fetchedItems, settings] = await Promise.all([
      DbService.get(collectionName),
      DbService.get('settings')
    ]);
    
    baseItems = fetchedItems || [];
    window.appSettings = settings || {};
    try {
      if (fetchedItems && Array.isArray(fetchedItems)) {
        localStorage.setItem('db_' + collectionName, JSON.stringify(fetchedItems));
      }
    } catch (e) {}
    
    // Sort items by date descending, fallback to year or title
    baseItems.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      const yearA = a.year || a.title || '';
      const yearB = b.year || b.title || '';
      return yearB.localeCompare(yearA);
    });

    // Initial render
    dataLoaded = true;
    applyFilters();

    // Event listeners
    searchInput.addEventListener('input', applyFilters);
    
  } catch (error) {
    console.error(`Error loading ${collectionName} for ${dataType}:`, error);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp-8); color: var(--brand-red); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--brand-red);">
        <p>⚠️ Failed to load records. Please try again later.</p>
      </div>
    `;
  }
});
