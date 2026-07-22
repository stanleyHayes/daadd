#!/usr/bin/env bash
#
# Renders a markdown doc to PDF for sharing outside the repo.
#
#   ./scripts/build-docs-pdf.sh docs/USER_GUIDE.md
#   ./scripts/build-docs-pdf.sh docs/USER_GUIDE.md "SmartAdDeals User Guide"
#
# pandoc converts markdown to HTML, headless Chrome prints it. That route was
# chosen over pandoc's own PDF output because the LaTeX engines it needs are not
# installed here, and over wkhtmltopdf because it is unmaintained. Chrome is
# already on every machine that runs the frontend.
set -euo pipefail

SOURCE="${1:?usage: build-docs-pdf.sh <markdown-file> [title]}"
TITLE="${2:-$(basename "${SOURCE%.*}" | tr '_' ' ')}"
OUTPUT="${SOURCE%.*}.pdf"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || CHROME="$(command -v chromium || command -v google-chrome)"
[ -x "$CHROME" ] || { echo "No Chrome/Chromium found. Install one, or use pandoc --pdf-engine." >&2; exit 1; }
command -v pandoc >/dev/null || { echo "pandoc not found: brew install pandoc" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cat > "$WORK/style.css" <<'CSS'
/* Print styling. Deliberately plain: this is a reference document people will
   search and skim, not a brochure. */
@page { size: A4; margin: 20mm 18mm 18mm; }

:root {
  --ink: #14181f;
  --muted: #5b6472;
  --rule: #dfe3e9;
  --accent: #1e3a8a;
  --code-bg: #f5f6f8;
}

html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

body {
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: var(--ink);
  margin: 0;
  /* Long-form prose reads badly at full page width. */
  max-width: 44em;
}

h1, h2, h3, h4 { line-height: 1.25; text-wrap: balance; }

h1 {
  font-size: 21pt;
  margin: 0 0 0.2em;
  letter-spacing: -0.02em;
}
h1 + p { color: var(--muted); }
/* Later parts get breathing room rather than a forced page break — the intro is
   short, and breaking on it wasted most of page one. */
h1 ~ h1 { margin-top: 2.4em; }

h2 {
  font-size: 14pt;
  margin: 1.9em 0 0.5em;
  padding-bottom: 0.28em;
  border-bottom: 1px solid var(--rule);
  letter-spacing: -0.01em;
}

h3 { font-size: 11.5pt; margin: 1.5em 0 0.4em; color: var(--accent); }

/* Never leave a heading alone at the foot of a page. */
h1, h2, h3, h4 { break-after: avoid-page; break-inside: avoid; }
p, li, tr, blockquote { break-inside: avoid; }

p { margin: 0 0 0.75em; }
ul, ol { margin: 0 0 0.9em; padding-left: 1.3em; }
li { margin-bottom: 0.3em; }
li > p { margin-bottom: 0.35em; }

strong { font-weight: 650; }

a { color: var(--accent); text-decoration: none; }
/* A PDF cannot be clicked through reliably, so show where links go. */
a[href^="http"]::after {
  content: " (" attr(href) ")";
  font-size: 0.82em;
  color: var(--muted);
  word-break: break-all;
}

code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.88em;
  background: var(--code-bg);
  padding: 0.1em 0.35em;
  border-radius: 3px;
}
pre {
  background: var(--code-bg);
  padding: 0.85em 1em;
  border-radius: 6px;
  overflow-x: auto;
  break-inside: avoid;
}
pre code { background: none; padding: 0; font-size: 0.85em; }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.6em 0 1.2em;
  font-size: 0.94em;
}
th, td {
  border: 1px solid var(--rule);
  padding: 0.45em 0.65em;
  text-align: left;
  vertical-align: top;
}
th { background: #f0f2f5; font-weight: 620; }

blockquote {
  margin: 1em 0;
  padding: 0.7em 1em;
  background: #fbfbfc;
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--muted);
}
blockquote p:last-child { margin-bottom: 0; }

hr { border: none; border-top: 1px solid var(--rule); margin: 2em 0; }
CSS

# No pandoc title block: these documents open with their own H1, and injecting
# one printed the title twice.
pandoc "$SOURCE" \
  --from=gfm \
  --to=html5 \
  --standalone \
  --metadata title="$TITLE" \
  --variable pagetitle="$TITLE" \
  --css=style.css \
  --output "$WORK/doc.html"

# Strip the generated header block, keeping the title only in PDF metadata.
python3 - "$WORK/doc.html" <<'PY_STRIP'
import re, sys
path = sys.argv[1]
html = open(path, encoding='utf-8').read()
html = re.sub(r'<header[^>]*id="title-block-header"[\s\S]*?</header>', '', html, count=1)
open(path, 'w', encoding='utf-8').write(html)
PY_STRIP

"$CHROME" \
  --headless \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$(cd "$(dirname "$OUTPUT")" && pwd)/$(basename "$OUTPUT")" \
  "file://$WORK/doc.html" 2>/dev/null

echo "$OUTPUT  ($(du -h "$OUTPUT" | cut -f1))"
