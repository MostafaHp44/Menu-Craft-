import { NavLink } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, Img } from '../../shared/ui/ui.tsx'
import { useTemplateList } from '../../templates/data/useTemplateList.ts'
import { useSelectedTemplates } from './useSelectedTemplates.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'
import { cx, tx } from '../../shared/lib/utils.ts'
import { useI18n } from '../../shared/i18n'
import { confirmDialog } from '../../shared/components/dialogs.tsx'
import type { TemplateDefinition } from '../../shared/lib/types.ts'

/**
 * "قوالبي" — التمبليتات التي اختارها صاحب المطعم من معرض القوالب،
 * مخزّنة في قاعدة البيانات لكل موقع (RestaurantTemplates).
 */
export default function MyTemplatesPage() {
  const { t } = useI18n()
  const r = useActiveRestaurant()
  const draftTemplateId = useStore((s) => s.draft?.templateId) ?? r.templateId
  const templates = useTemplateList()
  const { items, loading, remove } = useSelectedTemplates()

  /* الربط مع تعريفات التمبليتات المحلية — المعرّفات غير المعروفة تُتجاهل */
  const chosen: Array<{ templateId: string; selectedAt: string; tpl: TemplateDefinition }> = []
  for (const sel of items) {
    const tpl = templates.find((x) => x.id === sel.templateId)
    if (tpl) chosen.push({ templateId: sel.templateId, selectedAt: sel.selectedAt, tpl })
  }

  const handleDelete = async (templateId: string) => {
    const ok = await confirmDialog({
      title: t('myTemplates.deleteTitle', { defaultValue: 'حذف القالب؟' }),
      message: t('myTemplates.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    await remove(templateId)
  }

  /**
   * فتح المحرر في تاب جديدة:
   *  • التمبليت المطبّق حالياً → المحرر مباشرة (يكمل تعديلاته بدون إعادة استيراد).
   *  • تمبليت آخر → يُطبَّق تصميمه أولاً (بدون استيراد منيو يمسح تعديلاته).
   */
  const openEditor = (templateId: string) => {
    const url =
      templateId && templateId !== draftTemplateId
        ? `/dashboard/editor?templateId=${encodeURIComponent(templateId)}&apply=1`
        : '/dashboard/editor'
    window.open(url, '_blank')
  }

  if (!loading && chosen.length === 0) {
    return (
      <div className="space-y-5">
        <Card className="p-5 text-center">
          <Icon name="edit" size={32} className="mx-auto text-flame/50 mb-3" />
          <h2 className="text-[16px] font-semibold text-charcoal mb-2">
            {t('myTemplates.emptyTitle')}
          </h2>
          <p className="text-[13.5px] text-umber mb-4 max-w-xl mx-auto">
            {t('myTemplates.emptyDesc')}
          </p>
          <NavLink
            to="/dashboard/templates"
            className="inline-flex items-center gap-2 rounded-full bg-flame px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-flame/90"
          >
            <Icon name="layers" size={15} />
            {t('myTemplates.browseTemplates')}
          </NavLink>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-charcoal">{t('myTemplates.title')}</h2>
          <p className="mt-1 text-[13.5px] text-umber">{t('myTemplates.subtitle')}</p>
        </div>
        <NavLink
          to="/dashboard/templates"
          className="inline-flex items-center gap-1.5 rounded-full border border-sand px-4 py-2 text-[13px] font-medium text-espresso transition hover:border-clay hover:bg-cream"
        >
          <Icon name="plus" size={14} />
          {t('myTemplates.addNew')}
        </NavLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {chosen.map(({ templateId, tpl }) => {
          const active = templateId === draftTemplateId
          return (
            <article
              key={templateId}
              className={cx(
                'group flex flex-col overflow-hidden rounded-2xl border bg-paper transition',
                active
                  ? 'border-charcoal ring-2 ring-flame/35'
                  : 'border-sand hover:-translate-y-1 hover:border-clay hover:shadow-[0_24px_50px_-38px_rgba(27,23,20,0.8)]'
              )}
            >
              <button
                type="button"
                className="relative block w-full overflow-hidden text-start"
                onClick={() => openEditor(templateId)}
              >
                <Img
                  src={tpl.previewImage || tpl.heroImage}
                  alt={`${tpl.name} preview`}
                  className="aspect-[16/11] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                <span className="absolute start-3 top-3 flex items-center gap-2">
                  {active ? (
                    <Badge tone="dark" className="bg-flame text-white">
                      {t('myTemplates.inUse')}
                    </Badge>
                  ) : null}
                </span>
                <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                  <span className="text-white">
                    <span className="block text-[15.5px] font-semibold drop-shadow">{tpl.name}</span>
                    <span className="block text-[12px] text-white/80">{tpl.category}</span>
                  </span>
                  <span className="flex gap-1">
                    {tpl.chips.slice(0, 3).map((chip, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-white/40"
                        style={{ backgroundColor: chip }}
                      />
                    ))}
                  </span>
                </span>
              </button>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-[13px] leading-relaxed text-umber">{tpl.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tpl.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-cream px-2.5 py-1 text-[11px] text-umber">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1"
                    onClick={() => openEditor(templateId)}
                  >
                    <Icon name="eye" size={14} className="mr-1" />
                    {t('myTemplates.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9"
                    icon="trash"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void handleDelete(templateId)
                    }}
                  />
                </div>
              </div>
            </article>
          )
        })}

        {/* Current restaurant */}
        <article
          className={cx(
            'group flex flex-col overflow-hidden rounded-2xl border bg-paper transition',
            'border-charcoal ring-2 ring-flame/35'
          )}
        >
          <button
            type="button"
            className="relative block w-full overflow-hidden text-start"
            onClick={() => window.open('/dashboard/editor', '_blank')}
          >
            <Img
              src={r.heroImage}
              alt={`${tx(r.name)} preview`}
              className="aspect-[16/11] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
            <span className="absolute start-3 top-3 flex items-center gap-2">
              <Badge tone="dark" className="bg-flame text-white">
                {t('myTemplates.current')}
              </Badge>
            </span>
            <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
              <span className="text-white">
                <span className="block text-[15.5px] font-semibold drop-shadow">{tx(r.name)}</span>
                <span className="block text-[12px] text-white/80">{t('myTemplates.currentSite')}</span>
              </span>
            </span>
          </button>

          <div className="flex flex-1 flex-col p-4">
            <p className="text-[13px] leading-relaxed text-umber">{tx(r.description) || t('myTemplates.currentSiteDesc')}</p>
            <div className="mt-4 flex gap-2 pt-1">
              <Button
                size="sm"
                variant="dark"
                className="h-9 flex-1"
                onClick={() => window.open('/dashboard/editor', '_blank')}
              >
                <Icon name="pencil" size={14} className="mr-1" />
                {t('myTemplates.continueEditing')}
              </Button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
