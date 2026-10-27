import { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Button } from '../../../shared/ui/ui.tsx'
import { useI18n } from '../../../shared/i18n'
import { PLANS } from '../../../shared/lib/demoData.ts'
import { money } from '../../../shared/lib/utils.ts'
import { publicUrl } from '../../../shared/lib/hooks.ts'

const CHEAPEST_PLAN_PRICE = Math.min(...PLANS.map((p) => p.price))

/**
 * "Typing your site name reveals pricing" moment — floats above the editor's
 * bottom edge once the draft has a name and no live subscription covers it.
 * The dismissal is remembered per slug, so renaming the site brings it back.
 */
export function PricingBubble({
  slug,
  onSubscribe,
}: {
  slug: string
  onSubscribe: () => void
}) {
  const { t } = useI18n()
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)

  if (dismissedFor === slug) return null

  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="pointer-events-none fixed inset-x-3 bottom-20 z-[70] mx-auto max-w-md"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-3xl border border-white/10 bg-ink px-4 py-3 shadow-[0_30px_70px_-35px_rgba(15,13,11,0.9)] sm:rounded-full sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="line-clamp-1 font-mono text-[12px] text-ivory/85">{publicUrl(slug)}</span>
            <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold">
              {t('flow.simulated')}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ivory/65">
            {t('flow.bubbleFrom', { price: money(CHEAPEST_PLAN_PRICE) })}
          </p>
        </div>

        <Button variant="accent" size="md" icon="card" onClick={onSubscribe} className="shrink-0">
          {t('flow.bubbleCta')}
        </Button>

        <button
          type="button"
          onClick={() => setDismissedFor(slug)}
          aria-label={t('common.close')}
          title={t('common.close')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ivory/60 transition hover:bg-white/10 hover:text-ivory"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </motion.div>
  )
}
