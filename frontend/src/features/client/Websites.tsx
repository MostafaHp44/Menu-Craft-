import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../shared/store/useAuth.ts'
import { useStore } from '../../shared/store/useStore.ts'
import { useI18n } from '../../shared/i18n'
import { Button, Card, EmptyState } from '../../shared/ui/ui.tsx'
import { sitesAPI } from '../../shared/lib/api.service.ts'
import { tx } from '../../shared/lib/utils.ts'

/** Safe date formatting — returns an em-dash instead of "Invalid Date" when the value is missing or corrupt */
export function fmtDate(value: string | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export interface PlanUiState {
  maxSites: number | null
  used: number
  /** slots left: a number, 'unlimited' for unlimited plans, or null when the limit is reached */
  remaining: number | 'unlimited' | null
  overLimit: boolean
}

/**
 * Converts the plan summary from the server (or the legacy fallback when the
 * request fails) into the UI state. Pure and unit-testable — this exact
 * function is what useEffect below applies.
 */
export function planUiFromSummary(
  data: { used?: number; maxSites?: number | null; unlimited?: boolean } | null,
  fallbackUsed: number,
  legacyPlan?: string
): PlanUiState {
  if (data) {
    const used = data.used ?? 0
    if (data.unlimited) {
      return { maxSites: Infinity, used, remaining: 'unlimited', overLimit: false }
    }
    const max = data.maxSites ?? 1
    return {
      maxSites: max,
      used,
      remaining: used >= max ? null : max - used,
      overLimit: used >= max,
    }
  }
  // Fallback to old logic if API fails
  const max = legacyPlan === 'business' ? Infinity : legacyPlan === 'professional' ? 3 : 1
  return {
    maxSites: max,
    used: fallbackUsed,
    remaining: max === Infinity ? 'unlimited' : fallbackUsed >= max ? null : max - fallbackUsed,
    overLimit: max !== Infinity && fallbackUsed >= max,
  }
}

export default function Websites() {
  const { t, lang } = useI18n()
  const session = useAuthStore((s) => s.session)
  const restaurants = useStore((s) => s.restaurants)
  const userRest = restaurants.filter((r: any) => r.id === session?.restaurantId || r.restaurant_id === session?.restaurantId)
  const [maxSites, setMaxSites] = useState<number | null>(null)
  const [used, setUsed] = useState<number>(0)
  /** slots left: a number, 'unlimited' for unlimited plans, or null before load / at the limit */
  const [remaining, setRemaining] = useState<number | 'unlimited' | null>(null)
  const [overLimit, setOverLimit] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    const applyPlan = (ui: PlanUiState) => {
      setMaxSites(ui.maxSites)
      setUsed(ui.used)
      setRemaining(ui.remaining)
      setOverLimit(ui.overLimit)
    }
    const legacyPlan = (session as unknown as { plan?: string })?.plan

    // Fetch site summary from backend to get real plan limits
    sitesAPI.summary().then(
      (res: any) => {
        if (res.ok && res.data) {
          setPlan(res.data.plan?.id ?? null)
          applyPlan(planUiFromSummary(res.data, userRest.length, legacyPlan))
        }
      },
      () => {
        applyPlan(planUiFromSummary(null, userRest.length, legacyPlan))
      }
    )
  }, [session?.restaurantId])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboardNav.websites')}</h1>

      {/* Plan summary from backend */}
      {session?.restaurantId && (
        <div className="flex items-center gap-3 text-sm text-umber mb-4">
          <span>{t('billing.currentPlan')}: </span>
          {plan !== null && (
            <span>
              {plan === 'business' ? (
                <span>{t('billing.planBusiness')}</span>
              ) : plan === 'professional' ? (
                <span>{t('billing.planProfessional')}</span>
              ) : plan === 'trial' ? (
                <span>{t('billing.planFreeTrial')}</span>
              ) : (
                <span>Unknown</span>
              )}
            </span>
          )}
          {maxSites !== null && !isNaN(maxSites) && maxSites !== Infinity ? (
            <span>• {maxSites === 1 ? t('websites.sitesMaxOne') : t('websites.sitesMax', { max: maxSites })}</span>
          ) : maxSites === Infinity ? (
            <span>• {t('websites.unlimitedWebsites')}</span>
          ) : null}
        </div>
      )}

      {maxSites !== null && (
        <div className="flex items-center gap-3 text-sm text-umber">
          <span>
            {maxSites === Infinity
              ? t('websites.countUnlimited', { used })
              : t('websites.count', { used, max: maxSites })}
          </span>
          <span>·</span>
          <span>
            {remaining === 'unlimited'
              ? t('websites.unlimited')
              : remaining === null
              ? t('websites.noSlotsRemaining')
              : remaining === 1
              ? t('websites.slotsRemaining', { n: remaining })
              : t('websites.slotsRemainingPlural', { n: remaining })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userRest.map((r: any) => {
          const isPublished = r.status === 'published'
          const templateName = r.templateId ? t('websites.templateCustom') : t('websites.templateNone')

          return (
            <Card
              key={r.id}
              className="rounded-2xl border bg-card p-4 shadow-sm space-y-3"
            >
              {/* r.name is a TranslatedString {en, ar, ku} — tx() resolves it to a string for the active lang */}
              <div className="font-semibold truncate">{tx(r.name_en || r.name, lang)}</div>
              <div className="text-xs text-umber truncate">{r.slug}</div>

              <div className="grid grid-cols-2 gap-2 text-xs text-umber">
                <div>
                  <strong>{t('websites.templateLabel')}{' '}</strong>{templateName}
                </div>
                <div>
                  <strong>{t('common.status')}{' '}</strong>{isPublished
                    ? t('websites.liveSite')
                    : t('websites.draftSite')}
                </div>
              </div>

              <div className="flex gap-3 text-[11px] text-umber">
                <span>{t('websites.createdOn', { date: fmtDate(r.createdAt ?? r.created_at) })}</span>
                <span>{t('websites.updated', { date: fmtDate(r.updatedAt ?? r.updated_at) })}</span>
              </div>

              <div className="flex gap-2 text-xs">
                <Link
                  to={`/dashboard/editor?restaurantId=${r.id}`}
                  className="px-2 py-1 rounded-md bg-charcoal text-ivory"
                >
                  {t('websites.manage')}
                </Link>
                <a
                  href={`/site/${r.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-md bg-sand"
                >
                  {t('websites.preview')}
                </a>
                <Link
                  to={`/dashboard/menu?restaurantId=${r.id}`}
                  className="px-2 py-1 rounded-md border border-stone"
                >
                  {t('websites.editMenu')}
                </Link>
              </div>
            </Card>
          )
        })}

        {/* Create new website CTA */}
        {!overLimit && maxSites !== null && maxSites !== Infinity && (
          <Card
            className="rounded-2xl border border-dashed bg-cream/30 p-4 flex flex-col items-center justify-center gap-2"
          >
            <Button to="/dashboard/editor" size="sm">
              {t('websites.create')}
            </Button>
            {(() => {
              const slots = maxSites - used
              return (
                <p className="text-[12px] text-umber">
                  {slots === 1
                    ? t('websites.slotsRemaining', { n: slots })
                    : t('websites.slotsRemainingPlural', { n: slots })}
                </p>
              )
            })()}
          </Card>
        )}

        {/* Limit reached message */}
        {overLimit && maxSites !== null && maxSites !== Infinity && (
          <Card
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <p className="text-umber">{t('websites.maxTitle')}</p>
            <p className="text-[12px] text-amber-800">{t('websites.maxDesc', { max: maxSites })}</p>
            <Button to="/dashboard/subscription" size="sm" className="mt-2">
              {t('websites.upgradePlan')}
            </Button>
          </Card>
        )}

        {/* No plan case */}
        {!maxSites && (
          <EmptyState
            icon="alert"
            title={t('websites.emptyTitle')}
            message={t('websites.emptyDesc')}
            action={<Button size="sm" variant="outline" to="/dashboard/editor">
              {t('websites.create')}
            </Button>}
          />
        )}
      </div>
    </div>
  )
}
