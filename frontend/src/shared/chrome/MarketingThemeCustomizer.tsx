import { useEffect, useState } from 'react'
import { Icon } from '../ui/icons.tsx'

type MarketingTheme = { background: string; text: string; border: string; primary: string }
const STORAGE_KEY = 'digital-menu.marketing-theme.v1'

function defaultsFromCss(): MarketingTheme {
  const read = (name: string, fallback: string) => (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback)
  return {
    background: read('--color-ivory', '#faf7f1'),
    text: read('--color-charcoal', '#1b1714'),
    border: read('--color-sand', '#e9e1d4'),
    primary: read('--color-flame', '#0e0ad8'),
  }
}

/** The stylesheet values captured before the first override (used for Reset). */
let originalTheme: MarketingTheme | null = null

function readTheme(): MarketingTheme {
  if (!originalTheme) originalTheme = defaultsFromCss()
  try {
    return { ...originalTheme, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch { return originalTheme }
}

/** Applies only while the marketing home header is mounted. Local (per-browser) override. */
export function MarketingThemeCustomizer() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<MarketingTheme>(readTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('marketing-theme-active')
    root.style.setProperty('--color-ivory', theme.background)
    root.style.setProperty('--color-charcoal', theme.text)
    root.style.setProperty('--color-sand', theme.border)
    root.style.setProperty('--color-flame', theme.primary)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    return () => {
      root.classList.remove('marketing-theme-active')
      ;['--color-ivory', '--color-charcoal', '--color-sand', '--color-flame'].forEach(k => root.style.removeProperty(k))
    }
  }, [theme])

  const reset = () => setTheme(originalTheme ?? defaultsFromCss())
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sand bg-paper px-3 text-sm font-medium text-charcoal hover:bg-cream" aria-expanded={open} aria-label="Theme">
        <Icon name="palette" size={18} />
        <span className="hidden sm:inline">Theme</span>
      </button>
      {open && <div className="fixed inset-x-4 top-20 z-[70] rounded-2xl border border-sand bg-paper p-4 shadow-xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-12 sm:w-72">
        <p className="mb-3 text-sm font-semibold text-charcoal">Marketing website theme</p>
        {([['background', 'Background'], ['text', 'Text'], ['primary', 'Buttons & elements'], ['border', 'Borders']] as const).map(([key, label]) => (
          <label key={key} className="mb-2 flex items-center justify-between gap-3 text-sm text-espresso">
            {label}<input type="color" value={theme[key]} onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))} aria-label={label} />
          </label>
        ))}
        <button type="button" onClick={reset} className="mt-2 text-sm font-medium text-flame underline">Reset to default</button>
      </div>}
    </div>
  )
}
