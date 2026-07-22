// Regenerates the web locale files from `web-translations.json`.
//
// `en.json` is the source of truth: it defines both the key set and the key
// order. Every other locale is rebuilt from it, so a translator only ever edits
// `web-translations.json` and re-runs this script. Keys with no translation yet
// fall back to the English string (i18next would do the same at runtime, but
// writing them out keeps the files diffable and makes the gaps visible).
//
// Usage: node scripts/gen-locales.cjs  (safe to re-run; output is deterministic)
// Exits non-zero when any locale still has untranslated keys.
const fs = require('fs');
const path = require('path');

const LANGS = ['es', 'fr', 'de', 'pt', 'sv'];

const outDir = path.resolve(__dirname, '../src/i18n/locales');
const translations = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'web-translations.json'), 'utf8')
);
const en = JSON.parse(fs.readFileSync(path.join(outDir, 'en.json'), 'utf8'));

/** Rebuilds `translated` in `template`'s shape and order, falling back to it. */
function shape(template, translated, missing, prefix = '') {
  const out = {};
  for (const key of Object.keys(template)) {
    const p = prefix ? `${prefix}.${key}` : key;
    const value = template[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = shape(value, translated?.[key] ?? {}, missing, p);
    } else if (typeof translated?.[key] === 'string') {
      out[key] = translated[key];
    } else {
      out[key] = value;
      missing.push(p);
    }
  }
  return out;
}

let failed = false;
for (const lang of LANGS) {
  const missing = [];
  const locale = shape(en, translations[lang], missing);
  fs.writeFileSync(
    path.join(outDir, `${lang}.json`),
    JSON.stringify(locale, null, 2) + '\n'
  );
  console.log(
    `${lang}.json: ${missing.length === 0 ? 'complete' : `${missing.length} untranslated`}`
  );
  if (missing.length) {
    failed = true;
    console.log('  ' + missing.join('\n  '));
  }
}

process.exit(failed ? 1 : 0);
