import { useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge, Button, Field, IconButton, Img, Input, Modal, Select } from '../../../shared/ui/ui.tsx'
import { usePlatformStore } from '../../../shared/store/usePlatform.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import { TEMPLATES, TEMPLATE_CATEGORIES, getTemplate } from '../../../templates/data/templates.ts'
import { DarkEmpty, DemoNote, Panel, PanelHeading } from '../parts.tsx'

const CATEGORIES = TEMPLATE_CATEGORIES.filter((c) => c !== 'All')

export default function TemplatesTab() {
  const { t } = useI18n()
  const customTemplates = usePlatformStore((s) => s.customTemplates)
  const addTemplate = usePlatformStore((s) => s.addTemplate)
  const removeTemplate = usePlatformStore((s) => s.removeTemplate)
  const showToast = useStore((s) => s.showToast)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [baseId, setBaseId] = useState(TEMPLATES[0].id)
  const [category, setCategory] = useState<string>(CATEGORIES[0])

  const maxUsage = Math.max(...TEMPLATES.map((tpl) => tpl.usageCount), 1)
  const trimmed = name.trim()

  const submit = () => {
    if (!trimmed) return
    addTemplate({ baseTemplateId: baseId, name: trimmed, category })
    showToast({
      tone: 'success',
      title: t('toast.created'),
      message: t('platformMore.templates.addedMsg', { name: trimmed }),
    })
    setName('')
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      {/* platform template usage */}
      <Panel>
        <PanelHeading
          title={t('admin.templates')}
          description={t('platformMore.templates.usage')}
          actions={
            <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
              {t('admin.addTemplate')}
            </Button>
          }
        />

        <div className="mt-5 space-y-3.5">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.id}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-ivory/85">
                  {tpl.name}
                  <span className="ms-2 text-ivory/40">{tpl.category}</span>
                </span>
                <span className="font-semibold text-ivory">
                  {tpl.usageCount.toLocaleString()}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-flame to-flame-light transition-all"
                  style={{ width: `${Math.max(4, (tpl.usageCount / maxUsage) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* admin-added copies */}
      <Panel>
        <PanelHeading
          title={t('platformMore.templates.customBadge')}
          description={t('platformMore.templates.copyNote')}
        />

        <div className="mt-4">
          <DemoNote>{t('platformMore.templates.addedNote')}</DemoNote>
        </div>

        {customTemplates.length === 0 ? (
          <div className="mt-4">
            <DarkEmpty
              icon="layers"
              title={t('common.empty')}
              message={t('platformMore.templates.copyNote')}
              action={
                <Button size="sm" variant="light" icon="plus" onClick={() => setOpen(true)}>
                  {t('admin.addTemplate')}
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {customTemplates.map((custom) => {
              const base = getTemplate(custom.baseTemplateId)
              return (
                <li
                  key={custom.name}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/4 p-4"
                >
                  <Img
                    src={base.previewImage}
                    alt={base.name}
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[14px] font-semibold text-ivory">{custom.name}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ivory/50">
                      <Badge tone="flame">{t('platformMore.templates.customBadge')}</Badge>
                      {custom.category ? <Badge tone="neutral">{custom.category}</Badge> : null}
                      <span>
                        {t('platformMore.templates.baseTemplate')}: {base.name}
                      </span>
                    </div>
                  </div>
                  <IconButton
                    icon="trash"
                    tone="onDark"
                    className="h-10 w-10"
                    label={t('common.remove')}
                    onClick={() => {
                      removeTemplate(custom.name)
                      showToast({
                        tone: 'info',
                        title: t('toast.deleted'),
                        message: t('platformMore.templates.removedMsg', { name: custom.name }),
                      })
                    }}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      {/* add template modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('admin.addTemplate')}
        description={t('platformMore.templates.copyNote')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" icon="plus" disabled={!trimmed} onClick={submit}>
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('common.name')}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('platformMore.templates.namePh')}
            />
          </Field>
          <Field label={t('platformMore.templates.baseTemplate')}>
            <Select value={baseId} onChange={(e) => setBaseId(e.target.value)}>
              {TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} · {tpl.category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('platformMore.templates.category')}>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-start gap-2.5 rounded-xl border border-sand bg-cream/60 px-4 py-3 text-[12.5px] leading-relaxed text-umber">
            <Icon name="info" size={15} className="mt-0.5 shrink-0 text-flame" />
            <span>{t('platformMore.templates.copyNote')}</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
