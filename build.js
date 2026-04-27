/**
 * Copies web assets into the www/ folder for Capacitor.
 * Run with: node build.js
 */
const fs   = require('fs');
const path = require('path');

const WWW = path.join(__dirname, 'www');

// Clean and recreate www/
if (fs.existsSync(WWW)) fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// HTML pages — website-only pages excluded from the app bundle
const websiteOnly = ['home.html', 'about.html'];
const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html') && !websiteOnly.includes(f));
htmlFiles.forEach(f => fs.copyFileSync(path.join(__dirname, f), path.join(WWW, f)));

// Asset folders
['css', 'js'].forEach(dir => {
  const src = path.join(__dirname, dir);
  if (fs.existsSync(src)) copyDir(src, path.join(WWW, dir));
});

// Static files
['logo.png', 'icon.png', 'manifest.json'].forEach(f => {
  const src = path.join(__dirname, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(WWW, f));
});

console.log('✓ Built to www/');
