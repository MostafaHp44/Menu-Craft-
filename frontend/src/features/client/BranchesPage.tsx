import { useEffect, useState, type FormEvent } from 'react'
import { useI18n } from '../../shared/i18n'
import { Badge, Button, Card, Field, Input, Modal, Toggle } from '../../shared/ui/ui.tsx'
import { useStore } from '../../shared/store/useStore.ts'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'

interface Branch {
  id: string
  name_en?: string | null
  name_ar?: string | null
  name_ku?: string | null
  address?: string | null
  phone?: string | null
  opening_hours?: string | null
  is_active?: boolean | number
  accepting_orders?: boolean | number
}

interface BranchForm {
  name: string
  address: string
  phone: string
  openingHours: string
  acceptingOrders: boolean
}

const EMPTY_FORM: BranchForm = {
  name: '',
  address: '',
  phone: '',
  openingHours: '',
  acceptingOrders: true,
}

function truthy(value: boolean | number | undefined): boolean {
  return value === true || value === 1
}

function branchName(branch: Branch): string {
  return branch.name_en || branch.name_ar || branch.name_ku || '—'
}

export default function BranchesPage() {
  const { t } = useI18n()
  const showToast = useStore((s) => s.showToast)

  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const backendUser = useBackendAuth((s) => s.user)
  const backendStatus = useBackendAuth((s) => s.status)
  // Real tenant id from the backend session only. Prototype ids live in a
  // different namespace, so we never send them to the API.
  const [restaurantId, setRestaurantId] = useState<string>(() => localStorage.getItem('digital-menu.selected-restaurant') || backendUser?.restaurant_id || backendUser?.restaurantId || '')
  const [restaurantsList, setRestaurantsList] = useState<{id:string;name:string}[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState(() => localStorage.getItem('digital-menu.selected-branch') || '')

  useEffect(() => {
    if (!backendUser || backendStatus !== 'ready') return
    fetch('/api/sites', { credentials: 'include' })
      .then(r => r.json()).then(p => {
        const list = (p?.sites || p?.data || [])
        const mapped = list.map((s:any) => ({ id: String(s.id || s.restaurant_id || ''), name: s.name || s.restaurantName || '—' })).filter((s:any)=>s.id)
        if (mapped.length) {
          setRestaurantsList(mapped)
          // Restore only a restaurant returned by the authorized backend list.
          setRestaurantId(current => mapped.some((s: { id: string }) => s.id === current) ? current : mapped[0].id)
        }
      }).catch(()=>{})
  }, [backendUser, backendStatus])

  useEffect(() => {
    if (!restaurantId) return
    localStorage.setItem('digital-menu.selected-restaurant', restaurantId)
    // A branch from a different restaurant must never be restored.
    setSelectedBranchId('')
  }, [restaurantId])

  useEffect(() => {
    if (selectedBranchId) localStorage.setItem('digital-menu.selected-branch', selectedBranchId)
    else localStorage.removeItem('digital-menu.selected-branch')
  }, [selectedBranchId])

  useEffect(() => {
    if (backendStatus === 'idle' || backendStatus === 'loading') return
    if (!restaurantId) {
      // signed out — nothing to load, and no bogus request to log
      setBranches([])
      setLoading(false)
      setLoadError(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError(false)

    fetch(`/api/branches?restaurantId=${encodeURIComponent(restaurantId)}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null)
        if (!res.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${res.status}`)
        return (payload.data || []) as Branch[]
      })
      .then((data) => {
        if (!cancelled) setBranches(data)
      })
      .catch(() => {
        if (!cancelled) {
          setBranches([])
          setLoadError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [restaurantId, backendStatus, reloadKey])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setEditing(branch)
    setForm({
      name: branchName(branch) === '—' ? '' : branchName(branch),
      address: branch.address || '',
      phone: branch.phone || '',
      openingHours: branch.opening_hours || '',
      acceptingOrders: branch.accepting_orders === undefined ? true : truthy(branch.accepting_orders),
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
    setFormError('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setFormError(t('branches.name'))
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const body = {
        restaurantId,
        name,
        address: form.address.trim(),
        phone: form.phone.trim(),
        openingHours: form.openingHours.trim() || null,
        acceptingOrders: form.acceptingOrders,
      }
      const res = await fetch(editing ? `/api/branches/${encodeURIComponent(editing.id)}` : '/api/branches', {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${res.status}`)

      setModalOpen(false)
      setEditing(null)
      setReloadKey((key) => key + 1)
      showToast({
        tone: 'success',
        title: editing ? t('branches.updated') : t('branches.created'),
        message: name,
      })
    } catch {
      setFormError(t('branches.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('branches.title')}</h2>
          <p className="mt-1 text-sm text-umber/70">{t('branches.sub')}</p>
        </div>
        {restaurantsList.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="rest-select" className="text-sm text-umber">Restaurant:</label>
            <select id="rest-select" value={restaurantId} onChange={e=>setRestaurantId(e.target.value)} className="rounded-lg border border-sand bg-paper px-3 py-1.5 text-sm">
              {restaurantsList.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}
        <Button
          size="sm"
          variant="accent"
          icon="plus"
          onClick={openAdd}
          disabled={!restaurantId}
        >
          {t('branches.add')}
        </Button>
      </div>

      {restaurantId && branches.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="branch-select" className="text-sm text-umber">Branch:</label>
          <select id="branch-select" value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} className="rounded-lg border border-sand bg-paper px-3 py-1.5 text-sm">
            <option value="">All branches</option>
            {branches.map(branch => <option key={branch.id} value={branch.id}>{branchName(branch)}</option>)}
          </select>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-umber/60">{t('branches.loading')}</p>
        ) : !restaurantId ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <p className="text-base font-medium text-charcoal">{t('branches.signInFirst')}</p>
            <p className="text-sm text-umber/60">{t('branches.signInFirstSub')}</p>
            <Button to="/signin" size="sm" variant="accent" className="mt-2">
              {t('nav.signIn')}
            </Button>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-rose">{t('branches.error')}</p>
            <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
              {t('common.retry')}
            </Button>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <p className="text-base font-medium text-charcoal">{t('branches.empty')}</p>
            <p className="text-sm text-umber/60">{t('branches.emptySub')}</p>
            <Button size="sm" variant="accent" className="mt-2" onClick={openAdd}>
              {t('branches.add')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-sand text-[11px] uppercase tracking-wider text-umber/60">
                  <th className="px-4 py-3 text-start">{t('branches.name')}</th>
                  <th className="px-4 py-3 text-start">{t('branches.address')}</th>
                  <th className="px-4 py-3 text-start">{t('branches.phone')}</th>
                  <th className="px-4 py-3 text-start">{t('branches.acceptingOrders')}</th>
                  <th className="px-4 py-3 text-end">{t('branches.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {branches.filter(branch => !selectedBranchId || branch.id === selectedBranchId).map((branch) => (
                  <tr key={branch.id} className="border-b border-sand/50 last:border-0 hover:bg-sand/20">
                    <td className="px-4 py-3 font-medium text-charcoal">
                      <div className="flex items-center gap-2">
                        {branchName(branch)}
                        {truthy(branch.is_active) ? null : (
                          <Badge tone="outline">{t('common.inactive')}</Badge>
                        )}
                      </div>
                      {branch.opening_hours ? (
                        <span className="mt-0.5 block text-xs text-umber/50">
                          {branch.opening_hours}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-umber/80">{branch.address || '—'}</td>
                    <td className="px-4 py-3 text-umber/80" dir="ltr">
                      {branch.phone || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {truthy(branch.accepting_orders) ? (
                        <Badge tone="moss">{t('common.active')}</Badge>
                      ) : (
                        <Badge tone="outline">{t('common.inactive')}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button size="sm" variant="outline" onClick={() => openEdit(branch)}>
                        {t('branches.edit')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? t('branches.editTitle') : t('branches.addTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={closeModal} disabled={saving}>
              {t('branches.cancel')}
            </Button>
            <Button variant="accent" size="sm" onClick={submit} loading={saving}>
              {t('branches.save')}
            </Button>
          </div>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label={t('branches.name')}>
            <Input
              value={form.name}
              placeholder={t('branches.namePlaceholder')}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </Field>
          <Field label={t('branches.address')}>
            <Input
              value={form.address}
              placeholder={t('branches.addressPlaceholder')}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('branches.phone')}>
              <Input
                value={form.phone}
                placeholder={t('branches.phonePlaceholder')}
                dir="ltr"
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field label={t('branches.openingHours')}>
              <Input
                value={form.openingHours}
                placeholder={t('branches.openingHoursPlaceholder')}
                dir="ltr"
                onChange={(e) => setForm((f) => ({ ...f, openingHours: e.target.value }))}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-sand bg-paper px-4 py-3">
            <span className="text-sm font-medium text-charcoal">{t('branches.acceptingOrders')}</span>
            <Toggle
              checked={form.acceptingOrders}
              onChange={(checked) => setForm((f) => ({ ...f, acceptingOrders: checked }))}
            />
          </div>
          {formError ? <p className="text-sm text-rose">{formError}</p> : null}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>
    </div>
  )
}
