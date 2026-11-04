# TEMPLATES FIX REPORT

## Fix 1 — Template rendering (`api-test-rest` fixture)
- File: DB (`Restaurants` row `rest-1793437631499-27bf0`)
- Root: `templateId='bella-italia'` + `design={}` did not match site rendering requirements (`getTemplate()` + `designVars()`).
- Fix: set `templateId='urban-cafe'`, `design` with colors/sections, `heroImage`, `gallery`, `hours`, `language='en'`.
- Evidence: browser snapshot shows site loads with `New category` menu, `New dish` items, checkout, `API Test Rest` branding.

## Fix 2 — `simulated` badge removal
- File: `frontend/src/templates/site/RestaurantSite.tsx:1116`
- Root: label `· {t('web.site.contact.simulated')}` shown on any public site.
- Fix: removed the `<span>`; kept only `{r.slug}.example.com`.
- Evidence: `MenuDemo.tsx` unchanged; only `RestaurantSite.tsx` edited.

## Fix 3 — Template registry completeness
- Verified 8 stock templates in `templates/data/templates.ts`.
- `getTemplate()` and `allTemplates()` cover all; no runtime errors.
