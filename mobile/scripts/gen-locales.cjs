// One-off generator: merges web locale files with translated mobile sections.
// Usage: node scripts/gen-locales.cjs  (safe to re-run; output is deterministic)
const fs = require('fs');
const path = require('path');

const webDir = path.resolve(__dirname, '../../frontend/src/i18n/locales');
const outDir = path.resolve(__dirname, '../src/i18n/locales');
const mobile = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mobile-translations.json'), 'utf8')
);

for (const lang of ['es', 'fr', 'de', 'pt']) {
  const web = JSON.parse(
    fs.readFileSync(path.join(webDir, `${lang}.json`), 'utf8')
  );
  const merged = { ...web, mobile: mobile[lang] };
  fs.writeFileSync(
    path.join(outDir, `${lang}.json`),
    JSON.stringify(merged, null, 2) + '\n'
  );
  console.log(`wrote ${lang}.json`);
}

// Validate: all locale files must have identical key shapes as en.json
function keys(obj, prefix = '') {
  const out = [];
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      out.push(...keys(obj[k], p));
    } else {
      out.push(p);
    }
  }
  return out.sort();
}

const enKeys = keys(
  JSON.parse(fs.readFileSync(path.join(outDir, 'en.json'), 'utf8'))
);
let failed = false;
for (const lang of ['es', 'fr', 'de', 'pt']) {
  const otherKeys = keys(
    JSON.parse(fs.readFileSync(path.join(outDir, `${lang}.json`), 'utf8'))
  );
  const missing = enKeys.filter((k) => !otherKeys.includes(k));
  const extra = otherKeys.filter((k) => !enKeys.includes(k));
  console.log(
    `${lang}: ${otherKeys.length} keys, missing: ${missing.length}, extra: ${extra.length}`
  );
  if (missing.length || extra.length) {
    failed = true;
    if (missing.length) console.log('  missing:', missing);
    if (extra.length) console.log('  extra:', extra);
  }
}
process.exit(failed ? 1 : 0);
