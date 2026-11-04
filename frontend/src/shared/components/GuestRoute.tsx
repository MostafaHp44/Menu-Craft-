import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuth.ts'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const location = useLocation()
  const search = new URLSearchParams(location.search)
  const next = search.get('next') || ''

  if (session) {
    const target = session.role === 'admin' ? '/admin' : (next && next.startsWith('/') ? next : '/dashboard')
    return <Navigate to={target} replace />
  }

  return <>{children}</>
}
