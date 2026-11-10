import { useEffect, useRef } from 'react'
import { useSession } from '../../shared/store/useSession.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { apiFetch } from '../../shared/lib/api.service.ts'
import { ordersApi } from '../../shared/api/client.ts'

/**
 * Polls for new pending orders every 5 seconds and rings a bell when one appears.
 * Works for staff (workspace) and super_admin (admin dashboard).
 * Respects the `ringEnabled` localStorage flag (default: on).
 */
export default function OrderRingNode({ scope }: { scope: 'staff' | 'admin' }) {
  const user = useSession((state) => state.user)
  const backendUser = { role: scope === 'admin' ? 'super_admin' : user?.role }
  const showToast = useStore((s) => s.showToast)
  const previousIdsRef = useRef<Set<string>>(new Set())
  const previousCountRef = useRef<number>(0)
  const initializedRef = useRef<boolean>(false)

  useEffect(() => {
    const enabled = localStorage.getItem('ringEnabled') !== 'false'
    if (!enabled) return

    let cancelled = false

    const ring = () => {
      if (!enabled) return
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const play = (freq: number, start: number, duration: number, gain = 0.18) => {
          const oscillator = ctx.createOscillator()
          const gainNode = ctx.createGain()
          oscillator.connect(gainNode)
          gainNode.connect(ctx.destination)
          oscillator.type = 'triangle'
          oscillator.frequency.value = freq
          gainNode.gain.setValueAtTime(0.0001, ctx.currentTime + start)
          gainNode.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02)
          gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
          oscillator.start(ctx.currentTime + start)
          oscillator.stop(ctx.currentTime + start + duration + 0.05)
        }
        // Two-tone notification: high-low-high-low
        play(880, 0, 0.18, 0.22)
        play(660, 0.28, 0.18, 0.22)
        play(880, 0.56, 0.18, 0.22)
        play(660, 0.84, 0.18, 0.22)
      } catch {
        // ignore audio errors
      }
    }

    const tick = async () => {
      try {
        if (scope === 'admin') {
          const result = await apiFetch<{ ok: boolean; data?: { count: number } }>('/api/admin/orders/pending-count')
          const count = Number(result?.data?.count || 0)
          if (!cancelled) {
            if (!initializedRef.current) {
              initializedRef.current = true
              previousCountRef.current = count
              return
            }
            if (count > previousCountRef.current) {
              ring()
              useStore.getState().showToast({
                title: 'New order received',
                message: `${count - previousCountRef.current} new order${count - previousCountRef.current > 1 ? 's' : ''} waiting for confirmation`,
                tone: 'success',
              })
            }
            previousCountRef.current = count
          }
        } else {
          const orders = await ordersApi.list({ status: 'pending' })
          if (cancelled) return
          const ids = new Set(orders.map((order) => order.id))

          if (!initializedRef.current) {
            initializedRef.current = true
            previousIdsRef.current = ids
            return
          }

          const newIds = [...ids].filter((id) => !previousIdsRef.current.has(id))
          if (newIds.length > 0) {
            ring()
            useStore.getState().showToast({
              title: 'New order received',
              message: `${newIds.length} new order${newIds.length > 1 ? 's' : ''} waiting for confirmation`,
              tone: 'success',
            })
          }
          previousIdsRef.current = ids
        }
      } catch {
        // ignore errors during polling
      }
    }

    void tick()
    const interval = window.setInterval(tick, 5000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [scope, backendUser.role, showToast])

  return null
}
