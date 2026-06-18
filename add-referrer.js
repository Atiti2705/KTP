const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('meta name="referrer"')) {
    content = content.replace('<head>', '<head>\n  <meta name="referrer" content="no-referrer">');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
