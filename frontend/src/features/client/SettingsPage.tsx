import { useEffect, useRef, useState } from 'react'
import { apiUrl } from '../../shared/api/url.ts'
import { Badge, Button, Card, Field, IconButton, Input, Modal, Toggle } from '../../shared/ui/ui.tsx'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { cx, tx, writeText } from '../../shared/lib/utils.ts'
import { useI18n } from '../../shared/i18n'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'
import DashboardIdentityPanel from './DashboardIdentityPanel.tsx'

export default function SettingsPage() {
  /* subscribing re-renders on language change so `tx()` re-resolves */
  const { lang } = useI18n()
  const r = useActiveRestaurant()
  const restaurants = useStore((s) => s.restaurants)
  const updateSaved = useStore((s) => s.updateSaved)
  const resetDemo = useStore((s) => s.resetDemo)
  const showToast = useStore((s) => s.showToast)

  const [resetOpen, setResetOpen] = useState(false)
  const [slugDraft, setSlugDraft] = useState(r.slug)
  const [slugBusy, setSlugBusy] = useState(false)

  /* إبقاء صندوق الرابط متطابقاً مع الـ slug الحالي عند تغيّره من الخارج
     (تحميل من السيرفر / نجاح Apply) — من غير ما نمسح ما يكتبه المستخدم أثناء
     كتابته (لا نعتمد على r.slug في الـ onChange، الحالة مستقلة) */
  const prevSlug = useRef(r.slug)
  useEffect(() => {
    if (prevSlug.current !== r.slug) {
      setSlugDraft((cur) => (cur === prevSlug.current ? r.slug : cur))
      prevSlug.current = r.slug
    }
  }, [r.slug])

  const patch = (recipe: (target: typeof r) => void, opts?: { skipSync?: boolean }) => updateSaved(recipe, undefined, opts)

  const applySlug = async () => {
    const oldSlug = r.slug
    const nextSlug = slugDraft
    if (!validSlug || nextSlug === oldSlug) return
    setSlugBusy(true)
    // تغيير محلي فقط أولاً، ثم دفع صريح على الـ oldSlug حاملاً الـ الجديد
    patch((t) => { t.slug = nextSlug }, { skipSync: true })
    const ok = await useStore.getState().syncSavedConfig(undefined, oldSlug)
    setSlugBusy(false)
    if (ok) {
      showToast({ title: 'Address updated', message: publicUrl(nextSlug), tone: 'success' })
    } else {
      // فشل (مثلاً الرابط محجوز) — نرجع الـ slug المحلي حتى لا نكذب على الواجهة
      patch((t) => { t.slug = oldSlug }, { skipSync: true })
      setSlugDraft(oldSlug)
    }
  }

  /* النشر يُدار عبر الـ endpoint الباك إند (يحترم الاشتراك والملكية) */
  const onPublishToggle = async (v: boolean) => {
    const backendRid = (useBackendAuth.getState().user as any)?.restaurant_id as string | undefined
    patch((t) => { t.status = v ? 'published' : 'draft' }, { skipSync: true })
    if (!backendRid) {
      showToast({ title: v ? 'Published' : 'Unpublished', message: 'Demo mode — no backend link', tone: 'info' })
      return
    }
    const action = v ? 'publish' : 'unpublish'
    const res = await fetch(apiUrl(`/api/restaurants/${encodeURIComponent(backendRid)}/${action}`), {
      method: 'PATCH',
      credentials: 'include',
    })
    if (!res.ok) {
      // فشل (مثلاً انتهاء الاشتراك) — نرجّع الحالة المحلية
      patch((t) => { t.status = v ? 'draft' : 'published' }, { skipSync: true })
      const json = await res.json().catch(() => null)
      showToast({ title: 'Server save failed', message: json?.error || `HTTP ${res.status}`, tone: 'error' })
      return
    }
    showToast({ title: v ? 'Published' : 'Unpublished', tone: 'success' })
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
            <Input value={typeof r.name === 'string' ? r.name : tx(r.name, lang)} onChange={(e) => patch((t) => { t.name = writeText(t.name, e.target.value, lang) })} />
          </Field>

          <Field label="Public address" hint={validSlug ? 'available' : '3–32 lowercase chars'}>
            <div className="flex items-stretch gap-2">
              <Input
                value={slugDraft}
                spellCheck={false}
                aria-invalid={!validSlug}
                onChange={(e) => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className={cx(!validSlug && 'border-rose focus:border-rose focus:ring-rose/15')}
                dir="ltr"
                lang="en"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-11 shrink-0"
                disabled={!validSlug || slugDraft === r.slug || slugBusy}
                loading={slugBusy}
                onClick={() => { void applySlug() }}
              >
                Apply
              </Button>
            </div>
          </Field>

          <div className="rounded-xl border border-sand bg-cream/60 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-espresso">Live address</div>
                {/* متحدث: يعكس ما يُكتب في خانة الرابط فوراً قبل الـ Apply */}
                <div className="line-clamp-1 font-mono text-[13px] text-charcoal">
                  {publicUrl(validSlug ? slugDraft : r.slug)}
                </div>
              </div>
              <Button to="/menu-demo" size="sm" variant="ghost" icon="external">
                Open
              </Button>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-clay">
              Simulated subdomain — the public address is configured by deployment, no DNS is provisioned in this prototype.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-sand p-3.5">
            <Toggle
              label="Publish status"
              description="Published sites are visible on the public menu page"
              checked={r.status === 'published'}
              onChange={(v) => { void onPublishToggle(v) }}
            />
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
              // مفتاح ثابت بالمؤشر — مفتاح row.day كان يتغير مع كل كتابة
              // فيعيد React تركيب الصف كاملاً فتختفي الكتابة/الكيبورد فوراً
              <div key={index} className="flex items-center gap-2">
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

      {/* dashboard-only visual identity */}
      <DashboardIdentityPanel />

      {/* demo data */}
      {/* <Card className="p-5 sm:p-6 lg:col-span-2">
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
      </Card> */}

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
