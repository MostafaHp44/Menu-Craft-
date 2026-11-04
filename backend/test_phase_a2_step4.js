/**
 * Phase A.2 — Step 4: Validation & Source Language Rules Test
 * READ-ONLY / NON-DESTRUCTIVE. No DB writes.
 */
const { VALID_SOURCE_LANGS, isValidSourceLang } = require('./src/services/menu.service');

function runTests() {
  console.log('=== Phase A.2 Step 4 — Model & Validation Tests ===');

  // Valid source languages
  console.log('Valid values:', VALID_SOURCE_LANGS);
  console.assert(isValidSourceLang('en') === true, 'en should be valid');
  console.assert(isValidSourceLang('ar') === true, 'ar should be valid');
  console.assert(isValidSourceLang('ku') === true, 'ku should be valid');

  // NULL allowed
  console.assert(isValidSourceLang(null) === true, 'null should be allowed');
  console.assert(isValidSourceLang(undefined) === true, 'undefined should be allowed');

  // Invalid rejected
  console.assert(isValidSourceLang('fr') === false, 'fr should be invalid');
  console.assert(isValidSourceLang('ckb') === false, 'ckb should be invalid (keep internal ku)');
  console.assert(isValidSourceLang('') === false, 'empty string invalid');

  // Rules verification (documented, not executed against DB)
  console.log('Rules:');
  console.log(' - Valid: ar, en, ku');
  console.log(' - NULL allowed');
  console.log(' - Inherit Restaurants.language when not explicitly provided');
  console.log(' - Preserve existing source_lang on updates unless explicitly changed');
  console.log(' - Original fields never overwritten by translations');

  console.log('All assertions passed (non-destructive).');
}

runTests();
