const fs = require('fs');
let code = fs.readFileSync('assets/js/mipui-aw-v2.js', 'utf8');
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$\{/g, '${');
fs.writeFileSync('assets/js/mipui-aw-v2.js', code);
