import { useEffect, useState } from 'react'
import { Icon } from '../../shared/ui/icons.tsx'
import { MarketingFooter } from '../../shared/chrome/MarketingFooter.tsx'
import { MarketingHeader } from '../../shared/chrome/MarketingHeader.tsx'
import { Badge, Button } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { cx } from '../../shared/lib/utils.ts'
import { billingAPI } from '../../shared/lib/api.service.ts'

type Mode = 'live' | 'static'

interface PublicPlan {
  id: string
  name: string
  price: number
  currency?: string
  interval_type: string
  mode?: Mode
  max_restaurants: number
  max_menu_items: number
  features: string[]
  is_active: boolean | number
}

function intervalText(t: (k: string, v?: Record<string, string | number>) => string, interval: string) {
  if (interval === 'month') return t('home.pricing.perMonth')
  if (interval === 'year') return t('common.perYear')
  return t('home.pricing.forever')
}

/**
 * صفحة الباقات المخصّصة: كل الباقات الست (3 Live + 3 Static) مقسّمة حسب المنتج.
 * يقودها الزر الموجود بعد قسم أول 3 باقات في الصفحة الرئيسية.
 */
export default function PlansPage() {
  const { t } = useI18n()
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    billingAPI
      .listPlans()
      .then((res) => {
        if (!alive) return
        const rows = Array.isArray(res?.data) ? res.data : []
        setPlans(
          rows.filter((p: any) => String(p?.is_active) === '1' || p?.is_active === true) as PublicPlan[]
        )
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const live = plans.filter((p) => (p.mode || 'live') === 'live')
  const stat = plans.filter((p) => (p.mode || 'live') === 'static')

  const group = (list: PublicPlan[], mode: Mode) => (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      {list.map((plan) => {
        const highlight = mode === 'live' && plan.name.toLowerCase() === 'professional'
        return (
          <div
            key={plan.id}
            className={cx(
              'flex flex-col rounded-3xl border p-7 transition duration-300',
              highlight
                ? 'border-charcoal bg-charcoal text-ivory shadow-[0_50px_90px_-60px_rgba(15,13,11,1)]'
                : 'border-sand bg-paper hover:border-clay'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.14em]">{plan.name}</h3>
              <span className="flex items-center gap-1.5">
                <span
                  className={cx(
                    'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
                    mode === 'static'
                      ? 'bg-sand text-espresso'
                      : highlight
                        ? 'bg-ivory/15 text-ivory'
                        : 'bg-moss/12 text-moss'
                  )}
                >
                  {t(mode === 'static' ? 'home.pricing.modeStatic' : 'home.pricing.modeLive')}
                </span>
                {highlight ? (
                  <span className="rounded-full bg-flame px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    {t('home.pricing.mostPopular')}
                  </span>
                ) : null}
              </span>
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="display-serif text-[52px] leading-none">
                {plan.price === 0 ? t('home.pricing.free') : `$${plan.price}`}
              </span>
              <span
                className={cx(
                  'pb-1.5 text-[13.5px]',
                  highlight ? 'text-ivory/55' : 'text-umber'
                )}
              >
                {intervalText(t, plan.interval_type)}
              </span>
            </div>

            <ul
              className={cx(
                'mt-6 flex-1 space-y-3 border-t pt-6 text-[14.5px]',
                highlight ? 'border-ivory/12' : 'border-sand'
              )}
            >
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <span
                    className={cx(
                      'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full',
                      highlight ? 'bg-flame text-white' : 'bg-moss/12 text-moss'
                    )}
                  >
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                  <span className={highlight ? 'text-ivory/85' : 'text-espresso'}>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-clay">
              <span>
                {t('subscription.maxSites')}: {plan.max_restaurants === -1 ? '∞' : plan.max_restaurants}
              </span>
              <span>
                {t('subscription.maxItems')}: {plan.max_menu_items === -1 ? '∞' : plan.max_menu_items}
              </span>
            </div>

            <div className="mt-7">
              <Button
                full
                size="lg"
                variant={highlight ? 'accent' : 'outline'}
                to={`/signin?mode=signup&plan=${encodeURIComponent(plan.id)}`}
              >
                {plan.price === 0
                  ? t('web.plans.startFree')
                  : t('web.plans.choose', { name: plan.name })}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-ivory">
      <MarketingHeader solid themeEnabled />

      {/* -------------------------------- head -------------------------------- */}
      <section className="relative overflow-hidden border-b border-sand/70 pb-14 pt-[118px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(232,87,31,0.12),transparent_65%)]"
        />
        <div className="page relative">
          <div className="max-w-3xl">
            <span className="eyebrow flex items-center gap-2">
              <span className="h-px w-6 bg-current opacity-50" />
              {t('web.plans.eyebrow')}
              <span className="h-px w-6 bg-current opacity-50" />
            </span>
            <h1 className="display-serif mt-4 text-[clamp(34px,5vw,56px)] leading-[1.04] tracking-[-0.02em] text-charcoal">
              {t('web.plans.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-umber">
              {t('web.plans.sub')}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Badge tone="gold" icon="info">
                {t('home.pricing.demoBadge')}
              </Badge>
              <Button to="/" variant="outline" size="sm" icon="arrowLeft">
                {t('web.plans.backHome')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ the six plans ------------------------- */}
      <section className="py-16 lg:py-20">
        <div className="page">
          {loading ? (
            <p className="py-10 text-center text-[14px] text-umber">{t('branches.loading')}</p>
          ) : failed || plans.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-umber">{t('common.error')}</p>
          ) : (
            <>
              <div className="max-w-2xl">
                <h2 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-charcoal">
                  {t('web.plans.liveGroup')}
                </h2>
                <p className="mt-2 text-[15px] text-umber">{t('web.plans.liveGroupSub')}</p>
              </div>
              {group(live, 'live')}

              <div className="mt-16 max-w-2xl">
                <h2 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-charcoal">
                  {t('web.plans.staticGroup')}
                </h2>
                <p className="mt-2 text-[15px] text-umber">{t('web.plans.staticGroupSub')}</p>
              </div>
              {group(stat, 'static')}
            </>
          )}

          <div className="mt-16 rounded-3xl border border-sand bg-paper p-8 text-center">
            <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-charcoal">
              {t('web.plans.createAccount')}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-[14.5px] leading-relaxed text-umber">
              {t('flow.planStepSub')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button to="/signin?mode=signup" size="lg" variant="accent" iconRight="arrowRight">
                {t('web.plans.createAccount')}
              </Button>
              <Button to="/templates" size="lg" variant="outline" icon="layers">
                {t('flow.browseFirst')}
              </Button>
            </div>
            <p className="mt-5 text-[13px] text-clay">{t('web.plans.footerNote')}</p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
