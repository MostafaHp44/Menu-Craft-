import { useEffect, useState } from 'react'
import { Button, Card, Field, Input, Modal } from '../../shared/ui/ui.tsx'
import { Icon } from '../../shared/ui/icons.tsx'
import { useI18n } from '../../shared/i18n'
import { useStore } from '../../shared/store/useStore.ts'
import { ApiError, errorMessage, sitesApi, type SiteCard, type SitePlanSummary } from '../../shared/api/client.ts'
import { slugify } from '../../shared/lib/utils.ts'
import { useAsync } from './useAsync.ts'
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshButton,
  StatusBadge,
  TableWrap,
  Td,
  Th,
} from './components.tsx'
import { formatDateTime } from './format.ts'

interface SitesData {
  sites: SiteCard[]
  summary: SitePlanSummary
  canCreate: boolean
}

export default function SitesPage() {
  const { t, lang } = useI18n()
  const data = useAsync<SitesData>(async () => {
    const [listRes, sumRes, canRes] = await Promise.all([sitesApi.list(), sitesApi.summary(), sitesApi.canCreate()])
    return { sites: listRes.data, summary: sumRes.data, canCreate: canRes.canCreate }
  }, [])
  const [createOpen, setCreateOpen] = useState(false)

  const siteName = (site: SiteCard): string =>
    (site.name_en || site.name_ar || site.name_ku || site.name || site.slug) as string

  return (
    <div>
      <PageHeader
        title={t('live.sites.title')}
        sub={t('live.sites.sub')}
        actions={
          <>
            <RefreshButton onClick={data.refresh} loading={data.loading} />
            <Button
              variant="accent"
              size="sm"
              icon="plus"
              onClick={() => setCreateOpen(true)}
              disabled={data.data ? !data.data.canCreate : false}
            >
              {t('live.sites.add')}
            </Button>
          </>
        }
      />

      {data.data ? (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">{t('live.subscription.plan')}</p>
            <p className="mt-0.5 text-[16px] font-semibold capitalize text-charcoal">{data.data.summary.plan?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">{t('live.subscription.status')}</p>
            <p className="mt-0.5 text-[13px] font-medium text-charcoal">{data.data.summary.subscription?.status ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay">{t('live.sites.title')}</p>
            <p className="mt-0.5 text-[13px] font-medium text-charcoal">
              {data.data.summary.used} / {data.data.summary.unlimited ? '∞' : data.data.summary.maxSites}
            </p>
          </div>
        </Card>
      ) : null}

      {data.error ? <ErrorBlock message={data.error} onRetry={data.refresh} /> : null}
      {data.loading && !data.data ? <LoadingBlock rows={4} /> : null}

      {data.data && data.data.sites.length === 0 ? (
        <EmptyBlock
          title={t('live.sites.title')}
          message={t('live.sites.empty')}
          action={
            <Button variant="accent" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
              {t('live.sites.add')}
            </Button>
          }
        />
      ) : null}

      {data.data && data.data.sites.length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>{t('live.common.name')}</Th>
              <Th>{t('live.sites.slug')}</Th>
              <Th>{t('live.common.status')}</Th>
              <Th>{t('live.sites.categories')}</Th>
              <Th>{t('live.sites.items')}</Th>
              <Th>{t('live.sites.orders')}</Th>
              <Th>{t('live.sites.updated')}</Th>
            </tr>
          </thead>
          <tbody>
            {data.data.sites.map((site) => (
              <tr key={site.id} className="hover:bg-cream/40">
                <Td className="font-medium text-charcoal">{siteName(site)}</Td>
                <Td className="font-mono text-[12px] text-umber">{site.slug}</Td>
                <Td>
                  <StatusBadge status={site.status} />
                </Td>
                <Td>{site.categoryCount}</Td>
                <Td>{site.itemCount}</Td>
                <Td>{site.itemCount}</Td>
                <Td className="whitespace-nowrap text-[12px] text-umber">{formatDateTime(site.updated_at ?? '', lang)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : null}

      <CreateSiteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false)
          data.refresh()
        }}
      />
    </div>
  )
}

function CreateSiteModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [touchedSlug, setTouchedSlug] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setSlug('')
    setTouchedSlug(false)
    setError('')
  }, [open])

  const save = async () => {
    const cleanSlug = slugify(slug || name)
    if (!name.trim() || !cleanSlug) {
      setError(t('live.common.required'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await sitesApi.create({ name: name.trim(), slug: cleanSlug })
      useStore.getState().showToast({ title: t('live.sites.createTitle'), tone: 'success' })
      onSaved()
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 409 ? t('live.sites.slugTaken') : errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('live.sites.createTitle')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('live.common.cancel')}
          </Button>
          <Button variant="accent" onClick={save} loading={busy}>
            {t('live.common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={t('live.sites.name')}>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (!touchedSlug) setSlug(slugify(event.target.value))
            }}
            autoFocus
          />
        </Field>
        <Field label={t('live.sites.slug')} hint={`${slug || 'my-restaurant'}`}>
          <Input
            value={slug}
            onChange={(event) => {
              setTouchedSlug(true)
              setSlug(event.target.value)
            }}
            onBlur={() => setSlug(slugify(slug || name))}
            placeholder="my-restaurant"
          />
        </Field>
        {error ? (
          <p className="flex items-center gap-1.5 text-[12.5px] text-rose">
            <Icon name="alert" size={13} />
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
