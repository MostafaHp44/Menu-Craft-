import { useEffect, useState, type ReactNode } from 'react'
import { useI18n } from '../../../shared/i18n'
import type { TKey } from '../../../shared/i18n'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge, Button, IconButton, Img, Input, Modal, TextArea } from '../../../shared/ui/ui.tsx'
import { IMAGE_LIBRARY } from '../../../shared/lib/images.ts'
import { useStore } from '../../../shared/store/useStore.ts'
import {
  HOME_SEED,
  useHomeContent,
  useHomeContentStore,
} from '../../../shared/store/useHomeContent.ts'
import type { HomeSectionKey } from '../../../shared/store/useHomeContent.ts'
import { cx } from '../../../shared/lib/utils.ts'
import { DARK_FIELD, DemoNote, Panel, PanelHeading, PaddedToggle } from '../parts.tsx'

type SectionKey = HomeSectionKey

const SECTION_KEYS: Record<SectionKey, TKey> = {
  hero: 'platformMore.home.sections.hero',
  templates: 'platformMore.home.sections.templates',
  editorShowcase: 'platformMore.home.sections.editorShowcase',
  workflow: 'platformMore.home.sections.workflow',
  highlights: 'platformMore.home.sections.highlights',
  showcase: 'platformMore.home.sections.showcase',
  pricing: 'platformMore.home.sections.pricing',
  finalCta: 'platformMore.home.sections.finalCta',
}

const SECTION_ICONS: Record<SectionKey, string> = {
  hero: 'sparkles',
  templates: 'layers',
  editorShowcase: 'palette',
  workflow: 'list',
  highlights: 'star',
  showcase: 'monitor',
  pricing: 'tag',
  finalCta: 'send',
}

const MAX_BULLETS = 6
const MAX_STEPS = 5
const MAX_HIGHLIGHTS = 6

/* ------------------------------ dark-shell fields ----------------------------- */

function DarkField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-medium text-ivory/75">{label}</span>
        {hint ? <span className="text-[11px] text-ivory/40">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

function TextField({
  label,
  hint,
  value,
  onChange,
  area,
  rows = 2,
}: {
  label: string
  hint?: string
  value: string
  onChange: (next: string) => void
  area?: boolean
  rows?: number
}) {
  return (
    <DarkField label={label} hint={hint}>
      {area ? (
        <TextArea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={DARK_FIELD}
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className={DARK_FIELD} />
      )}
    </DarkField>
  )
}

/* --------------------------------- sections ---------------------------------- */

function SectionPanel({
  icon,
  title,
  enabled,
  open,
  onToggleOpen,
  onToggleEnabled,
  onReset,
  children,
}: {
  icon: string
  title: string
  enabled: boolean
  open: boolean
  onToggleOpen: () => void
  onToggleEnabled: (next: boolean) => void
  onReset: () => void
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <Panel>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-flame-light">
          <Icon name={icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[14.5px] font-semibold text-ivory">{title}</h4>
          <div className="mt-1">
            <Badge tone={enabled ? 'moss' : 'neutral'}>
              {enabled ? t('common.active') : t('common.inactive')}
            </Badge>
          </div>
        </div>
        <IconButton
          icon="chevronDown"
          tone="onDark"
          label={t('platformMore.home.editSection')}
          aria-expanded={open}
          className={cx(
            'h-10 w-10 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          onClick={onToggleOpen}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="[&_div]:text-ivory">
          <PaddedToggle
            checked={enabled}
            onChange={onToggleEnabled}
            label={t('platformMore.home.visible')}
          />
        </span>
        <Button size="sm" className="h-10" variant="light" icon="refresh" onClick={onReset}>
          {t('platformMore.home.resetSection')}
        </Button>
      </div>

      {open ? <div className="mt-4 space-y-4 border-t border-white/8 pt-4">{children}</div> : null}
    </Panel>
  )
}

/* -------------------------------- list editors ------------------------------- */

function StringListEditor({
  legend,
  addLabel,
  items,
  max,
  labelFor,
  onChange,
}: {
  legend: string
  addLabel: string
  items: string[]
  max: number
  labelFor: (index: number) => string
  onChange: (next: string[]) => void
}) {
  const { t } = useI18n()

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
          {legend}
        </span>
        {items.length >= max ? (
          <span className="text-[11.5px] text-ivory/40">{t('platformMore.home.maxNote')}</span>
        ) : (
          <Button
            size="sm"
            className="h-10"
            variant="light"
            icon="plus"
            onClick={() => onChange([...items, ''])}
          >
            {addLabel}
          </Button>
        )}
      </div>

      <ul className="mt-2.5 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <Input
              value={item}
              aria-label={labelFor(index)}
              className={DARK_FIELD}
              onChange={(e) =>
                onChange(items.map((current, i) => (i === index ? e.target.value : current)))
              }
            />
            <IconButton
              icon="trash"
              tone="onDark"
              className="h-10 w-10 shrink-0"
              label={t('common.remove')}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function PairListEditor({
  legend,
  addLabel,
  titleLabel,
  bodyLabel,
  items,
  max,
  labelFor,
  onChange,
}: {
  legend: string
  addLabel: string
  titleLabel: string
  bodyLabel: string
  items: { title: string; body: string }[]
  max: number
  labelFor: (index: number) => string
  onChange: (next: { title: string; body: string }[]) => void
}) {
  const { t } = useI18n()

  const patch = (index: number, part: Partial<{ title: string; body: string }>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...part } : item)))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
          {legend}
        </span>
        {items.length >= max ? (
          <span className="text-[11.5px] text-ivory/40">{t('platformMore.home.maxNote')}</span>
        ) : (
          <Button
            size="sm"
            className="h-10"
            variant="light"
            icon="plus"
            onClick={() => onChange([...items, { title: '', body: '' }])}
          >
            {addLabel}
          </Button>
        )}
      </div>

      <ul className="mt-2.5 space-y-3">
        {items.map((item, index) => (
          <li key={index} className="rounded-2xl border border-white/8 bg-white/4 p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
                {labelFor(index)}
              </span>
              <IconButton
                icon="trash"
                tone="onDark"
                className="h-10 w-10 shrink-0"
                label={t('common.remove')}
                disabled={items.length <= 1}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              />
            </div>
            <div className="space-y-3">
              <TextField
                label={titleLabel}
                value={item.title}
                onChange={(value) => patch(index, { title: value })}
              />
              <TextField
                area
                rows={2}
                label={bodyLabel}
                value={item.body}
                onChange={(value) => patch(index, { body: value })}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------- image picker ------------------------------- */

function ImagePicker({ value, onChange }: { value: string; onChange: (src: string) => void }) {
  const { t } = useI18n()

  return (
    <div>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-medium text-ivory/75">{t('common.image')}</span>
        <span className="text-[11px] text-ivory/40">{t('platformMore.home.imageHint')}</span>
      </span>
      <div>
        {value ? (
          <Img src={value} alt="" className="h-32 w-full rounded-xl object-cover" />
        ) : (
          <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-white/15 text-[12.5px] text-ivory/45">
            {t('platformMore.home.noImage')}
          </div>
        )}

        <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <button
            type="button"
            aria-label={t('platformMore.home.noImage')}
            aria-pressed={!value}
            onClick={() => onChange('')}
            className={cx(
              'flex aspect-[4/3] items-center justify-center rounded-lg border transition',
              !value
                ? 'border-flame bg-flame/12 text-flame-light'
                : 'border-white/12 bg-white/4 text-ivory/50 hover:border-white/30'
            )}
          >
            <Icon name="x" size={16} />
          </button>
          {IMAGE_LIBRARY.map((image) => (
            <button
              key={image.src}
              type="button"
              title={image.label}
              aria-label={image.label}
              aria-pressed={value === image.src}
              onClick={() => onChange(image.src)}
              className={cx(
                'aspect-[4/3] overflow-hidden rounded-lg border-2 transition',
                value === image.src
                  ? 'border-flame'
                  : 'border-transparent hover:border-white/25'
              )}
            >
              <Img src={image.src} alt={image.label} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- the tab ---------------------------------- */

export default function HomeTab() {
  const { t } = useI18n()
  const content = useHomeContent()
  const update = useHomeContentStore((s) => s.update)
  const resetHome = useHomeContentStore((s) => s.resetHome)
  const showToast = useStore((s) => s.showToast)

  const [openSection, setOpenSection] = useState<SectionKey | null>('hero')
  const [confirmReset, setConfirmReset] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    setPulse(true)
    const timer = window.setTimeout(() => setPulse(false), 1600)
    return () => window.clearTimeout(timer)
  }, [content.updatedAt])

  const toggleOpen = (key: SectionKey) =>
    setOpenSection((current) => (current === key ? null : key))

  const setEnabled = (key: SectionKey, next: boolean) =>
    update((draft) => {
      draft[key].enabled = next
    })

  const resetSection = (key: SectionKey) => {
    update((draft) => {
      Object.assign(draft, { [key]: structuredClone(HOME_SEED[key]) })
    })
    showToast({
      tone: 'info',
      title: t('toast.updated'),
      message: t('platformMore.home.sectionResetMsg', { section: t(SECTION_KEYS[key]) }),
    })
  }

  const panel = (key: SectionKey, children: ReactNode) => {
    const section = content[key]
    return (
      <SectionPanel
        key={key}
        icon={SECTION_ICONS[key]}
        title={t(SECTION_KEYS[key])}
        enabled={section.enabled}
        open={openSection === key}
        onToggleOpen={() => toggleOpen(key)}
        onToggleEnabled={(next) => setEnabled(key, next)}
        onReset={() => resetSection(key)}
      >
        {children}
      </SectionPanel>
    )
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <Panel>
        <PanelHeading
          title={t('platformMore.home.tab')}
          description={t('platformMore.home.subtitle')}
          actions={
            <>
              <span
                aria-hidden={!pulse}
                className={cx(
                  'text-[11.5px] font-medium text-flame-light transition-opacity duration-500',
                  pulse ? 'opacity-100' : 'opacity-0'
                )}
              >
                {t('common.done')}
              </span>
              <Button to="/" size="sm" className="h-10" variant="light" icon="external">
                {t('platformMore.home.viewHome')}
              </Button>
            </>
          }
        />
        <div className="mt-4">
          <DemoNote>{t('platformMore.home.localNote')}</DemoNote>
        </div>
      </Panel>

      {/* hero */}
      {panel(
        'hero',
        <>
          <TextField
            label={t('platformMore.home.eyebrow')}
            value={content.hero.eyebrow}
            onChange={(value) =>
              update((draft) => {
                draft.hero.eyebrow = value
              })
            }
          />
          <TextField
            area
            label={t('platformMore.home.title')}
            hint={t('platformMore.home.accentHint')}
            value={content.hero.title}
            onChange={(value) =>
              update((draft) => {
                draft.hero.title = value
              })
            }
          />
          <TextField
            area
            label={t('common.description')}
            value={content.hero.sub}
            onChange={(value) =>
              update((draft) => {
                draft.hero.sub = value
              })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t('platformMore.home.cta')}
              value={content.hero.cta}
              onChange={(value) =>
                update((draft) => {
                  draft.hero.cta = value
                })
              }
            />
            <TextField
              label={t('platformMore.home.ctaSecondary')}
              value={content.hero.secondaryCta}
              onChange={(value) =>
                update((draft) => {
                  draft.hero.secondaryCta = value
                })
              }
            />
          </div>
          <TextField
            area
            label={t('platformMore.home.note')}
            value={content.hero.note}
            onChange={(value) =>
              update((draft) => {
                draft.hero.note = value
              })
            }
          />
          <ImagePicker
            value={content.hero.image}
            onChange={(src) =>
              update((draft) => {
                draft.hero.image = src
              })
            }
          />
        </>
      )}

      {/* featured templates */}
      {panel(
        'templates',
        <>
          <TextField
            label={t('platformMore.home.eyebrow')}
            value={content.templates.eyebrow ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.templates.eyebrow = value
              })
            }
          />
          <TextField
            area
            label={t('platformMore.home.title')}
            hint={t('platformMore.home.accentHint')}
            value={content.templates.title}
            onChange={(value) =>
              update((draft) => {
                draft.templates.title = value
              })
            }
          />
          <TextField
            area
            label={t('common.description')}
            value={content.templates.sub ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.templates.sub = value
              })
            }
          />
        </>
      )}

      {/* editor showcase */}
      {panel(
        'editorShowcase',
        <>
          <TextField
            label={t('platformMore.home.eyebrow')}
            value={content.editorShowcase.eyebrow}
            onChange={(value) =>
              update((draft) => {
                draft.editorShowcase.eyebrow = value
              })
            }
          />
          <TextField
            area
            label={t('platformMore.home.title')}
            hint={t('platformMore.home.accentHint')}
            value={content.editorShowcase.title}
            onChange={(value) =>
              update((draft) => {
                draft.editorShowcase.title = value
              })
            }
          />
          <TextField
            area
            label={t('common.description')}
            value={content.editorShowcase.sub}
            onChange={(value) =>
              update((draft) => {
                draft.editorShowcase.sub = value
              })
            }
          />
          <StringListEditor
            legend={t('platformMore.home.bullets')}
            addLabel={t('platformMore.home.addBullet')}
            items={content.editorShowcase.bullets}
            max={MAX_BULLETS}
            labelFor={(index) => t('platformMore.home.bulletField', { n: index + 1 })}
            onChange={(next) =>
              update((draft) => {
                draft.editorShowcase.bullets = next
              })
            }
          />
        </>
      )}

      {/* workflow */}
      {panel(
        'workflow',
        <>
          <TextField
            label={t('platformMore.home.eyebrow')}
            value={content.workflow.eyebrow ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.workflow.eyebrow = value
              })
            }
          />
          <TextField
            area
            label={t('platformMore.home.title')}
            hint={t('platformMore.home.accentHint')}
            value={content.workflow.title}
            onChange={(value) =>
              update((draft) => {
                draft.workflow.title = value
              })
            }
          />
          <TextField
            area
            label={t('common.description')}
            value={content.workflow.sub ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.workflow.sub = value
              })
            }
          />
          <PairListEditor
            legend={t('platformMore.home.steps')}
            addLabel={t('platformMore.home.addStep')}
            titleLabel={t('platformMore.home.title')}
            bodyLabel={t('platformMore.home.body')}
            items={content.workflow.steps}
            max={MAX_STEPS}
            labelFor={(index) => t('platformMore.home.stepField', { n: index + 1 })}
            onChange={(next) =>
              update((draft) => {
                draft.workflow.steps = next
              })
            }
          />
        </>
      )}

      {/* highlights */}
      {panel(
        'highlights',
        <PairListEditor
          legend={t('platformMore.home.highlights')}
          addLabel={t('platformMore.home.addHighlight')}
          titleLabel={t('platformMore.home.title')}
          bodyLabel={t('platformMore.home.body')}
          items={content.highlights.items}
          max={MAX_HIGHLIGHTS}
          labelFor={(index) => t('platformMore.home.highlightField', { n: index + 1 })}
          onChange={(next) =>
            update((draft) => {
              draft.highlights.items = next
            })
          }
        />
      )}

      {/* responsive showcase */}
      {panel(
        'showcase',
        <>
          <TextField
            label={t('platformMore.home.eyebrow')}
            value={content.showcase.eyebrow ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.showcase.eyebrow = value
              })
            }
          />
          <TextField
            area
            label={t('platformMore.home.title')}
            hint={t('platformMore.home.accentHint')}
            value={content.showcase.title}
            onChange={(value) =>
              update((draft) => {
                draft.showcase.title = value
              })
            }
          />
          <TextField
            area
            label={t('common.description')}
            value={content.showcase.sub ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.showcase.sub = value
              })
            }
          />
        </>
      )}

      {/* pricing */}
      {panel(
        'pricing',
        <>
          <TextField
            label={t('platformMore.home.eyebrow')}
            value={content.pricing.eyebrow ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.pricing.eyebrow = value
              })
            }
          />
          <TextField
            area
            label={t('platformMore.home.title')}
            hint={t('platformMore.home.accentHint')}
            value={content.pricing.title}
            onChange={(value) =>
              update((draft) => {
                draft.pricing.title = value
              })
            }
          />
          <TextField
            area
            label={t('common.description')}
            value={content.pricing.sub ?? ''}
            onChange={(value) =>
              update((draft) => {
                draft.pricing.sub = value
              })
            }
          />
          <TextField
            area
            label={t('platformMore.home.note')}
            value={content.pricing.note}
            onChange={(value) =>
              update((draft) => {
                draft.pricing.note = value
              })
            }
          />
        </>
      )}

      {/* final CTA */}
      {panel(
        'finalCta',
        <>
          <TextField
            area
            label={t('platformMore.home.title')}
            hint={t('platformMore.home.accentHint')}
            value={content.finalCta.title}
            onChange={(value) =>
              update((draft) => {
                draft.finalCta.title = value
              })
            }
          />
          <TextField
            area
            label={t('common.description')}
            value={content.finalCta.sub}
            onChange={(value) =>
              update((draft) => {
                draft.finalCta.sub = value
              })
            }
          />
          <TextField
            label={t('platformMore.home.cta')}
            value={content.finalCta.cta}
            onChange={(value) =>
              update((draft) => {
                draft.finalCta.cta = value
              })
            }
          />
        </>
      )}

      {/* global reset */}
      <Panel>
        <PanelHeading
          title={t('platformMore.home.resetTitle')}
          description={t('platformMore.home.resetConfirmBody')}
          actions={
            <Button variant="light" icon="refresh" onClick={() => setConfirmReset(true)}>
              {t('platformMore.home.resetAll')}
            </Button>
          }
        />
      </Panel>

      {/* reset confirmation */}
      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('platformMore.home.resetConfirmTitle')}
        description={t('platformMore.home.resetConfirmBody')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              icon="refresh"
              onClick={() => {
                resetHome()
                setConfirmReset(false)
                showToast({
                  tone: 'success',
                  title: t('toast.updated'),
                  message: t('platformMore.home.resetMsg'),
                })
              }}
            >
              {t('platformMore.home.resetAll')}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-umber">{t('platformMore.home.localNote')}</p>
      </Modal>
    </div>
  )
}
