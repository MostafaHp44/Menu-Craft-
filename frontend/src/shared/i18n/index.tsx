import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en, type Dict } from './locales/en'
import { ar } from './locales/ar'
import { ku } from './locales/ku'
import { clientTabs } from './locales/ext/clientTabs'
import { platform } from './locales/ext/platform'
import { kitchen } from './locales/ext/kitchen'
import { authFlow } from './locales/ext/authFlow'
import { marketing } from './locales/ext/marketing'
import { homePage } from './locales/ext/homePage'
import { designUi } from './locales/ext/design'

export type Lang = 'en' | 'ar' | 'ku'
export type Dir = 'ltr' | 'rtl'

/** extension namespaces, each owned by one build pass (parallel-edit safe) */
type ExtDict =
  (typeof clientTabs)['en'] &
  (typeof platform)['en'] &
  (typeof kitchen)['en'] &
  (typeof authFlow)['en'] &
  (typeof marketing)['en'] &
  (typeof homePage)['en'] &
  (typeof designUi)['en']

type FullDict = Dict & ExtDict

/** every dot-path that resolves to a string, e.g. `client.orders.title` */
export type TKey = {
  [K in keyof FullDict & string]: FullDict[K] extends string ? K : `${K}.${DeepKeys<FullDict[K]>}`
}[keyof FullDict & string]

type DeepKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DeepKeys<T[K]>}`
}[keyof T & string]

type Vars = Record<string, string | number>

const dictionaries: Record<Lang, FullDict> = {
  en: { ...en, ...clientTabs.en, ...platform.en, ...kitchen.en, ...authFlow.en, ...marketing.en, ...homePage.en, ...designUi.en },
  ar: { ...ar, ...clientTabs.ar, ...platform.ar, ...kitchen.ar, ...authFlow.ar, ...marketing.ar, ...homePage.ar, ...designUi.ar },
  ku: { ...ku, ...clientTabs.ku, ...platform.ku, ...kitchen.ku, ...authFlow.ku, ...marketing.ku, ...homePage.ku, ...designUi.ku },
}

export const LANGS: Array<{ id: Lang; native: string; dir: Dir }> = [
  { id: 'en', native: 'English', dir: 'ltr' },
  { id: 'ar', native: 'العربية', dir: 'rtl' },
  { id: 'ku', native: 'کوردی', dir: 'rtl' },
]

const STORAGE_KEY = 'menucraft-lang'

function pick(dict: unknown, path: string): string | undefined {
  let cur: unknown = dict
  for (const seg of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[seg]
  }
  return typeof cur === 'string' ? cur : undefined
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  )
}

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const code = navigator.language.toLowerCase()
  if (code.startsWith('ar')) return 'ar'
  if (code.startsWith('ku') || code.startsWith('ckb') || code.startsWith('kmr')) return 'ku'
  return 'en'
}

interface I18nValue {
  lang: Lang
  dir: Dir
  t: (key: TKey, vars?: Vars) => string
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return saved === 'en' || saved === 'ar' || saved === 'ku' ? saved : detectLang()
  })

  const dir: Dir = lang === 'en' ? 'ltr' : 'rtl'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* private mode — keep the in-memory language */
    }
  }, [lang, dir])

  const t = useCallback(
    (key: TKey, vars?: Vars) => {
      const value = pick(dictionaries[lang], key) ?? pick(en, key) ?? key
      if (value === key && import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`)
      return interpolate(value, vars)
    },
    [lang]
  )

  const value = useMemo<I18nValue>(() => ({ lang, dir, t, setLang: setLangState }), [lang, dir, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** shortcut for components that only need the translator */
export function useT() {
  return useI18n().t
}
