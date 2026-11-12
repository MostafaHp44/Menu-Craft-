import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card } from '../../shared/ui/ui.tsx'
import { useStore } from '../../shared/store/useStore.ts'
import { useSites } from './useSites.ts'
import { sitesAPI, ApiError } from '../../shared/api/service'
import { alertDialog, formDialog } from '../../shared/components/dialogs.tsx'

const STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
}

export default function WebsitesPage() {
  const navigate = useNavigate()
  const setActive = useStore((s) => s.setActive)

  const {
    sites,
    summary,
    loading,
    error,
    refresh,
    setError,
  } = useSites()

  const filtered = useMemo(() => sites, [sites])

  const stats = useMemo(() => {
    const total = summary ? summary.used : 0
    const published = (sites || []).filter((r) => r.status === 'published').length
    const draft = (sites || []).filter((r) => r.status === 'draft').length
    const items = (sites || []).reduce((sum, r) => sum + (r.itemCount || 0), 0)
    const cats = (sites || []).reduce((sum, r) => sum + (r.categoryCount || 0), 0)
    return { total, published, draft, items, cats }
  }, [sites, summary])

  const planLabel = summary?.plan?.name || '—'
  const planStatus = summary?.subscription?.status || '—'

  const canCreate = summary ? summary.canCreate !== false : false

  const handleCreate = async () => {
    if (!canCreate) return

    const nameRes = await formDialog({
      title: 'Website name',
      message: 'Choose a name for your new website.',
      fields: [{ key: 'name', label: 'Website name', initialValue: 'New Website' }],
      confirmLabel: 'Next',
    })
    if (!nameRes) return
    const name = nameRes.name
    if (!name.trim()) return

    const defaultSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)
    const slugRes = await formDialog({
      title: 'Website slug',
      message: 'The short address used for your site link.',
      fields: [{ key: 'slug', label: 'Website slug', initialValue: defaultSlug }],
      confirmLabel: 'Create',
    })
    if (!slugRes) return
    const slug = slugRes.slug
    if (!slug.trim()) return

    try {
      const created = await sitesAPI.create({ name: name.trim(), slug: slug.trim() })
      await refresh()
      // التسلسل المطلوب: التحقق من الباقة ← إنشاء الموقع ← اختيار القالب ← التخصيص ← النشر
      const newId = (created as any)?.data?.id
      if (newId) {
        setActive(newId)
        // تحميل نسخة الموقع من السيرفر (slug/اسم/قائمة) قبل الانتقال،
        // حتى يربط المحرر/القالب بالموقع الجديد وليس بالموقع الافتراضي.
        try { await useStore.getState().loadDraftFromBackend() } catch { /* non-fatal */ }
      }
      navigate('/dashboard/templates')
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        await alertDialog({ title: 'Slug already exists', message: 'A website with this slug already exists. Please choose another slug.' })
        return
      }
      if (e instanceof ApiError && e.status === 403) {
        await alertDialog({ title: 'Plan limit', message: 'Your subscription plan does not allow creating more websites.' })
        return
      }
      await alertDialog({ title: 'Create failed', message: 'Failed to create website: ' + (e?.message || 'unknown error') })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-charcoal">Websites</h2>
          <p className="mt-1 text-[13px] text-umber">Websites owned by this account.</p>
        </div>
        <div className="flex items-center gap-2">
          {summary && !summary.unlimited && summary.used >= summary.maxSites ? (
            <Badge tone="outline">Plan limit reached ({summary.used}/{summary.maxSites})</Badge>
          ) : (
            <Button icon="plus" onClick={handleCreate} disabled={!canCreate}>
              Create Website
            </Button>
          )}
        </div>
      </div>

      {/* summary subscription banner */}
      {summary && (
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4 bg-cream/50 border border-cream">
          <div className="flex flex-wrap gap-4 text-[12px] text-umber">
            <span><strong>Plan:</strong> {planLabel}</span>
            <span><strong>Status:</strong> {planStatus}</span>
            {summary.unlimited ? (
              <span><strong>Sites:</strong> Unlimited</span>
            ) : (
              <span><strong>Sites:</strong> {summary.used} / {summary.maxSites} remaining</span>
            )}
          </div>
        </Card>
      )}

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total', value: String(stats.total), tone: 'outline' as const },
          { label: 'Published', value: String(stats.published), tone: 'moss' as const },
          { label: 'Draft', value: String(stats.draft), tone: 'gold' as const },
          { label: 'Menu items', value: String(stats.items), tone: 'outline' as const },
          { label: 'Categories', value: String(stats.cats), tone: 'outline' as const },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-umber">{s.label}</div>
            <div className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em] text-charcoal">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* loading / error */}
      {loading && (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-umber">
            <Icon name="clock" size={24} />
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-charcoal">Loading websites…</h3>
        </Card>
      )}
      {!loading && error && (
        <Card className="p-10 text-center border border-rose-200 bg-rose-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <Icon name="alert-triangle" size={24} />
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-charcoal">{error}</h3>
          <Button size="sm" onClick={() => { setError(null); refresh() }}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-umber">
            <Icon name="layer" size={24} />
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-charcoal">No websites</h3>
          <p className="mt-1 text-[13px] text-umber">Create your first website to get started.</p>
          {canCreate && (
            <Button icon="plus" className="mt-4" onClick={handleCreate}>
              Create Website
            </Button>
          )}
        </Card>
      )}

      {/* cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const nameStr = r.name_en || r.name_ar || r.name_ku || ''
            return (
              <Card key={r.id} className="flex flex-col overflow-hidden p-0 transition hover:shadow-lg">
                <div className="relative h-36 overflow-hidden bg-charcoal">
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
                  <div className="absolute start-4 top-3">
                    <Badge tone={r.status === 'published' ? 'moss' : 'gold'}>
                      {STATUS_LABEL[r.status] || r.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[17px] font-semibold leading-tight text-charcoal line-clamp-1">{nameStr}</h3>
                    <span className="shrink-0 text-[11px] text-umber">{r.slug}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-umber">{r.templateId ?? ''}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-umber">
                    <span className="flex items-center gap-1">
                      <Icon name="list" size={10} /> {r.itemCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="book" size={10} /> {r.categoryCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="clock" size={10} /> {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setActive(r.id)
                        navigate('/dashboard/editor')
                      }}
                    >
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setActive(r.id)
                        navigate('/dashboard/menu')
                      }}
                    >
                      Edit Menu
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      className="flex-1"
                      icon="external"
                      onClick={() => window.open(`/menu-demo`, '_blank')}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
