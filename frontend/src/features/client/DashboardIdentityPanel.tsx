import { useEffect, useState } from 'react'
import { Button, Card, ColorField, Field } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n } from '../../shared/i18n'
import { useBackendAuth } from '../../shared/store/useBackendAuth'
import {
  useDashboardThemeStore,
  type DashboardTheme,
} from '../../shared/lib/dashboardTheme'

const DEFAULTS: DashboardTheme = {
  text: '#111827',
  background: '#F5F3EE',
  border: '#E7E2D6',
}

/**
 * Dashboard-only visual identity: text / background / border colours.
 * Saved to DashboardThemes (backend) — completely separate from the
 * restaurant template design, and it survives a page refresh.
 */
export default function DashboardIdentityPanel() {
  const { t } = useI18n()
  const user = useBackendAuth((s) => s.user)
  const status = useDashboardThemeStore((s) => s.status)
  const saved = useDashboardThemeStore((s) => s.theme)
  const save = useDashboardThemeStore((s) => s.save)

  const restaurantId = user?.restaurant_id || user?.restaurantId || ''

  const [draft, setDraft] = useState<DashboardTheme>(DEFAULTS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft({
      text: saved.text || DEFAULTS.text,
      background: saved.background || DEFAULTS.background,
      border: saved.border || DEFAULTS.border,
    })
  }, [saved])

  const dirty =
    (draft.text || '') !== (saved.text || DEFAULTS.text) ||
    (draft.background || '') !== (saved.background || DEFAULTS.background) ||
    (draft.border || '') !== (saved.border || DEFAULTS.border)

  const reset = () => {
    setDraft({ ...DEFAULTS })
    setError('')
  }

  const submit = async () => {
    if (!restaurantId) {
      setError(t('dashboardIdentity.noRestaurant'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await save(restaurantId, draft)
    } catch {
      setError(t('dashboardIdentity.saveError'))
    } finally {
      setBusy(false)
    }
  }

  const preview = draft.text || DEFAULTS.text
  const previewBg = draft.background || DEFAULTS.background
  const previewBorder = draft.border || DEFAULTS.border

  return (
    <Card className="p-5 sm:p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-[15.5px] font-semibold text-charcoal">
            <Icon name="palette" size={16} />
            {t('dashboardIdentity.title')}
          </h3>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-umber">
            {t('dashboardIdentity.sub')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" icon="refresh" onClick={reset} disabled={busy}>
            {t('dashboardIdentity.reset')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon="save"
            onClick={submit}
            loading={busy}
            disabled={busy || status === 'saving'}
          >
            {t('common.saveDraft')}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ColorField
          label={t('dashboardIdentity.text')}
          value={draft.text || DEFAULTS.text || ''}
          onChange={(hex) => setDraft((d) => ({ ...d, text: hex }))}
        />
        <ColorField
          label={t('dashboardIdentity.background')}
          value={draft.background || DEFAULTS.background || ''}
          onChange={(hex) => setDraft((d) => ({ ...d, background: hex }))}
        />
        <ColorField
          label={t('dashboardIdentity.border')}
          value={draft.border || DEFAULTS.border || ''}
          onChange={(hex) => setDraft((d) => ({ ...d, border: hex }))}
        />
      </div>

      {/* live preview of the dashboard shell */}
      <div
        className="mt-4 overflow-hidden rounded-xl"
        style={{ backgroundColor: previewBg, border: `1px solid ${previewBorder}`, color: preview }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: `1px solid ${previewBorder}` }}
        >
          <span className="text-[12.5px] font-semibold">{t('dashboardIdentity.previewTitle')}</span>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ border: `1px solid ${previewBorder}` }}
          >
            {t('dashboardIdentity.previewBadge')}
          </span>
        </div>
        <div className="flex gap-3 p-4">
          <div
            className="h-8 w-8 shrink-0 rounded-lg"
            style={{ border: `1px solid ${previewBorder}` }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px]">{t('dashboardIdentity.previewBody')}</p>
            <div className="mt-2 flex gap-2">
              <span
                className="rounded-lg px-3 py-1 text-[12px] font-medium"
                style={{ border: `1px solid ${previewBorder}` }}
              >
                {t('dashboardIdentity.previewAction')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Field label={t('dashboardIdentity.scope')}>
        <p className="text-[12.5px] leading-relaxed text-umber">{t('dashboardIdentity.scopeValue')}</p>
      </Field>

      {dirty ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-flame">
          <Icon name="alert" size={13} />
          {t('dashboardIdentity.unsaved')}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-[12.5px] text-rose">{error}</p> : null}
      {status === 'ready' && !dirty && !error ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-moss">
          <Icon name="check" size={13} />
          {t('dashboardIdentity.saved')}
        </p>
      ) : null}
    </Card>
  )
}
