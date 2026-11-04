const VALID_LANGS = ['ar', 'en', 'ku'];

/**
 * Centralized localization resolution (tx).
 * Priority: requested_lang > source_lang > 'en'.
 * Never uses Restaurants.language automatically when source_lang is NULL.
 * Rejects unsupported language codes.
 */
function tx(value, lang = 'en', sourceLang = null) {
  if (!VALID_LANGS.includes(lang)) {
    throw new Error(`Unsupported language code: ${lang}. Allowed: ${VALID_LANGS.join(', ')}`);
  }

  if (value == null) return '';
  if (typeof value === 'string') return value;

  // 1. Requested visitor language
  if (value[lang] && value[lang].trim() !== '') return value[lang];

  // 2. Source language (original content) — only if sourceLang is explicitly set
  if (sourceLang && VALID_LANGS.includes(sourceLang) && sourceLang !== lang) {
    if (value[sourceLang] && value[sourceLang].trim() !== '') return value[sourceLang];
  } else if (sourceLang === lang) {
    // If requested equals source, same as step 1 (already handled)
    // If sourceLang is same as lang but not present, fall through
  }

  // 3. English fallback (global compatibility)
  if (value.en && value.en.trim() !== '') return value.en;

  // 4. Return empty only if nothing found (approved architecture stops at en)
  return '';
}

function isValidSourceLang(val) {
  return val === null || val === undefined || (typeof val === 'string' && VALID_LANGS.includes(val));
}

module.exports = { tx, isValidSourceLang, VALID_LANGS };
