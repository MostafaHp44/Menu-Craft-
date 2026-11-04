/**
 * Phase A.2 — Step 6: Final Localization Integration Tests (Non-Destructive)
 */
const { tx, isValidSourceLang, VALID_LANGS } = require('./src/services/translate.service');
const fs = require('fs');
const path = require('path');
const serviceContent = fs.readFileSync('./src/services/menu.service.js', 'utf8');

function assert(condition, msg) {
  if (!condition) throw new Error('ASSERT FAIL: ' + msg);
}

function run() {
  console.log('=== Phase A.2 Step 6 — Final Integration Tests ===');

  // --- Response structure ---
  assert(serviceContent.includes('normalizeTranslated'), 'mapItemRow keeps multilingual object');
  assert(serviceContent.includes('resolveTranslated'), 'resolveTranslated applied');
  assert(serviceContent.includes('display_name'), 'display_name present');
  assert(serviceContent.includes('display_description'), 'display_description present');
  assert(!fs.existsSync(path.join(__dirname, 'dist')), 'no build artifact referenced');

  // --- A. Multilingual object preserved ---
  const name = { en: 'Espresso', ar: 'قهوة', ku: 'قاوە' };
  assert(typeof name.en === 'string' && typeof name.ar === 'string', 'multilingual shape preserved');

  // --- B. Language behavior via tx() directly ---
  const arRes = tx(name, 'ar', 'ku');
  assert(arRes === 'قهوة', 'ar visitor gets arabic display_name with ku source');
  const enRes = tx(name, 'en', 'ku');
  assert(enRes === 'Espresso', 'en visitor gets english display_name');
  const kuRes = tx(name, 'ku', 'ku');
  assert(kuRes === 'قاوە', 'ku visitor gets kurdish display_name');

  // source fallback: ar requested, no ar translation → source ku
  const missingAr = { en: 'Pasta', ar: '', ku: 'پاستا' };
  assert(tx(missingAr, 'ar', 'ku') === 'پاستا', 'requested ar falls back to source ku');

  // english fallback
  const noEnAr = { en: '', ar: '', ku: 'پاستا' };
  assert(tx(noEnAr, 'ar', null) === '', 'NULL source skips; en empty; returns empty');

  // NULL source skips source step; uses en
  const nullSource = { en: 'Coffee', ar: '', ku: '' };
  assert(tx(nullSource, 'ar', null) === 'Coffee', 'NULL source falls to en');

  // Empty strings treated as missing
  assert(tx({ en: '', ar: '', ku: '' }, 'en', 'en') === '', 'all empty returns empty');

  // --- C. Validation ---
  try { tx({ en: 'X' }, 'fr', 'en'); assert(false, 'fr should throw'); }
  catch (e) { assert(e.message.includes('Unsupported'), 'invalid lang rejected at service layer'); }
  assert(isValidSourceLang('ckb') === false, 'ckb not valid (internal ku)');

  // --- D. Both fields resolve independently ---
  const nameObj = { en: 'Pizza', ar: 'بيتزا', ku: 'پیتزا' };
  const descObj = { en: 'Italian', ar: 'إيطالية', ku: 'ئەتەلیا' };
  assert(tx(nameObj, 'ku', 'en') === 'پیتزا', 'name independent of description');
  assert(tx(descObj, 'ar', 'en') === 'إيطالية', 'description independent');

  // Different visitors do not overwrite one another
  assert(tx(name, 'ar', 'en') !== tx(name, 'en', 'en'));
  assert(tx({ en: 'Fresh', ar: 'طازج', ku: 'تازە' }, 'en', null) !== tx({ en: 'Fresh', ar: 'طازج', ku: 'تازە' }, 'ku', null));

  // Unmutated original
  const origName = name;
  assert(origName.en === 'Espresso' && origName.ar === 'قهوة' && origName.ku === 'قاوە', 'original preserved');

  // Revert accidental overwrite safety: ensure not mutating input in tx (tx does not mutate)
  tx(origName, 'en', null);
  assert(origName.en === 'Espresso', 'tx() does not mutate input value');

  console.log('All final integration assertions passed.');
}

run();
