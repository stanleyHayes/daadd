// Regenerates the mobile locale files from `mobile-translations.json`.
//
// `en.json` is the source of truth: it defines both the key set and the key
// order. Every other locale is rebuilt from it, so a translator only ever edits
// `mobile-translations.json` and re-runs this script. Keys with no translation
// yet fall back to the English string (i18next would do the same at runtime,
// but writing them out keeps the files diffable and makes gaps visible).
//
// Usage: node scripts/gen-locales.cjs  (safe to re-run; output is deterministic)
const fs = require('fs');
const path = require('path');

const LANGS = ['es', 'fr', 'de', 'pt', 'sv'];

const outDir = path.resolve(__dirname, '../src/i18n/locales');
const translations = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mobile-translations.json'), 'utf8')
);
const en = JSON.parse(fs.readFileSync(path.join(outDir, 'en.json'), 'utf8'));

/** Interpolation placeholders must survive translation, or the string breaks at runtime. */
function placeholders(value) {
  return [...String(value).matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)].map((m) => m[1]).sort().join(',');
}

/** Rebuilds `translated` in `template`'s shape and order, falling back to it. */
function shape(template, translated, missing, prefix = '') {
  const out = {};
  for (const key of Object.keys(template)) {
    const p = prefix ? `${prefix}.${key}` : key;
    const value = template[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = shape(value, translated?.[key] ?? {}, missing, p);
    } else if (typeof translated?.[key] === 'string') {
      if (placeholders(translated[key]) !== placeholders(value)) {
        throw new Error(
          `${p}: translation drops or invents an interpolation placeholder\n  en: ${value}\n  xx: ${translated[key]}`
        );
      }
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
  const locale = { mobile: shape(en.mobile, translations[lang], missing, 'mobile') };
  fs.writeFileSync(
    path.join(outDir, `${lang}.json`),
    JSON.stringify(locale, null, 2) + '\n'
  );
  const extra = Object.keys(translations[lang] ?? {}).length === 0;
  console.log(
    `${lang}.json: ${missing.length === 0 ? 'complete' : `${missing.length} untranslated`}`
  );
  if (missing.length) {
    failed = true;
    console.log('  ' + missing.join('\n  '));
  }
  if (extra) failed = true;
}

process.exit(failed ? 1 : 0);
