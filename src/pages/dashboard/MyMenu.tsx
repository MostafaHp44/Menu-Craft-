import { MenuEditor } from '../../components/menu/MenuEditor'
import { Button, Card } from '../../components/ui'
import { publicUrl } from '../../lib/hooks'
import { useActiveRestaurant, useStore } from '../../store/useStore'

export default function MyMenu() {
  const r = useActiveRestaurant()
  const dirty = useStore((s) => s.dirty)
  const itemCount = r.menu.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-[16px] font-semibold text-charcoal">{r.name} · menu structure</h2>
          <p className="mt-1 text-[13.5px] text-umber">
            {r.menu.length} categories · {itemCount} dishes · live at{' '}
            <span className="font-mono text-[13px] text-charcoal">{publicUrl(r.slug)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to="/dashboard/editor" variant="outline" size="sm" icon="layout" iconRight="arrowRight">
            Visual editor
          </Button>
          <Button to="/menu-demo" size="sm" icon="external">
            View public menu
          </Button>
        </div>
      </Card>

      {dirty ? (
        <div className="flex items-center gap-3 rounded-2xl border border-gold/35 bg-gold/8 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 8v5" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1" fill="currentColor" />
              <path d="M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </span>
          <p className="text-[13.5px] text-espresso">
            Editing the working draft — the public menu keeps showing the last published version until you save
            or publish.
          </p>
        </div>
      ) : null}

      <Card className="p-4 sm:p-6">
        <MenuEditor showActions />
      </Card>
    </div>
  )
}
