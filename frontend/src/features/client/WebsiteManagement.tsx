import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../shared/store/useAuth.ts'

import { useI18n } from '../../shared/i18n'
import { Card, EmptyState, Badge, Button, Input } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { restaurantAPI } from '../../shared/lib/api.service.ts'
import { tx } from '../../shared/lib/utils.ts'
import { confirmDialog } from '../../shared/components/dialogs.tsx'

interface WebsiteDetails {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  templateId?: string
  created_at: string
  updated_at: string
  logoText?: string
  plan?: string
}

export default function WebsiteManagement() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const params = useParams()
  const restaurantId = params.restaurantId || ''

  const [website, setWebsite] = useState<WebsiteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editingSlug, setEditingSlug] = useState(false)
  const [nameValue, setNameValue] = useState<string>('')
  const [slugValue, setSlugValue] = useState<string>('')

  // Fetch website details
  useEffect(() => {
    if (restaurantId) {
      restaurantAPI.getById(restaurantId).then(
        (res: any) => {
          if (res.ok && res.data) {
            setWebsite(res.data)
            setNameValue(tx(res.data.name_en || res.data.name, lang))
            setSlugValue(res.data.slug || '')
          } else {
            setError(t('websitesUi.websiteNotFound'))
          }
        },
        (err: any) => {
          setError(err.message || t('websitesUi.loadFailed'))
        }
      )
      setLoading(true)
    }
  }, [restaurantId])

  // Refresh website data
  const refreshWebsite = () => {
    if (restaurantId) {
      restaurantAPI.getById(restaurantId).then(
        (res: any) => {
          if (res.ok && res.data) {
            setWebsite(res.data)
            setNameValue(tx(res.data.name_en || res.data.name, lang))
            setSlugValue(res.data.slug || '')
          }
        }
      )
    }
  }

  // Update website name
  const updateName = async () => {
    if (!website || !nameValue.trim()) return
    try {
      const result = await restaurantAPI.update(website.id, {
        name: nameValue.trim()
      })
      if (result.ok) {
        refreshWebsite()
        setEditingName(false)
      } else {
        setError(t('websitesUi.updateFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('websitesUi.updateFailed'))
    }
  }

  // Update website slug
  const updateSlug = async () => {
    if (!website || !slugValue.trim()) return
    
    // Validate slug
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slugValue.toLowerCase())) {
      setError(t('websitesUi.slugFormatError'))
      return
    }

    // Check for reserved names
    const reservedNames = ['www', 'api', 'admin', 'dashboard', 'app', 'mail', 'support']
    if (reservedNames.includes(slugValue.toLowerCase())) {
      setError(t('websitesUi.slugReserved'))
      return
    }

    try {
      const result = await restaurantAPI.update(website.id, {
        slug: slugValue.trim()
      })
      if (result.ok) {
        refreshWebsite()
        setEditingSlug(false)
      } else {
        setError(t('websitesUi.updateFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('websitesUi.updateFailed'))
    }
  }

  // Publish or unpublish
  const togglePublish = async () => {
    if (!website) return
    try {
      const result = website.status === 'published'
        ? await restaurantAPI.unpublish(website.id)
        : await restaurantAPI.publish(website.id)
      if (result.ok) {
        refreshWebsite()
      } else {
        setError(t('websitesUi.publishFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('websitesUi.publishFailed'))
    }
  }

  // Delete/Archive website
  const deleteWebsite = async () => {
    if (!website) return
    const ok = await confirmDialog({
      title: t('websitesUi.deleteTitle', { defaultValue: 'حذف الموقع؟' }),
      message: t('websitesUi.deleteConfirm'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    try {
      const result = await restaurantAPI.delete(website.id)
      if (result.ok) {
        navigate('/dashboard/websites')
      } else {
        setError(t('websitesUi.deleteFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('websitesUi.deleteFailed'))
    }
  }

  if (loading) {
    return <EmptyState icon="clock" title={t('websitesUi.loading')} message=" " />
  }

  if (error) {
    return <EmptyState icon="alert" title={t('websitesUi.error')} message={error} />
  }

  if (!website) {
    return <EmptyState icon="alert" title={t('websitesUi.notFound')} message={t('websitesUi.websiteNotFound')} />
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('websitesUi.websiteManagement')}</h1>

      {/* Website details card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          {website.logoText && (
            <div className="w-12 h-12 rounded-lg bg-cream text-umber flex items-center justify-center">
              <span className="font-semibold first-letter">{tx(website.name, lang).charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-charcoal">{tx(website.name, lang)}</h2>
            <p className="text-[13px] text-muted">{t('websitesUi.slug', { slug: website.slug })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-muted">
          <div>
            <strong>{t('common.status')}</strong>
            <Badge
              tone={website.status === 'published' ? 'moss' : website.status === 'draft' ? 'outline' : 'flame'}
            >
              {website.status === 'published'
                ? t('billing.statusActive')
                : website.status === 'draft'
                ? t('billing.statusDraft')
                : t('billing.statusExpired')}
            </Badge>
          </div>
          <div>
            <strong>{t('common.created')}</strong>{' '}{new Date(website.created_at).toLocaleDateString()}
          </div>
          <div>
            <strong>{t('common.updated')}</strong>{' '}{new Date(website.updated_at).toLocaleDateString()}
          </div>
        </div>

        <div>
          <strong>{t('design.template')}</strong>{website.templateId ? ': ' + (website.templateId ? 'Custom' : 'None') : ''}
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Edit name */}
        {editingName && (
          <Card className="p-3 border border-blue-200 bg-blue/5">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder={t('websitesUi.websiteName')}
              disabled={editingName}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNameValue(tx(website?.name, lang))}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={updateName}
            >
              {t('common.save')}
            </Button>
          </Card>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditingName(true)}
        >
          {t('websitesUi.editName')}
        </Button>

        {/* Edit slug */}
        {editingSlug && (
          <Card className="p-3 border border-blue-200 bg-blue/5">
            <Input
              value={slugValue}
              onChange={(e) => setSlugValue(e.target.value)}
              placeholder={t('websitesUi.subdomain')}
              disabled={editingSlug}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSlugValue(website?.slug || '')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={updateSlug}
            >
              {t('common.save')}
            </Button>
          </Card>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditingSlug(true)}
        >
          {t('websitesUi.editSlug')}
        </Button>

        {/* Publish/Unpublish */}
        <Button
          size="sm"
          variant={website.status === 'published' ? 'outline' : 'accent'}
          onClick={togglePublish}
        >
          {website.status === 'published'
            ? t('websitesUi.unpublish')
            : t('websitesUi.publish')}
        </Button>

        {/* Delete */}
        <Button
          size="sm"
          variant="danger"
          onClick={deleteWebsite}
        >
          {t('websitesUi.delete')}
        </Button>

        {/* View website */}
        <Link
          to={`/site/${website.slug}`}
          className="flex items-center gap-2 text-sm text-primary"
        >
          <Icon name="external" size={16} />
          {t('websitesUi.viewWebsite')}
        </Link>
      </div>

      {/* Related websites section */}
      {session?.restaurantId && (
        <Card className="mt-6 p-4 text-sm text-muted">
          <h3 className="font-semibold mb-3">{t('websitesUi.yourWebsites')}</h3>
          <p>{t('websitesUi.clickManageOther')}</p>
          <Link
            to={`/dashboard/websites`}
            className="text-primary underline underline-offset-2 cursor-pointer"
          >
            {t('websitesUi.manageAll')}
          </Link>
        </Card>
      )}
    </div>
  )
}