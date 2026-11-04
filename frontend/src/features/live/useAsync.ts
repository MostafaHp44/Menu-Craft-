import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { errorMessage } from '../../shared/api/client.ts'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Small read-only data loader for the live workspace. Cancels late results
 * when dependencies change so a slow response cannot overwrite newer data.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    loaderRef
      .current()
      .then((value) => {
        if (alive) setData(value)
      })
      .catch((reason: unknown) => {
        if (alive) setError(errorMessage(reason))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [...deps, nonce])

  const refresh = useCallback(() => setNonce((value) => value + 1), [])

  return { data, loading, error, refresh }
}
