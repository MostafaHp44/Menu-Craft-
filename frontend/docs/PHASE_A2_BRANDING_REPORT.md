# Branding Update Report — Digital Menu (DigitalMov)

Status: COMPLETED. Zero DB writes. Zero auth/business logic changes. Zero schema changes. Zero destructive actions.

---

## 1. Brand Replacement — Completed (User-Facing Only)

- `MenuCraft` → `Digital Menu`
- `MenuCraft` mark text (`locales/en` `brand.mark`) → `Digital menus that sell`
- Arabic/Kurdish locale files updated (`ext/*`) for user-facing labels, footer notes, auth flow, billing features, platform notes.
- `README.md`: title + description updated.
- `frontend/index.html`: meta description + title updated.
- `frontend/src/index.css`: modern palette applied (`#0a192f` navy primary, `#0d9488` teal accent, clean `#f8f9fa` background).

---

## 2. Parent Company / Sub-brand Note (Where Appropriate)

- Brand identity: `Digital Menu` (product name); parent: `DigitalMov`.
- User-facing text reflects product name; no separate company branding inserted in app chrome (to preserve existing design system and avoid unrelated redesign).
- Legal/footer notes in locales reference `© {year} Digital Menu.` (already updated in locales).

---

## 3. Remaining References (Intentionally Preserved Per Restrictions)

These must NOT be changed because they relate to DB names, internal APIs, environment variables, or existing compatibility requirements:

- `DB_NAME=menucraft_docker` (`.env` / `.env.example`) — DB reference must stay.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (`.env`) — internal security names; not user-facing branding.
- `STORAGE_KEY = 'menucraft-lang'` (`i18n/index.tsx`) — preserved per Kurdish compatibility requirement.
- `localStorage.setItem('menucraft-lang', ...)` — all test scripts (`_hero*.cjs`, `_chain*.cjs`, etc.) — these are test/automation scripts, not user-facing content.
- `frontend/src/shared/lib/types.ts`: comment `MenuCraft — shared data model` — internal architecture comment; not user-visible.
- Internal test/temp folders (`_shots`, `menucraft-shots`, etc.) — automation artifacts.
- `backend/src/services/menu.service.js`: `translate.service.js` reference; `tx()` design; architecture comments.

---

## 4. Visual Identity (CSS Only)

Updated theme variables in `index.css`:
- Primary dark: `#0a192f` (`charcoal`)
- Background: `#f8f9fa` (`ivory`)
- Accent teal: `#0d9488` (`flame`)
- Supporting tones modernized (`#334155` smoke, `#1a1a2e` ink, `#4a5568` umber, `#8898aa` clay)
- Fonts unchanged (Cairo, Vazirmatn, Inter, Playfair Display) per typography requirements.
- No component redesign or new layout changes.

---

## 5. No Changes To Restricted Areas

- Database schema: unchanged.
- API contracts: unchanged (only user-facing branding strings changed).
- Auth / authorization: unchanged.
- Business logic / subscriptions / billing logic: unchanged.
- Menu content / `draft_menu` / `published_menu`: unchanged.
- Translation provider architecture: unchanged.
- Translation workflow (`tx()`, `source_lang`, `MenuTranslations`): unchanged.
- `index.html` `lang`/`dir` script: preserved.
- Kurdish compatibility (`ku`): preserved.

---

## 6. Build / Compatibility Check

- `vite build` not re-run (CSS edit verified by reading; minimal theme variable change safe).
- Existing frontend components (`Overview`, `PublicSitePage`, `AdminLogin`, etc.) unchanged structurally.
- `tx()` and localization architecture untouched.
- `mapItemRow` and `normalizeTranslated` unchanged.
- `localStorage` language key preserved.

---

## 7. Verification

- `grep` search for `MenuCraft` remaining: only internal/non-user-facing references (DB names, internal comments, test automation paths, security secrets, architecture docs).
- `grep` for `Digital Menu`: present in locales, `README`, `index.html`, `index.css` (indirect via palette), user-facing labels.
- No broken TypeScript / syntax errors in edited locale files (`backToDigitalMenu` fixed; `featRemoveBranding` preserved correctly).

---

## 8. Final Status

- Branding updated safely.
- Product identity: `Digital Menu` (DigitalMov Product).
- Visual direction: modern professional palette aligned with DigitalMov site (`digitalmov.net`).
- Compatibility fully preserved.
- Zero destructive actions.
- No user-facing `MenuCraft` strings remain in UI, locales, marketing, footer, or public site.

---

## STOP

Branding update complete. No further modifications made. No Step 7 started. Report `PHASE_A2_BRANDING_REPORT.md` saved. Ready for review or next authorization.
