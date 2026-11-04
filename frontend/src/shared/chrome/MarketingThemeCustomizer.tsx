import { useEffect, useState } from 'react'

type MarketingTheme = { background: string; text: string; border: string; primary: string }
const STORAGE_KEY = 'digital-menu.marketing-theme.v1'
const DEFAULT_THEME: MarketingTheme = {
  background: '#f5f3ee', text: '#111827', border: '#e7e2d6', primary: '#2563eb',
}

function readTheme(): MarketingTheme {
  try {
    return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch { return DEFAULT_THEME }
}

/** Applies only while the marketing home header is mounted. */
export function MarketingThemeCustomizer() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<MarketingTheme>(readTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('marketing-theme-active')
    root.style.setProperty('--marketing-bg', theme.background)
    root.style.setProperty('--marketing-text', theme.text)
    root.style.setProperty('--marketing-border', theme.border)
    root.style.setProperty('--marketing-primary', theme.primary)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    return () => {
      root.classList.remove('marketing-theme-active')
      ;['--marketing-bg', '--marketing-text', '--marketing-border', '--marketing-primary'].forEach(k => root.style.removeProperty(k))
    }
  }, [theme])

  const reset = () => setTheme(DEFAULT_THEME)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)} className="rounded-full border border-sand bg-paper px-3 py-2 text-sm font-medium text-charcoal hover:bg-cream" aria-expanded={open}>
        Theme
      </button>
      {open && <div className="absolute end-0 top-12 z-[60] w-72 rounded-2xl border border-sand bg-paper p-4 shadow-xl">
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
