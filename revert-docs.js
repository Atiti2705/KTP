const fs = require('fs');
let code = fs.readFileSync('assets/js/documents.js', 'utf8');

const oldCard = `<div class="modern-doc-card selectable-item" data-id="\${doc.id}" data-url="\${doc.downloadUrl && doc.downloadUrl !== '#' ? doc.downloadUrl : ''}" data-name="\${doc.title}.\${String(doc.fileType||'PDF').toLowerCase()}">
      <div class="modern-doc-icon">PDF</div>
      <div class="modern-doc-content">
        <h3 class="modern-doc-title">\${doc.title}</h3>
      </div>
      <div class="modern-doc-action">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
      </div>
    </div>`;

const newCard = `<div class="doc-card reveal">
      <div class="file-icon file-icon-\${String(doc.fileType||'PDF').toLowerCase()}">\${doc.fileType||'PDF'}</div>
      <div class="doc-card-content">
        <h3 class="doc-card-title">\${doc.title}</h3>
        <p class="doc-card-desc">\${doc.description||''}</p>
        <div class="doc-card-meta">
          <span>📅 \${formatDate(doc.date)}</span>
          <span>📁 \${doc.fileSize||'Unknown Size'}</span>
          <span class="badge badge-primary" style="padding: 2px 8px;">\${doc.category}</span>
        </div>
      </div>
      <div class="doc-card-actions">
        <button class="btn btn-outline btn-sm preview-btn" data-id="\${doc.id}">👁️ Preview</button>
        <button class="btn btn-primary btn-sm download-btn" data-id="\${doc.id}">⬇️ Download</button>
      </div>
    </div>`;

code = code.replace(oldCard, newCard);
fs.writeFileSync('assets/js/documents.js', code);
console.log("Documents layout reverted successfully!");
