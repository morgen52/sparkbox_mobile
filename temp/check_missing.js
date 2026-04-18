const fs = require('fs');
const code = fs.readFileSync('src/components/LibraryPane.tsx', 'utf8');
const keys = new Set();
for (const m of code.matchAll(/t\('(library\.[^']+)'/g)) keys.add(m[1]);

const zh = fs.readFileSync('src/i18n/zh.ts', 'utf8');
const zhKeys = new Set();
for (const m of zh.matchAll(/'(library\.[^']+)'/g)) zhKeys.add(m[1]);

const missing = [...keys].filter(k => !zhKeys.has(k)).sort();
console.log('=== Still MISSING from zh.ts (' + missing.length + ') ===');
missing.forEach(k => console.log(k));
