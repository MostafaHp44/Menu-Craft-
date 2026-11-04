import { Navigate, useLocation } from 'react-router-dom'
import { useBackendAuth } from '../store/useBackendAuth.ts'

export default function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const user = useBackendAuth((s) => s.user)
  const status = useBackendAuth((s) => s.status)
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return <div className="p-8 text-center">Loading session...</div>
  }

  if (!user) {
    return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (adminOnly && user.role !== 'super_admin' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
