const fs = require('fs');
const path = require('path');

const src = __dirname;
const dest = path.join(__dirname, 'www');

// List of folders and files to copy
const itemsToCopy = [
  'admin', 'assets', '404.html', 'hla-lyrics.html', 'index.html', 
  'mipui-aw.html', 'photos.html', 'saved.html', 'sermons.html', 'documents.html',
  'profile.html'
];

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest);

itemsToCopy.forEach(item => {
  const srcPath = path.join(src, item);
  const destPath = path.join(dest, item);
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
});
console.log('Build completed! Files moved to /www directory.');
