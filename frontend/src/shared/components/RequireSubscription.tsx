import { Navigate } from 'react-router-dom'
import { useActiveRestaurant } from '../store/useStore.ts'
import { useSubscriptionStatus } from '../store/usePlatform.ts'

/**
 * يحمي الصفحات التي تتطلب اشتراكاً نشطاً (active/trialing).
 * إذا المطعم ليس له اشتراك أو الاشتراك فى حالة موقوفة (cancelled / expired / past_due)
 * → redirect إلى صفحة الباقات.
 */
export default function RequireSubscription({ children }: { children: React.ReactNode }) {
  const restaurant = useActiveRestaurant()
  // src/shared/lib/types.ts: isSubscriptionActive() == active || trialing
  const { isActive } = useSubscriptionStatus(restaurant.id)

  if (!isActive) {
    return <Navigate to="/dashboard/subscription" replace />
  }

  return <>{children}</>
}
