import { LANGS, useI18n } from '../i18n'
import { cx } from '../lib/utils'

const SHORT: Record<string, string> = { en: 'EN', ar: 'ع', ku: 'ک' }

/** Compact EN / عربي / کوردی pill — works on light and dark bars. */
export function LanguageSwitcher({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark'
  className?: string
}) {
  const { lang, setLang, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={cx(
        /* same rule the design system uses: a `hidden` className must win */
        !className?.includes('hidden') && 'inline-flex',
        'items-center gap-0.5 rounded-full border p-0.5',
        tone === 'dark'
          ? 'border-white/12 bg-white/8 text-ivory/70'
          : 'border-sand bg-cream/70 text-umber',
        className
      )}
    >
      {LANGS.map((l) => {
        const active = l.id === lang
        return (
          <button
            key={l.id}
            type="button"
            title={l.native}
            aria-label={l.native}
            aria-pressed={active}
            onClick={() => setLang(l.id)}
            className={cx(
              'h-7 min-w-8 rounded-full px-2 text-[12px] font-semibold transition-all duration-200',
              active
                ? 'bg-charcoal text-ivory shadow-sm'
                : 'hover:text-charcoal hover:bg-white/70'
            )}
          >
            {SHORT[l.id]}
          </button>
        )
      })}
    </div>
  )
}
