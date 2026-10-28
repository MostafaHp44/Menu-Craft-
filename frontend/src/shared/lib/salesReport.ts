/**
 * Pure helpers behind the super-admin Sales tab:
 *  - per-dish revenue / simulated-profit breakdown
 *  - daily first & last order times (real orders first, demo fallback otherwise)
 *
 * No React and no store imports — callers pass the orders and the reporting
 * series in, so everything stays deterministic and easy to test.
 */
import type { DemoPlanId, Order, SalesPoint, SalesSeries } from './types.ts'

/* ----------------------------- deterministic ----------------------------- */

/** Tiny FNV-1a hash — stable across reloads (never Math.random). */
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** deterministic 0..1 ratio for a key */
function ratio(str: string): number {
  return (hash(str) % 1_000_000) / 1_000_000
}

const COST_MIN = 0.25
const COST_MAX = 0.4

/**
 * Simulated food-cost share of revenue for an item (0.25–0.40).
 * `MenuItem` has no real cost field — these figures are demo-only.
 */
export function costRatio(itemId: string): number {
  return COST_MIN + ratio(`cost:${itemId}`) * (COST_MAX - COST_MIN)
}

/* ---------------------------- dish breakdown ----------------------------- */

export interface DishRow {
  itemId: string
  name: string
  qty: number
  /** Σ price × qty */
  revenue: number
  /** revenue × (1 − costRatio(itemId)) — simulated */
  profit: number
  /** % of total revenue (0–100) */
  share: number
}

export interface DishTotals {
  revenue: number
  profit: number
  qty: number
  /** profit / revenue × 100 */
  margin: number
}

export interface DishBreakdown {
  rows: DishRow[]
  totals: DishTotals
}

/** Aggregates every given order into per-dish rows, sorted by revenue desc. */
export function buildDishBreakdown(orders: Order[]): DishBreakdown {
  const byItem = new Map<string, { name: string; qty: number; revenue: number }>()

  for (const order of orders) {
    for (const line of order.lines) {
      if (line.qty <= 0) continue
      const seen = byItem.get(line.itemId)
      if (seen) {
        seen.qty += line.qty
        seen.revenue += line.price * line.qty
      } else {
        byItem.set(line.itemId, {
          name: line.name,
          qty: line.qty,
          revenue: line.price * line.qty,
        })
      }
    }
  }

  const rows: DishRow[] = [...byItem.entries()].map(([itemId, agg]) => ({
    itemId,
    name: agg.name,
    qty: agg.qty,
    revenue: agg.revenue,
    profit: agg.revenue * (1 - costRatio(itemId)),
    share: 0,
  }))

  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0)
  const profit = rows.reduce((sum, row) => sum + row.profit, 0)
  const qty = rows.reduce((sum, row) => sum + row.qty, 0)
  for (const row of rows) row.share = revenue > 0 ? (row.revenue / revenue) * 100 : 0
  rows.sort((a, b) => b.revenue - a.revenue)

  return {
    rows,
    totals: {
      revenue,
      profit,
      qty,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    },
  }
}

/* ------------------------------ daily timing ----------------------------- */

export interface TimingRow {
  /** local date, YYYY-MM-DD */
  date: string
  first: string | null
  last: string | null
  orders: number
  revenue: number
  /** true when no real order sits on that day (times/numbers from the demo series) */
  simulated: boolean
}

export interface DailyTimingOptions {
  restaurantId: string
  plan: DemoPlanId
  series: SalesSeries
  /** the client's real orders — the tab reads them from the store */
  orders: Order[]
  /** how many days back to report, newest first (default 14) */
  days?: number
}

/** local YYYY-MM-DD — never slice the ISO string (timezone safe). */
function localDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** local HH:MM, zero padded */
function clock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const FIRST_START = 8 * 60 // 08:00
const FIRST_SPAN = 150 // …→ 10:30
const LAST_START = 19 * 60 // 19:00
const LAST_SPAN = 210 // …→ 22:30

function clockAt(key: string, start: number, span: number): string {
  const minutes = start + Math.floor(ratio(key) * (span + 1))
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/**
 * Last N days (newest first). Days holding ≥1 real order report their real
 * first/last times, order count and revenue; empty days fall back to
 * deterministic demo times plus the matching `series.daily` point.
 */
export function buildDailyTiming(opts: DailyTimingOptions): TimingRow[] {
  const { restaurantId, series, orders } = opts
  const days = opts.days ?? 14

  const byDay = new Map<string, Order[]>()
  for (const order of orders) {
    const key = localDay(new Date(order.createdAt))
    const bucket = byDay.get(key)
    if (bucket) bucket.push(order)
    else byDay.set(key, [order])
  }

  const seriesByDate = new Map<string, SalesPoint>()
  for (const point of series.daily) seriesByDate.set(point.date, point)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows: TimingRow[] = []
  for (let i = 0; i < days; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const date = localDay(day)

    const real = byDay.get(date)
    if (real && real.length > 0) {
      const times = real.map((o) => new Date(o.createdAt)).sort((a, b) => a.getTime() - b.getTime())
      rows.push({
        date,
        first: clock(times[0]),
        last: clock(times[times.length - 1]),
        orders: real.length,
        revenue: real.reduce((sum, o) => sum + o.total, 0),
        simulated: false,
      })
      continue
    }

    const point = seriesByDate.get(date)
    rows.push({
      date,
      first: clockAt(`first:${restaurantId}:${date}`, FIRST_START, FIRST_SPAN),
      last: clockAt(`last:${restaurantId}:${date}`, LAST_START, LAST_SPAN),
      orders: point?.orders ?? 0,
      revenue: point?.revenue ?? 0,
      simulated: true,
    })
  }
  return rows
}
