const fs = require('fs');
const code = fs.readFileSync('src/components/LibraryPane.tsx', 'utf8');
const keys = new Set();
for (const m of code.matchAll(/t\('(library\.[^']+)'/g)) keys.add(m[1]);

const en = fs.readFileSync('src/i18n/en.ts', 'utf8');
const enKeys = new Set();
for (const m of en.matchAll(/'(library\.[^']+)'/g)) enKeys.add(m[1]);

const missing = [...keys].filter(k => !enKeys.has(k)).sort();
console.log('=== Missing from en.ts (' + missing.length + ') ===');
missing.forEach(k => console.log(k));
