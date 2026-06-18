const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('mipui-aw.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

// Mock globals
dom.window.DbService = { get: async () => [] };
dom.window.convertDriveUrl = (url) => url;
dom.window.setupScrollReveal = () => {};
dom.window.setupLazyLoading = () => {};

// Load mipui-aw-v2.js
try {
  const scriptContent = fs.readFileSync('assets/js/mipui-aw-v2.js', 'utf8');
  dom.window.eval(scriptContent);
  console.log("Script evaluated successfully");
  
  // Fire DOMContentLoaded
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  console.log("DOMContentLoaded fired");
  
  setTimeout(() => {
    console.log("Doc count:", dom.window.document.getElementById('doc-count').textContent);
    console.log("List content:", dom.window.document.getElementById('documents-list').innerHTML.trim().substring(0, 50));
    process.exit(0);
  }, 1000);
} catch (e) {
  console.error("Runtime error:", e);
  process.exit(1);
}
