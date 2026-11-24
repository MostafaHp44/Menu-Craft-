// k6 browser test — الموقع العام (vertex-electric.org) بعد الرفع
// منظمة حسب skill k6-browser-test: scenario واحد ui، context واحد، thresholds للـ web vitals.

import { check } from 'k6';
import { browser } from 'k6/browser';

const BASE_URL = __ENV.BASE_URL || 'https://vertex-electric.org/';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      exec: 'ui',
      vus: 1,
      iterations: 1,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    browser_web_vital_cls: ['p(0.95)<0.1'],
    browser_web_vital_inp: ['p(0.95)<200'],
    browser_web_vital_lcp: ['p(0.95)<2500'],
  },
};

export default function () {
  const context = browser.newContext();
  const page = context.newPage();
  try {
    const resp = await page.goto(BASE_URL, { waitUntil: 'load' });
    check(resp, {
      'home responds 200': (r) => r.status === 200,
    });

    await page.waitForLoadState('networkidle');
    await new Promise((r) => setTimeout(r, 1500)); // think time realism

    // k6 browser engine collects browser_web_vital_* automatically
  } finally {
    await context.close();
  }
}
