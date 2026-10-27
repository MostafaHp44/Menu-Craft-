# MenuCraft

An interactive frontend prototype for a digital-menu website builder SaaS — marketing site, template marketplace, visual editor, restaurant dashboard, public menu, QR page and platform admin.

**React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · zustand · qrcode.react**

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## Routes

| Route | What it is |
| --- | --- |
| `/` | Marketing homepage |
| `/templates` | Template marketplace — search, filters, live previews |
| `/templates/:id` | Full-page template preview (desktop / phone) |
| `/signin` | Sign-in screen (demo, accepts anything) |
| `/dashboard` | Restaurant workspace — overview, menu, branding, QR, subscription, settings |
| `/dashboard/editor` | Three-part visual editor with undo/redo and publish flow |
| `/dashboard/qr-code` | Real, scannable QR code with PNG/SVG download and print |
| `/menu-demo` | Public Bella site with the simulated address bar |
| `/admin` | Platform admin (mock analytics) |
| anything else | 404 |

## Notes

- **No backend.** All data is demo data persisted to `localStorage` (`menucraft-demo-v1`); three restaurants are seeded independently.
- Sign-in, payments, DNS, subdomains and traffic analytics are **simulated** — URLs such as `bella.menucraft.com` are clearly labelled as simulated in the UI.
- Food photography is bundled in `public/images/food/` (credits in `public/images/CREDITS.txt`); web fonts load from Google Fonts.

## Verified

- `tsc -b` clean, production build passes (no chunk warnings).
- 44 automated browser checks (editor CRUD, design panels, undo/redo, downloads, persistence) passing.
- 15 routes at 1440×900 and 8 routes at 390/768 — no console errors, no broken images, no horizontal overflow.
