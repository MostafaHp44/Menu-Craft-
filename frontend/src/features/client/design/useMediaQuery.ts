import { useEffect, useState } from 'react'

/**
 * Tracks a CSS media query so the page can pick a phone-first default
 * (preview height, default device) without duplicating Tailwind's
 * breakpoints by hand. Falls back to `false` outside the browser.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
