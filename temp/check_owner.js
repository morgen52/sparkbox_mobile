const fs = require('fs');
const code = fs.readFileSync('src/components/OwnerSettingsPane.tsx', 'utf8');
const keys = new Set();
for (const m of code.matchAll(/t\('(ownerSettings\.[^']+)'/g)) keys.add(m[1]);

const zh = fs.readFileSync('src/i18n/zh.ts', 'utf8');
const zhKeys = new Set();
for (const m of zh.matchAll(/'(ownerSettings\.[^']+)'/g)) zhKeys.add(m[1]);

const missing = [...keys].filter(k => !zhKeys.has(k)).sort();
console.log('=== Missing from zh.ts (' + missing.length + ') ===');
missing.forEach(k => console.log(k));
