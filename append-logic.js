const fs = require('fs');

let docLogic = `
// ========================
// PREVIEW MODAL LOGIC
// ========================
function setupPreviewModal() {
  if (document.getElementById('doc-modal')) return;

  const modalMarkup = \`
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
        <div style="flex: 1; position: relative; width: 100%; height: 100%; background: #fff;">
          <iframe id="modal-doc-iframe" src="" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      </div>
    </div>
  \`;

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
    const fileIdMatch = downloadUrl.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    } else {
      const idMatch = downloadUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) fileId = idMatch[1];
    }
  }

  if (modalIframe) {
    if (fileId) {
      modalIframe.src = \`https://drive.google.com/file/d/\${fileId}/preview\`;
    } else if (downloadUrl && downloadUrl !== '#') {
      modalIframe.src = downloadUrl;
    } else {
      modalIframe.src = 'about:blank';
    }
  }

  if (modalDownload) {
    if (downloadUrl && downloadUrl !== '#') {
      modalDownload.style.display = 'flex';
      modalDownload.href = fileId ? \`https://drive.google.com/uc?export=download&id=\${fileId}\` : downloadUrl;
      modalDownload.onclick = () => {
        Toast.show(\`Downloading \${doc.title}...\`, 'success');
      };
    } else {
      modalDownload.style.display = 'flex';
      modalDownload.href = '#';
      modalDownload.removeAttribute('target');
      modalDownload.onclick = (e) => {
        e.preventDefault();
        Toast.show(\`Downloading \${doc.title} (Simulated)...\`, 'success');
      };
    }
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
    btnDownload.addEventListener('click', () => {
      const selectedIds = Array.from(docSelectionManager.getSelected());
      if (selectedIds.length === 0) return;
      
      Toast.show(\`Starting download of \${selectedIds.length} Mipui Aw...\`, 'success');
      
      let delay = 0;
      selectedIds.forEach(id => {
        const doc = MipuiAwList.find(d => d.id === id);
        if (doc && doc.downloadUrl && doc.downloadUrl !== '#') {
          setTimeout(() => {
            let dlUrl = doc.downloadUrl;
            let fileId = '';
            const fileIdMatch = dlUrl.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
              fileId = fileIdMatch[1];
            } else {
              const idMatch = dlUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
              if (idMatch && idMatch[1]) fileId = idMatch[1];
            }
            if (fileId) {
              dlUrl = \`https://drive.google.com/uc?export=download&id=\${fileId}\`;
            }
            const a = document.createElement('a');
            a.href = dlUrl;
            a.download = doc.title;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, delay);
          delay += 1000;
        }
      });
      docSelectionManager.clearSelection();
    });
  }
}
`;

fs.appendFileSync('assets/js/mipui-aw-v2.js', docLogic);
