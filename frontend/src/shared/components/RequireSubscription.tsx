import { Navigate } from 'react-router-dom'
import { useSubscription } from '../store/usePlatform.ts'
import { useActiveRestaurant } from '../store/useStore.ts'

/**
 * يحميwegات تتطلب اشتراك فعال (active/trialing).
 * لو المطعم غير مشترك أو الاشتراك منتهي → يجري redirect إلى صفحة الباقات.
 */
export default function RequireSubscription({ children }: { children: React.ReactNode }) {
  const restaurant = useActiveRestaurant()
  const record = useSubscription(restaurant.id)
  const isLive = Boolean(record && record.status !== 'expired')

  if (!isLive) {
    return <Navigate to="/dashboard/subscription" replace />
  }

  return <>{children}</>
}
