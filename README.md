# MenuCraft

Restaurant digital-menu SaaS — marketing site, template marketplace, inline (Elementor-style) template editor, restaurant dashboard, kitchen/worker board, platform admin.

Monorepo layout:

```
frontend/   React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · framer-motion · zustand · qrcode.react
backend/    (API — coming next)
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # type-check + production build
npm run preview
```

## Languages & direction

The whole product speaks **English / العربية / کوردی** from a language switcher in the header and the dashboard.
`ar` and `ku` render full RTL (Tailwind logical utilities), `en` renders LTR.

## Roles

| Role | Sees |
| --- | --- |
| **Client** — anyone who registers | their restaurant: orders, earnings, reports, menu builder, payments, subscription |
| **Worker** | kitchen board only — moves orders `received → preparing → served` |
| **Admin** | limited platform access (permission-controlled) |
| **Super admin** | clients, subscriptions, sales reports, templates, team/access, payment providers |

## Folder structure (`frontend/src`)

```
components/   home-page sections only
features/     auth · marketing · client · worker · admin
templates/    template data, site renderer, inline editor
shared/       ui kit, i18n (en/ar/ku), store, lib, chrome
```

## Status

Everything is front-end demo data persisted to `localStorage` until the backend lands — sign-in, payments, analytics and subdomains are simulated and labelled as such in the UI.
