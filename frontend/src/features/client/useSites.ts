import { useEffect, useState, useCallback } from 'react'
import { sitesAPI, ApiError } from '../../shared/api/service'
import type { SiteCard, SiteSummary } from '../../shared/lib/api-types'

export function useSites() {
  const [sites, setSites] = useState<SiteCard[]>([])
  const [summary, setSummary] = useState<SiteSummary | null>(null)
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
      setSites((listRes.sites as SiteCard[]) || [])
      setSummary(sumRes as SiteSummary)
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
