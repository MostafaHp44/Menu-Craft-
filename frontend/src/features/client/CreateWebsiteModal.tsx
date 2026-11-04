import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Select, Button } from '../../shared/ui/ui.tsx'
import { sitesAPI } from '../../shared/lib/api.service.ts'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { restaurantAPI } from '../../shared/lib/api.service.ts'

interface CreateWebsiteForm {
  name: string
  slug: string
  templateId?: string
}

export default function CreateWebsiteModal() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateWebsiteForm>({
    name: '',
    slug: '',
    templateId: undefined
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [maxSites, setMaxSites] = useState<number | null>(null)
  const [used, setUsed] = useState<number>(0)

  // Fetch plan limits
  useEffect(() => {
    sitesAPI.summary().then(
      (res: any) => {
        if (res.ok && res.data) {
          const data = res.data
          setMaxSites(data.maxSites ?? null)
          setUsed(data.used ?? 0)
        }
      }
    )
  }, [])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    // Validate slug: URL-safe, alphanumeric + hyphens
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(form.slug)) {
      setError('Slug must contain only a-z, 0-9, and hyphens')
      setSaving(false)
      return
    }

    // Check for reserved names
    const reservedNames = ['www', 'api', 'admin', 'dashboard', 'app', 'mail', 'support']
    if (reservedNames.includes(form.slug.toLowerCase())) {
      setError('Slug cannot be a reserved system name')
      setSaving(false)
      return
    }

    // Check if slug already exists
    try {
      const existing = await restaurantAPI.getBySlug(form.slug)
      if (existing.ok && existing.data) {
        setError('Slug is already taken')
        setSaving(false)
        return
      }
    } catch (e) {
      // Ignore errors - might not exist
    }

    setSaving(true)
    try {
      const result = await restaurantAPI.create({
        name: form.name,
        slug: form.slug,
        templateId: form.templateId
      })

      // Type-safe check - result should have ok property
      if (result && result.ok) {
        // Successfully created - navigate to editor
        navigate('/dashboard/editor?restaurantId=' + (result.data?.id || ''))
      } else {
        setError('Failed to create website')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create website')
    } finally {
      setSaving(false)
    }
  }

  // Plan limit info display
  const planInfo = maxSites !== null ? (
    <div className="space-y-2 text-sm">
      {maxSites === Infinity ? (
        <p className="text-[12px] text-muted">Unlimited websites</p>
      ) : (
        <>

          <p className="text-[12px] text-muted">
            Max websites: {maxSites}
          </p>
          {used !== undefined && (
            <p className="text-[11px] text-umber">
              Used: {used}
            </p>
          )}
        </>
      )}
    </div>
  ) : (
    <p className="text-[11px] text-muted">Checking plan...</p>
  )

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h2>Create New Website</h2>

      {error && (
        <div className="bg-amber-50 border border-amber-200 p-3 text-amber-800">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] text-umber mb-1">Website name</label>
          <Input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Bella Italian Kitchen"
            required
          />
        </div>

        <div>
          <label className="block text-[13px] text-umber mb-1">Subdomain</label>
          <p className="text-[11px] text-muted mb-2">
            Format: {publicUrl(form.slug)}
          </p>
          <Input
            type="text"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="e.g. pizzeria"
            required
            autoCapitalize="off"
          />
        </div>

        {planInfo}

        <div>
          <label className="block text-[13px] text-umber mb-1">Template</label>
          <Select
            name="templateId"
            value={form.templateId !== undefined ? form.templateId : ''}
            onChange={(e: any) => setForm((prev) => ({ ...prev, templateId: e.target.value === '' ? undefined : e.target.value }))}
          >
            <option value="">{'No template'}</option>
          </Select>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving' : 'Create Website'}
        </Button>
      </form>
    </div>
  )
}