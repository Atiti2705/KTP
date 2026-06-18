const fs = require('fs');
let code = fs.readFileSync('assets/js/data.js', 'utf8');
code = code.slice(0, code.indexOf("function convertDriveUrl(url, type = 'image') {"));
const newFunc = `function convertDriveUrl(url, type = 'image') {
  if (!url) return '';
  let fileId = '';
  if (url.includes('embeddedfolderview')) {
    return url;
  }
  const fileIdMatch = url.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    fileId = fileIdMatch[1];
  } else {
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1] && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
      fileId = idParamMatch[1];
    } else {
      const lh3Match = url.match(/lh3\\.googleusercontent\\.com\\/d\\/([a-zA-Z0-9_-]+)/);
      if (lh3Match && lh3Match[1]) {
        fileId = lh3Match[1];
      }
    }
  }
  const folderIdMatch = url.match(/\\/folders\\/([a-zA-Z0-9_-]+)/);
  if (folderIdMatch && folderIdMatch[1]) {
    return \`https://drive.google.com/embeddedfolderview?id=\${folderIdMatch[1]}#grid\`;
  }
  if (fileId) {
    if (type === 'image') {
      return \`https://drive.google.com/thumbnail?id=\${fileId}&sz=w1000\`;
    } else {
      return \`https://drive.google.com/file/d/\${fileId}/view?usp=sharing\`;
    }
  }
  return url;
}
`;
fs.writeFileSync('assets/js/data.js', code + newFunc);
