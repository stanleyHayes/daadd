# Translation review — handoff

**Status: every locale is complete, none has been reviewed by a native speaker.**

The non-English copy in this repo is a complete first pass produced during the
Swedish rollout. It is structurally sound — every key is present, every
interpolation placeholder is intact, the apps build and typecheck — but the
wording has not been checked by anyone who speaks the language natively.

Do not present any locale as launch-ready until it has been through the
checklist below and signed off in the table at the end of this document.

See [I18N.md](I18N.md) for how the system works. This document is only about
getting the copy reviewed.

---

## What exists

| App | Keys | en | sv | de | es | fr | pt |
|---|---|---|---|---|---|---|---|
| Web (`frontend/`) | 963 | ✅ | 1st pass | 1st pass | 1st pass | 1st pass | 1st pass |
| Mobile (`mobile/`) | 331 | ✅ | 1st pass | 1st pass | 1st pass | 1st pass | 1st pass |

The web set covers the public marketing site, auth, the support centre and the
whole advertiser dashboard. The mobile set covers the consumer app.

---

## How a reviewer works

**Edit one file per app. Never edit the generated locale files** — they are
overwritten on every run.

| | Edit this | Not this |
|---|---|---|
| Web | `frontend/scripts/web-translations.json` | `frontend/src/i18n/locales/*.json` |
| Mobile | `mobile/scripts/mobile-translations.json` | `mobile/src/i18n/locales/*.json` |

After editing:

```sh
node frontend/scripts/gen-locales.cjs
node mobile/scripts/gen-locales.cjs
```

Both print `complete` per locale and exit zero when nothing is missing. They
**fail hard** if a translation drops or invents an interpolation placeholder
(`{{count}}`, `{{email}}`, `{{status}}`, `{{date}}`, `{{value}}`, `{{when}}`,
`{{role}}`, `{{desk}}`) — that would break the string at runtime, so the check
is deliberately fatal rather than a warning.

To see a string in context, switch language in the app: the web language
switcher in the header, the mobile picker under Profile → Language, or the
dashboard Settings → Regional Settings → Language.

---

## Deliberately left in English

These are **not** gaps. Do not "fix" them:

- **Brand and product names** — SmartAdDeals, Ad Journey Storyteller.
- **Metric acronyms** — CTR, ROAS, ROI, CPC, CPA.
- **Testimonial attributions** — "Jessica Park, CMO", "Marcus Chen, Growth
  Lead". These are quoted people, not UI copy.
- **Job titles and departments** on the careers page — these are the names the
  roles are advertised under.
- **Loanwords German and French use natively** — Dashboard, Budget, Status,
  Website, Feedback, Community, Conversions, Creatives, Benchmarking, Remote.

A parity script reports strings identical to English; expect roughly 4–33 per
locale, all from the list above. Anything else identical to English is a real
gap worth flagging.

---

## Where to focus

**Review the dashboard before the marketing pages.** The marketing copy is
ordinary prose and low-risk. The dashboard carries the domain vocabulary an
advertiser or merchant will read every day, and if it doesn't match what the
client's own team says internally, it will read as wrong no matter how correct
the grammar is.

These are the terms most worth checking against the client's actual usage:

| Concept | en | sv | de | es | fr | pt |
|---|---|---|---|---|---|---|
| QR Redemptions | QR Redemptions | QR-inlösen | QR-Einlösungen | Canjes por QR | Échanges par QR | Trocas por QR |
| Tokens | Tokens | token | Token | tokens | jetons | tokens |
| Reward economics | Reward economics | Belöningsekonomi | Prämienökonomie | Economía de las recompensas | Économie des récompenses | Economia das recompensas |
| Outlets & Branches | Outlets & Branches | Filialer och butiker | Filialen und Standorte | Sucursales y locales | Succursales et points de vente | Lojas e filiais |
| Merchant Performance | Merchant Performance | Handlarresultat | Händlerleistung | Rendimiento del comercio | Performance commerçant | Desempenho do comerciante |
| Anomaly Detection | Anomaly Detection | Avvikelsedetektering | Anomalieerkennung | Detección de anomalías | Détection d'anomalies | Deteção de anomalias |
| Discount Shared | Discount Shared | Delad rabatt | Geteilter Rabatt | Descuento compartido | Remise partagée | Desconto partilhado |
| Loyalty & VIP | Loyalty & VIP | Lojalitet och VIP | Treue und VIP | Fidelidad y VIP | Fidélité et VIP | Fidelização e VIP |

Specific things to settle per locale:

- **Swedish** — the client is the Swedish-market customer, so this is the one
  that matters most. `inlösen`, `tokenpott`, `avvikelsedetektering` and
  `handlare` (vs `återförsäljare` / `butik`) are the calls most likely to
  differ from the client's own vocabulary.
- **German** — the copy uses informal **du** throughout. If the client wants
  **Sie** for the advertiser dashboard, that is a sweep across the whole
  `dashboard.*` namespace, not a few strings. Decide before reviewing line by
  line.
- **Portuguese** — written in **European Portuguese** (`utilizador`, `ecrã`
  conventions, `a carregar`). If the target market is Brazil this needs
  redoing, not editing.
- **Spanish and French** — both use informal **tú / vous**-neutral phrasing.
  Spanish is peninsular (`vosotros` is avoided, so it travels reasonably to
  Latin America).

---

## Checklist per locale

- [ ] Domain glossary above agreed with the client's team
- [ ] Formality register confirmed (du/Sie, tú/usted, tu/vous)
- [ ] Regional variant confirmed (pt-PT vs pt-BR, es-ES vs es-419)
- [ ] Dashboard namespace reviewed (`dashboard.*` — the bulk of the keys)
- [ ] Public site reviewed (landing, about, careers, contact, support)
- [ ] Auth flows reviewed (login, register, password reset, validation errors)
- [ ] Mobile app reviewed (`mobile.*`)
- [ ] Toast messages and empty states read naturally, not literally translated
- [ ] Generators re-run and reporting `complete`
- [ ] Spot-checked in the running app, not just in the JSON

---

## Sign-off

| Locale | Reviewer | Date | Notes |
|---|---|---|---|
| sv | | | |
| de | | | |
| es | | | |
| fr | | | |
| pt | | | |

---

## Known gap

The legal pages — Privacy Policy, Terms of Service, Cookie Policy — are **not
internationalised**. They render in English in every locale.

That was deliberate: machine-translating legal text creates liability, and
those documents should be produced or approved by whoever owns the legal
copy, not translated as UI strings. If a market needs localised legal pages,
treat it as its own piece of work.
