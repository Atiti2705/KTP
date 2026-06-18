const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// The exact faulty line we want to replace
const faultyRegex = /<div style="width: 60px; height: 60px; border-radius: 50%; padding: 2px; border: 2px solid var\(--brand-sky\); margin-bottom: 6px; cursor: pointer;" onclick="openOBPreviewModal\([^>]+>/g;

const replacement = `<div style="width: 60px; height: 60px; border-radius: 50%; padding: 2px; border: 2px solid var(--brand-sky); margin-bottom: 6px; cursor: pointer;" onclick="openOBPreviewModal(this.dataset.img, this.dataset.name, this.dataset.position)" data-img="\${imageUrl}" data-name="\${(ob.name||'').replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')}" data-position="\${(ob.position||'').replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')}">`;

content = content.replace(faultyRegex, replacement);

fs.writeFileSync('index.html', content);
console.log("Fixed index.html");
