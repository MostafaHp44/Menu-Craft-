import { useState } from 'react'
import { Icon } from '../../components/icons'
import { Badge, Button, Card, Field, IconButton, Input, Modal, Segmented, Toggle } from '../../components/ui'
import { publicUrl } from '../../lib/hooks'
import { cx } from '../../lib/utils'
import { useActiveRestaurant, useStore } from '../../store/useStore'

export default function SettingsPage() {
  const r = useActiveRestaurant()
  const restaurants = useStore((s) => s.restaurants)
  const updateSaved = useStore((s) => s.updateSaved)
  const resetDemo = useStore((s) => s.resetDemo)
  const discardDraft = useStore((s) => s.discardDraft)
  const showToast = useStore((s) => s.showToast)
  const dirty = useStore((s) => s.dirty)

  const [resetOpen, setResetOpen] = useState(false)
  const [slugDraft, setSlugDraft] = useState(r.slug)

  const patch = (recipe: (target: typeof r) => void) => updateSaved(recipe)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${r.slug}-menucraft-config.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(link.href), 2000)
    showToast({ title: 'Configuration exported', message: 'A JSON snapshot was downloaded.', tone: 'success' })
  }

  const validSlug = /^[a-z0-9-]{3,32}$/.test(slugDraft)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* identity */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15.5px] font-semibold text-charcoal">Restaurant details</h3>
          <Badge tone={r.status === 'published' ? 'moss' : 'gold'}>
            {r.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Display name">
            <Input value={r.name} onChange={(e) => patch((t) => { t.name = e.target.value })} />
          </Field>

          <Field label="Public address" hint={validSlug ? 'available' : '3–32 lowercase chars'}>
            <div className="flex items-stretch gap-2">
              <Input
                value={slugDraft}
                spellCheck={false}
                aria-invalid={!validSlug}
                onChange={(e) => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className={cx(!validSlug && 'border-rose focus:border-rose focus:ring-rose/15')}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-11 shrink-0"
                disabled={!validSlug || slugDraft === r.slug}
                onClick={() => {
                  patch((t) => { t.slug = slugDraft })
                  showToast({ title: 'Address updated', message: `${slugDraft}.menucraft.com`, tone: 'success' })
                }}
              >
                Apply
              </Button>
            </div>
          </Field>

          <div className="rounded-xl border border-sand bg-cream/60 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-espresso">Live address</div>
                <div className="line-clamp-1 font-mono text-[13px] text-charcoal">{publicUrl(r.slug)}</div>
              </div>
              <Button to="/menu-demo" size="sm" variant="ghost" icon="external">
                Open
              </Button>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-clay">
              Simulated subdomain — MenuCraft never provisions DNS in this prototype.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-sand p-3.5">
            <Toggle
              label="Publish status"
              description="Published sites are visible on the public menu page"
              checked={r.status === 'published'}
              onChange={(v) =>
                patch((t) => {
                  t.status = v ? 'published' : 'draft'
                })
              }
            />
            <div className="border-t border-sand/70 pt-3">
              <Segmented
                full
                size="sm"
                value={r.plan}
                onChange={(v) =>
                  patch((t) => {
                    t.plan = v
                  })
                }
                options={[
                  { value: 'trial', label: 'Trial' },
                  { value: 'starter', label: 'Starter' },
                  { value: 'professional', label: 'Pro' },
                  { value: 'business', label: 'Business' },
                ]}
              />
              <p className="mt-2 text-[11.5px] text-clay">Demo plan label — no billing attached.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* socials */}
      <Card className="p-5 sm:p-6">
        <h3 className="text-[15.5px] font-semibold text-charcoal">Social links</h3>
        <p className="mt-1 text-[13px] text-umber">Shown in the footer of the public menu.</p>

        <div className="mt-4 space-y-4">
          <Field label="Instagram">
            <Input
              value={r.socials.instagram}
              onChange={(e) => patch((t) => { t.socials.instagram = e.target.value })}
            />
          </Field>
          <Field label="Facebook">
            <Input
              value={r.socials.facebook}
              onChange={(e) => patch((t) => { t.socials.facebook = e.target.value })}
            />
          </Field>
          <Field label="Website">
            <Input
              value={r.socials.website}
              onChange={(e) => patch((t) => { t.socials.website = e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 border-t border-sand/70 pt-5">
          <h3 className="text-[15.5px] font-semibold text-charcoal">Opening hours</h3>
          <div className="mt-3 space-y-2">
            {r.hours.map((row, index) => (
              <div key={row.day} className="flex items-center gap-2">
                <Input
                  value={row.day}
                  aria-label={`Day ${index + 1}`}
                  onChange={(e) =>
                    patch((t) => {
                      t.hours[index].day = e.target.value
                    })
                  }
                  className="h-10 flex-1"
                />
                <Input
                  value={row.hours}
                  aria-label={`Hours ${index + 1}`}
                  onChange={(e) =>
                    patch((t) => {
                      t.hours[index].hours = e.target.value
                    })
                  }
                  className="h-10 flex-1"
                />
                <IconButton
                  icon="trash"
                  label="Remove row"
                  size={15}
                  onClick={() =>
                    patch((t) => {
                      t.hours = t.hours.filter((_, i) => i !== index)
                    })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            icon="plus"
            className="mt-3"
            onClick={() =>
              patch((t) => {
                t.hours.push({ day: 'New day', hours: '00:00 – 00:00' })
              })
            }
          >
            Add row
          </Button>
        </div>
      </Card>

      {/* demo data */}
      <Card className="p-5 sm:p-6 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[15.5px] font-semibold text-charcoal">Demo data & privacy</h3>
            <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-umber">
              Everything in this prototype lives in your browser’s local storage. No account, no server, no
              analytics. {restaurants.length} restaurant configurations are stored on this device.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" icon="download" onClick={exportJson}>
              Export config
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon="refresh"
              disabled={!dirty}
              onClick={() => {
                discardDraft()
                showToast({ title: 'Draft discarded', message: 'Back to the last saved version.', tone: 'info' })
              }}
            >
              Discard draft
            </Button>
            <Button size="sm" variant="danger" icon="refresh" onClick={() => setResetOpen(true)}>
              Reset demo
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: 'save', title: 'Local storage', text: 'menucraft-demo-v1' },
            { icon: 'users', title: 'Accounts', text: 'None — sign-in is simulated' },
            { icon: 'globe', title: 'Hosting', text: 'No site is really deployed' },
          ].map((note) => (
            <div key={note.title} className="flex items-start gap-3 rounded-xl border border-sand bg-cream/50 p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-umber">
                <Icon name={note.icon} size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-charcoal">{note.title}</span>
                <span className="line-clamp-1 text-[12px] text-umber">{note.text}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset the whole demo?"
        description="Restores the three seed restaurants, their menus and designs to their original state."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon="refresh"
              onClick={() => {
                resetDemo()
                setSlugDraft(useStore.getState().restaurants[0]?.slug ?? 'bella')
                setResetOpen(false)
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-umber">
          Your edits to{' '}
          <strong className="font-semibold text-charcoal">
            {restaurants.map((x) => x.name).join(', ')}
          </strong>{' '}
          will be discarded. This only affects data stored in this browser.
        </p>
      </Modal>
    </div>
  )
}
