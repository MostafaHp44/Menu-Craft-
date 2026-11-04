/**
 * Phase A.2 — Step 5: Translation Engine (tx) Tests
 * Non-destructive. No DB writes.
 */
const { tx, isValidSourceLang, VALID_LANGS } = require('./src/services/translate.service');

function assert(condition, msg) {
  if (!condition) throw new Error('ASSERT FAIL: ' + msg);
}

function run() {
  console.log('=== Phase A.2 Step 5 — tx() Tests ===');

  // 1. Exact requested translation
  const itemFull = { en: 'Pasta', ar: 'معكرونة', ku: 'پاستا' };
  assert(tx(itemFull, 'ar', 'en') === 'معكرونة', 'ar requested');
  assert(tx(itemFull, 'ku', 'en') === 'پاستا', 'ku requested');
  assert(tx(itemFull, 'en', 'en') === 'Pasta', 'en requested');

  // 2. Fallback to source_lang
  const itemSourceAr = { en: 'Pasta', ar: 'معكرونة', ku: '' };
  assert(tx(itemSourceAr, 'ar', 'ar') === 'معكرونة', 'requested ar with ar source');
  assert(tx(itemSourceAr, 'en', 'ar') === 'Pasta', 'requested en overrides ar source');

  // 3. Fallback to English when source is NULL and translation missing
  const itemNoSource = { en: 'Espresso', ar: '', ku: '' };
  assert(tx(itemNoSource, 'ku', null) === 'Espresso', 'fallback en when source NULL');

  // 4. NULL source_lang handled safely
  assert(tx({ en: 'Coffee', ar: 'قهوة', ku: 'قاوە' }, 'ar', null) === 'قهوة', 'null source with ar available');

  // 5. Missing translation — falls back through priority
  const itemMissingAr = { en: 'Espresso', ar: '', ku: 'چا' };
  assert(tx(itemMissingAr, 'ar', 'ku') === 'چا', 'missing ar falls back to source ku');
  assert(tx({ en: 'Espresso', ar: '', ku: '' }, 'ar', 'en') === 'Espresso', 'missing all except en');

  // 6. Empty strings treated as missing
  assert(tx({ en: '', ar: '', ku: '' }, 'en', 'en') === '', 'all empty returns empty');

  // 7. Kurdish ku preserved; invalid ckb rejected at validation layer
  assert(isValidSourceLang('ku') === true, 'ku valid');
  assert(isValidSourceLang('ckb') === false, 'ckb invalid (use ku internally)');

  // 8. Invalid language codes rejected
  try {
    tx({ en: 'X' }, 'fr', 'en');
    assert(false, 'fr should throw');
  } catch (e) {
    assert(e.message.includes('Unsupported'), 'fr throws unsupported');
  }

  // 8. No fourth-language fallback: when ar/en/missing and source empty, must return '' not pick ku
  assert(tx({ en: '', ar: '', ku: 'Unexpected' }, 'ar', null) === '', 'no fallback to ku when approved order fails');

  // 9. Source_lang is NOT automatically replaced by Restaurants.language
  // This is enforced by documentation and design: tx() requires explicit sourceLang parameter; it does not read restaurant context.
  // When sourceLang is null, it skips source step and falls back to en, preserving independence.
  const independent = tx({ en: 'A', ar: 'B', ku: 'C' }, 'ar', null);
  assert(independent === 'B', 'null source skips source step');

  console.log('All tx() tests passed (non-destructive).');
}

run();
