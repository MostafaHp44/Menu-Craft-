import { useEffect, useState, useCallback } from 'react'
import { sitesAPI, ApiError } from '../../shared/api/service'
import type { SiteCard, SitePlanSummary } from '../../shared/lib/api-types'

export function useSites() {
  const [sites, setSites] = useState<SiteCard[]>([])
  const [summary, setSummary] = useState<SitePlanSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, sumRes] = await Promise.all([
        sitesAPI.list(),
        sitesAPI.summary(),
      ])
      setSites((listRes.data as SiteCard[]) || [])
      setSummary(sumRes.data as SitePlanSummary)
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Session expired — please sign in again.')
      } else {
        setError(e?.message || 'Failed to load websites.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { sites, summary, loading, error, refresh, setError }
}
