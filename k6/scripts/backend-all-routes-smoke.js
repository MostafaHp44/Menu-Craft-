// k6 smoke test — backend all-routes coverage (GET only)
// Generated from: performance-testing/routes.json (API_INVENTORY.md)
// Source of truth: backend/src
// Scope: read-only smoke hit across all discovered backend endpoints.
// Writes (POST/PATCH/PUT/DELETE) are intentionally NOT part of this smoke run.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.vertex-electric.org';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Smoke targets derived from the full API inventory (GET endpoints).
// `auth: true` requires AUTH_TOKEN (super admin / owner token) via env.
// Dynamic path params use documented sample values — adjust for your environment.
const SMOKE_GETS = [
  // ── Health ──────────────────────────────────────────────────────────────
  { method: 'GET', path: '/api/health', auth: false },
  { method: 'GET', path: '/api/health/live', auth: false },
  { method: 'GET', path: '/api/health/ready', auth: false },

  // ── Public: home content / plans / templates ────────────────────────────
  { method: 'GET', path: '/api/home-content', auth: false },
  { method: 'GET', path: '/api/platform/plans', auth: false },
  { method: 'GET', path: '/api/platform/plans/1', auth: false },
  { method: 'GET', path: '/api/platform/templates', auth: false },
  { method: 'GET', path: '/api/platform/templates/overrides', auth: false },

  // ── Public: guest menu / orders / restaurants / sites ───────────────────
  { method: 'GET', path: '/api/public/menu/bella', auth: false },
  { method: 'GET', path: '/api/public/menu/bella/branches', auth: false },
  { method: 'GET', path: '/api/public/orders/1/track', auth: false },
  { method: 'GET', path: '/api/restaurants/1', auth: false },
  { method: 'GET', path: '/api/restaurants/slug/bella', auth: false },
  { method: 'GET', path: '/api/sites/public/bella', auth: false },
  { method: 'GET', path: '/api/sites/bella', auth: false },

  // ── Authenticated: auth ──────────────────────────────────────────────────
  { method: 'GET', path: '/api/auth/me', auth: true },

  // ── Authenticated: owner / restaurant scoped reads ──────────────────────
  { method: 'GET', path: '/api/restaurants', auth: true },
  { method: 'GET', path: '/api/restaurants/1/templates', auth: true },
  { method: 'GET', path: '/api/sites/summary', auth: true },
  { method: 'GET', path: '/api/sites', auth: true },
  { method: 'GET', path: '/api/sites/can-create', auth: true },

  // ── Authenticated: platform admin reads ──────────────────────────────────
  { method: 'GET', path: '/api/platform/clients', auth: true },
  { method: 'GET', path: '/api/platform/subscriptions', auth: true },
  { method: 'GET', path: '/api/platform/subscriptions/1', auth: true },
  { method: 'GET', path: '/api/platform/stats', auth: true },
  { method: 'GET', path: '/api/platform/admin/sales', auth: true },
  { method: 'GET', path: '/api/platform/admin/financial', auth: true },
  { method: 'GET', path: '/api/platform/admin/clients', auth: true },
  { method: 'GET', path: '/api/platform/admin/clients/1/details', auth: true },
  { method: 'GET', path: '/api/platform/admin/users', auth: true },
  { method: 'GET', path: '/api/platform/admin/stats', auth: true },
  { method: 'GET', path: '/api/platform/admin/payments', auth: true },
  { method: 'GET', path: '/api/platform/admin/payments-summary', auth: true },
  { method: 'GET', path: '/api/platform/admin/templates', auth: true },

  // ── Authenticated: billing / payments reads ───────────────────────────────
  { method: 'GET', path: '/api/billing/status', auth: true },
  { method: 'GET', path: '/api/payments/restaurant/1', auth: true },

  // ── Authenticated: admin requests reads ───────────────────────────────────
  { method: 'GET', path: '/api/admin/free-plan-requests', auth: true },
  { method: 'GET', path: '/api/paid-subscription-requests', auth: true },
  { method: 'GET', path: '/api/admin/paid-subscription-requests', auth: true },

  // ── Authenticated: template admin reads ───────────────────────────────────
  { method: 'GET', path: '/api/platform/templates/all', auth: true },
  { method: 'GET', path: '/api/platform/templates/media', auth: true },
  { method: 'GET', path: '/api/platform/templates/overrides-admin', auth: true },
  { method: 'GET', path: '/api/platform/templates/overrides/1', auth: true },

  // ── Authenticated: uploads / branches / employees / owner / misc reads ──
  { method: 'GET', path: '/api/uploads', auth: true },
  { method: 'GET', path: '/api/branches', auth: true },
  { method: 'GET', path: '/api/branches/1', auth: true },
  { method: 'GET', path: '/api/employees', auth: true },
  { method: 'GET', path: '/api/owner/dashboard', auth: true },
  { method: 'GET', path: '/api/owner/audit', auth: true },
  { method: 'GET', path: '/api/draft/1', auth: true },
  { method: 'GET', path: '/api/revenue', auth: true },
  { method: 'GET', path: '/api/dashboard-theme', auth: true },
  { method: 'GET', path: '/api/home-video/en', auth: true },

  // ── Authenticated: orders reads ───────────────────────────────────────────
  { method: 'GET', path: '/api/orders', auth: true },
  { method: 'GET', path: '/api/orders/sales-series/1', auth: true },
  { method: 'GET', path: '/api/orders/1', auth: true },
  { method: 'GET', path: '/api/admin/orders/pending-count', auth: true },
];

export const options = {
  scenarios: {
    smoke: {
      executor: 'shared-iterations',
      exec: 'smoke',
      vus: 1,
      iterations: 1,
      startTime: '0s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  for (let i = 0; i < SMOKE_GETS.length; i++) {
    const target = SMOKE_GETS[i];

    if (target.auth && !AUTH_TOKEN) {
      console.log(`SKIP (AUTH_TOKEN missing): ${target.method} ${target.path}`);
      continue;
    }

    const headers = target.auth ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
    const res = http.get(`${BASE_URL}${target.path}`, { headers });

    const ok = check(res, {
      [`smoke_${i}`]: (r) => r.status < 500,
    });

    if (!ok) {
      console.log(`SMOKE_FAIL ${target.method} ${target.path} -> status=${res.status}`);
    }
  }
}
