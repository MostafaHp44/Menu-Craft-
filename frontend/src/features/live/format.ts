import type { Lang } from '../../shared/i18n'

export function formatNumber(value: number | null | undefined, lang: Lang): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : lang === 'ku' ? 'ckb-IQ' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatDateTime(value: string | null | undefined, lang: Lang): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(lang === 'ar' ? 'ar-EG' : lang === 'ku' ? 'ckb-IQ' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'ku' ? 'ckb-IQ' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function daysAgoISO(days: number): string {
  const now = new Date()
  now.setDate(now.getDate() - days)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function shortId(value: string | null | undefined): string {
  if (!value) return '—'
  return value.length > 10 ? `${value.slice(0, 8)}…` : value
}
