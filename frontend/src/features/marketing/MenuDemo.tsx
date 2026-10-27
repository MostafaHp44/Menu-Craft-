import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { RestaurantSite } from '../../templates/site/RestaurantSite.tsx'
import { Button } from '../../shared/ui/ui.tsx'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'

export default function MenuDemo() {
  const r = useActiveRestaurant()
  const dirty = useStore((s) => s.dirty)
  const publishDemo = useStore((s) => s.publishDemo)

  return (
    <div
      className="demo-page min-h-screen bg-ivory"
      style={{ '--demo-chrome': '53px' } as CSSProperties}
    >
      {/* ---------------------- simulated browser chrome ---------------------- */}
      <div className="sticky top-0 z-50 border-b border-black/40 bg-ink text-ivory shadow-[0_10px_30px_-24px_rgba(0,0,0,0.9)]">
        <div className="flex h-[53px] items-center gap-3 px-3 sm:px-4">
          <Link
            to="/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ivory/70 transition hover:bg-white/10 hover:text-ivory"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <Icon name="arrowLeft" size={17} />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true" className="shrink-0">
              <rect x="1" y="6" width="10" height="7" rx="2" fill="#8FB9A6" />
              <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke="#8FB9A6" strokeWidth="1.6" />
            </svg>
            <span className="line-clamp-1 font-mono text-[12.5px] text-ivory/85">{publicUrl(r.slug)}</span>
            <span className="hidden shrink-0 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold sm:inline">
              simulated
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/dashboard/qr-code"
              className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-ivory/70 transition hover:bg-white/10 hover:text-ivory sm:flex"
            >
              <Icon name="qr" size={15} />
              QR
            </Link>
            <Link
              to="/dashboard"
              className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-ivory/70 transition hover:bg-white/10 hover:text-ivory md:flex"
            >
              <Icon name="home" size={15} />
              Dashboard
            </Link>
            <Button to="/dashboard/editor" size="sm" variant="accent" icon="pencil">
              <span className="hidden sm:inline">Edit menu</span>
            </Button>
          </div>
        </div>

        {/* draft / unsaved notices */}
        {dirty ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/25 bg-gold/12 px-4 py-2">
            <span className="flex items-center gap-2 text-[12.5px] font-medium text-gold">
              <Icon name="alert" size={14} />
              You have unpublished changes — the public page below still shows the saved version.
            </span>
            <div className="flex gap-2">
              <Link to="/dashboard/editor" className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-ivory transition hover:bg-white/20">
                Open editor
              </Link>
              <button
                type="button"
                onClick={() => publishDemo()}
                className="rounded-full bg-gold px-3 py-1 text-[12px] font-semibold text-ink transition hover:brightness-105"
              >
                Publish now
              </button>
            </div>
          </div>
        ) : null}

        {!dirty && r.status === 'draft' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/6 px-4 py-2">
            <span className="flex items-center gap-2 text-[12.5px] text-ivory/75">
              <Icon name="info" size={14} />
              This menu is saved as a draft. Publishing makes it the shared version.
            </span>
            <button
              type="button"
              onClick={() => publishDemo()}
              className="rounded-full bg-flame px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-flame-dark"
            >
              Publish demo
            </button>
          </div>
        ) : null}
      </div>

      {/* ----------------------------- the menu site --------------------------- */}
      <RestaurantSite restaurant={r} interactive mode="site" idPrefix="demo-" />

      {/* ------------------------------ floating bar --------------------------- */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between gap-3 p-4">
        <span className="pointer-events-auto hidden rounded-full border border-sand bg-paper/90 px-3.5 py-2 text-[11.5px] font-medium text-umber shadow-[0_18px_40px_-30px_rgba(15,13,11,0.8)] backdrop-blur sm:inline-flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-moss anim-pulse-dot" />
            Rendered from your saved MenuCraft configuration
          </span>
        </span>
        <span className="pointer-events-auto ms-auto flex gap-2">
          <Button to="/" size="sm" variant="outline" icon="arrowLeft" className="bg-paper/95 backdrop-blur">
            MenuCraft
          </Button>
        </span>
      </div>
    </div>
  )
}
