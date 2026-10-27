import { useMemo, useState } from 'react'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge, Button, ChoiceCard, ColorField, Field, IconButton, Img, Input, Segmented, SliderField, Toggle } from '../../../shared/ui/ui.tsx'
import { FONTS, fontName } from '../../../templates/data/fonts.ts'
import { IMAGE_LIBRARY } from '../../../shared/lib/images.ts'
import { PALETTE_PRESETS, THEME_OPTIONS, THEME_SURFACES } from '../../../templates/data/palettes.ts'
import { getTemplate } from '../../../templates/data/templates.ts'
import type { ColorSet, FontId, ImageAspect, LogoStyle, Restaurant, SectionId } from '../../../shared/lib/types.ts'
import { cx, slugify } from '../../../shared/lib/utils.ts'
import { useStore } from '../../../shared/store/useStore.ts'

/* ------------------------------------------------------------------ *
 * Design control panels — one implementation shared by the visual
 * editor and the dashboard's Design & Branding page.
 * ------------------------------------------------------------------ */

export function PanelNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] leading-relaxed text-clay">{children}</p>
}

export function PanelBlock({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-umber">{title}</h3>
        {description ? <p className="mt-1 text-[12.5px] leading-relaxed text-clay">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

/* -------------------------------- branding -------------------------------- */

export function BrandingPanel({ compact = false }: { compact?: boolean }) {
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)
  const [heroOpen, setHeroOpen] = useState(false)

  if (!draft) return <PanelNote>Loading the working copy…</PanelNote>

  const set = <K extends keyof Restaurant>(key: K, value: Restaurant[K]) =>
    updateDraft((d) => {
      d[key] = value
    })

  return (
    <div className={cx('space-y-6', compact && 'space-y-5')}>
      <PanelBlock title="Identity" description="What guests read at the very top of the site.">
        <div className="space-y-3">
          <Field label="Restaurant name">
            <Input value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label="Short description" hint={`${draft.description.length} chars`}>
            <textarea
              value={draft.description}
              rows={3}
              maxLength={180}
              onChange={(e) => set('description', e.target.value)}
              className="w-full rounded-xl border border-sand bg-paper px-3.5 py-2.5 text-sm leading-relaxed text-charcoal transition focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/12"
            />
          </Field>
          <div className="rounded-xl border border-sand bg-cream/50 px-3.5 py-3">
            <button
              type="button"
              onClick={() =>
                set('slug', slugify(draft.name).replace(/[^a-z0-9-]/g, '') || draft.slug)
              }
              className="flex w-full items-center justify-between gap-3 text-start"
            >
              <span>
                <span className="block text-[12.5px] font-medium text-espresso">Public address</span>
                <span className="block font-mono text-[12.5px] text-umber">{draft.slug}.menucraft.com</span>
              </span>
              <span className="shrink-0 text-end text-[11.5px] font-medium text-flame">
                Sync with name
                <span className="block font-mono font-normal text-umber">
                  {slugify(draft.name) || draft.slug}
                </span>
              </span>
            </button>
          </div>
        </div>
      </PanelBlock>

      <PanelBlock title="Logo" description="How the wordmark is rendered in the header.">
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold text-white shadow-inner"
            style={{ backgroundColor: draft.design.colors.primary }}
          >
            {draft.logoText.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 space-y-2.5">
            <Field label="Logo text" hint="2–3 characters">
              <Input
                value={draft.logoText}
                maxLength={3}
                onChange={(e) => set('logoText', e.target.value.toUpperCase())}
              />
            </Field>
          </div>
        </div>
        <Segmented<LogoStyle>
          full
          size="sm"
          ariaLabel="Logo style"
          value={draft.logoStyle}
          onChange={(v) => set('logoStyle', v)}
          options={[
            { value: 'monogram', label: 'Monogram' },
            { value: 'wordmark', label: 'Wordmark' },
            { value: 'badge', label: 'Badge' },
          ]}
        />
      </PanelBlock>

      <PanelBlock title="Hero image" description="The first photograph guests see.">
        <button
          type="button"
          onClick={() => setHeroOpen((v) => !v)}
          className="group relative block w-full overflow-hidden rounded-xl border border-sand"
        >
          <Img src={draft.heroImage} alt="Current hero" className="h-36 w-full object-cover transition group-hover:scale-[1.02]" />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-[12px] font-medium text-white">
            Change hero photo
            <Icon name={heroOpen ? 'chevronUp' : 'chevronDown'} size={14} />
          </span>
        </button>
        {heroOpen ? (
          <div className="max-h-56 overflow-y-auto rounded-xl border border-sand p-2 thin-scroll">
            <div className="grid grid-cols-4 gap-2">
              {IMAGE_LIBRARY.map((image) => (
                <button
                  key={image.src}
                  type="button"
                  title={image.label}
                  aria-label={`Use ${image.label}`}
                  onClick={() => {
                    set('heroImage', image.src)
                    setHeroOpen(false)
                  }}
                  className={cx(
                    'overflow-hidden rounded-lg border-2 transition',
                    draft.heroImage === image.src ? 'border-flame ring-2 ring-flame/25' : 'border-transparent hover:border-clay'
                  )}
                >
                  <Img src={image.src} alt={image.label} className="aspect-[4/3] w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </PanelBlock>

      <PanelBlock title="Gallery" description={`${draft.gallery.length} photos selected · shown in the Gallery section.`}>
        <div className="grid grid-cols-3 gap-2">
          {IMAGE_LIBRARY.slice(0, 15).map((image) => {
            const active = draft.gallery.includes(image.src)
            return (
              <button
                key={image.src}
                type="button"
                aria-pressed={active}
                title={image.label}
                onClick={() =>
                  set(
                    'gallery',
                    active ? draft.gallery.filter((s) => s !== image.src) : [...draft.gallery, image.src]
                  )
                }
                className={cx(
                  'relative overflow-hidden rounded-lg border-2 transition',
                  active ? 'border-flame' : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                <Img src={image.src} alt={image.label} className="aspect-square w-full object-cover" />
                {active ? (
                  <span className="absolute end-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-flame text-white">
                    <Icon name="check" size={10} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </PanelBlock>

      <PanelBlock title="Contact details" description="Shown in the Contact and footer sections.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone">
            <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={draft.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
        <Field label="Address">
          <Input value={draft.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      </PanelBlock>
    </div>
  )
}

/* --------------------------------- colors --------------------------------- */

const COLOR_LABELS: Array<{ key: keyof ColorSet; label: string; note: string }> = [
  { key: 'primary', label: 'Primary', note: 'Logo, headings, key surfaces' },
  { key: 'accent', label: 'Accent', note: 'Highlights & small details' },
  { key: 'button', label: 'Button', note: 'Calls to action' },
  { key: 'background', label: 'Background', note: 'Page canvas' },
  { key: 'card', label: 'Card', note: 'Menu cards & panels' },
  { key: 'text', label: 'Text', note: 'Body copy' },
  { key: 'secondary', label: 'Secondary', note: 'Muted labels' },
]

export function ColorPanel() {
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  if (!draft) return <PanelNote>Loading the working copy…</PanelNote>

  const template = getTemplate(draft.templateId)
  const activePreset = PALETTE_PRESETS.find((p) =>
    Object.entries(p.colors).every(([key, value]) => draft.design.colors[key as keyof typeof p.colors] === value)
  )

  return (
    <div className="space-y-6">
      <PanelBlock title="Palettes" description="Balanced starting points — everything stays editable.">
        <div className="grid gap-2 sm:grid-cols-2">
          {PALETTE_PRESETS.map((preset) => {
            const active = activePreset?.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateDraft((d) => {
                    d.design.colors = { ...preset.colors }
                    d.design.layout.theme = 'custom'
                  })
                }
                className={cx(
                  'rounded-xl border p-2.5 text-start transition',
                  active
                    ? 'border-charcoal bg-paper shadow-[0_14px_30px_-24px_rgba(27,23,20,0.9)]'
                    : 'border-sand bg-cream/50 hover:border-clay hover:bg-cream'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {[preset.colors.accent, preset.colors.primary, preset.colors.background, preset.colors.card].map(
                    (color, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </span>
                <span className="mt-2 block text-[12.5px] font-semibold text-charcoal">{preset.name}</span>
                <span className="block text-[11.5px] leading-snug text-umber">{preset.note}</span>
              </button>
            )
          })}
        </div>
      </PanelBlock>

      <PanelBlock title="Custom colors" description="Seven slots, HEX entry included.">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {COLOR_LABELS.map((row) => (
            <ColorField
              key={row.key}
              label={row.label}
              value={draft.design.colors[row.key]}
              onChange={(hex) =>
                updateDraft((d) => {
                  d.design.colors[row.key] = hex
                  if (row.key === 'background' || row.key === 'text' || row.key === 'card') {
                    d.design.layout.theme = 'custom'
                  }
                })
              }
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-cream/50 px-3.5 py-2.5">
          <span className="text-[12.5px] text-umber">
            Reset restores <strong className="font-semibold text-espresso">{template.name}</strong> defaults.
          </span>
          <Button
            size="sm"
            variant="outline"
            icon="refresh"
            onClick={() =>
              updateDraft((d) => {
                d.design.colors = { ...template.defaultDesign.colors }
                d.design.layout.theme = template.defaultDesign.layout.theme
              })
            }
          >
            Reset colors
          </Button>
        </div>
      </PanelBlock>
    </div>
  )
}

/* ------------------------------- typography ------------------------------- */

export function TypographyPanel() {
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  const presets = useMemo(
    () => [
      { name: 'Editorial', heading: 'playfair' as FontId, body: 'inter' as FontId, weight: 600, scale: 1.05 },
      { name: 'Modern', heading: 'inter' as FontId, body: 'inter' as FontId, weight: 700, scale: 1 },
      { name: 'Bold', heading: 'montserrat' as FontId, body: 'poppins' as FontId, weight: 700, scale: 1.1 },
      { name: 'Literary', heading: 'lora' as FontId, body: 'dm-sans' as FontId, weight: 600, scale: 1.02 },
    ],
    []
  )

  if (!draft) return <PanelNote>Loading the working copy…</PanelNote>
  const t = draft.design.typography

  const apply = (patch: Partial<typeof t>) =>
    updateDraft((d) => {
      Object.assign(d.design.typography, patch)
    })

  const fontGroup = (label: string, key: 'heading' | 'body' | 'menu') => (
    <div>
      <div className="mb-2 text-[12.5px] font-medium text-espresso">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {FONTS.map((font) => {
          const active = t[key] === font.id
          return (
            <button
              key={font.id}
              type="button"
              aria-pressed={active}
              onClick={() => apply({ [key]: font.id } as Partial<typeof t>)}
              className={cx(
                'rounded-xl border px-3 py-2 text-start transition',
                active
                  ? 'border-charcoal bg-paper shadow-[0_12px_26px_-22px_rgba(27,23,20,0.9)]'
                  : 'border-sand bg-cream/50 hover:border-clay hover:bg-cream'
              )}
            >
              <span className="line-clamp-1 text-[15px] leading-tight text-charcoal" style={{ fontFamily: font.stack }}>
                Aa
              </span>
              <span className="mt-0.5 line-clamp-1 text-[11.5px] font-medium text-umber">{font.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PanelBlock title="Presets" description="Four hand-picked pairings.">
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => apply({ heading: preset.heading, body: preset.body, headingWeight: preset.weight, headingScale: preset.scale })}
              className="rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-start transition hover:border-clay hover:bg-cream"
            >
              <span className="block text-[13px] font-semibold text-charcoal">{preset.name}</span>
              <span className="line-clamp-1 text-[11.5px] text-umber">
                {fontName(preset.heading)} · {fontName(preset.body)}
              </span>
            </button>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title="Font families" description="Loaded from Google Fonts and applied live.">
        <div className="space-y-4">
          {fontGroup('Headings', 'heading')}
          {fontGroup('Body copy', 'body')}
          {fontGroup('Menu items', 'menu')}
        </div>
      </PanelBlock>

      <PanelBlock title="Scale & rhythm">
        <div className="space-y-4">
          <SliderField
            label="Headline size"
            value={t.headingScale}
            min={0.85}
            max={1.3}
            step={0.01}
            suffix="×"
            onChange={(v) => apply({ headingScale: v })}
          />
          <SliderField
            label="Body size"
            value={t.bodyScale}
            min={0.9}
            max={1.2}
            step={0.01}
            suffix="×"
            onChange={(v) => apply({ bodyScale: v })}
          />
          <SliderField
            label="Headline weight"
            value={t.headingWeight}
            min={400}
            max={800}
            step={100}
            onChange={(v) => apply({ headingWeight: v })}
          />
          <SliderField
            label="Line height"
            value={t.lineHeight}
            min={1.3}
            max={1.9}
            step={0.05}
            onChange={(v) => apply({ lineHeight: v })}
          />
        </div>
      </PanelBlock>
    </div>
  )
}

/* --------------------------------- layout --------------------------------- */

const ASPECTS: Array<{ value: ImageAspect; label: string }> = [
  { value: 'square', label: 'Square' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'wide', label: 'Wide' },
]

export function LayoutPanel() {
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  if (!draft) return <PanelNote>Loading the working copy…</PanelNote>
  const l = draft.design.layout

  const apply = (patch: Partial<typeof l>) =>
    updateDraft((d) => {
      Object.assign(d.design.layout, patch)
    })

  return (
    <div className="space-y-6">
      <PanelBlock title="Theme" description="Swaps the surface triplet while keeping your accents.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={l.theme === option.id}
              onClick={() =>
                updateDraft((d) => {
                  const surface = THEME_SURFACES[option.id]
                  d.design.colors.background = surface.background
                  d.design.colors.text = surface.text
                  d.design.colors.card = surface.card
                  d.design.layout.theme = option.id
                })
              }
              className={cx(
                'rounded-xl border p-2.5 text-start transition',
                l.theme === option.id ? 'border-charcoal bg-paper' : 'border-sand bg-cream/50 hover:border-clay'
              )}
            >
              <span className="flex gap-1">
                <span
                  className="h-5 w-5 rounded-md border border-black/10"
                  style={{ backgroundColor: THEME_SURFACES[option.id].background }}
                />
                <span
                  className="h-5 w-5 rounded-md border border-black/10"
                  style={{ backgroundColor: THEME_SURFACES[option.id].card }}
                />
                <span
                  className="h-5 w-5 rounded-md border border-black/10"
                  style={{ backgroundColor: THEME_SURFACES[option.id].text }}
                />
              </span>
              <span className="mt-1.5 block text-[12.5px] font-semibold text-charcoal">{option.name}</span>
              <span className="block text-[11px] text-umber">{option.note}</span>
            </button>
          ))}
          <button
            type="button"
            aria-pressed={l.theme === 'custom'}
            onClick={() => apply({ theme: 'custom' })}
            className={cx(
              'rounded-xl border p-2.5 text-start transition',
              l.theme === 'custom' ? 'border-charcoal bg-paper' : 'border-sand bg-cream/50 hover:border-clay'
            )}
          >
            <span className="flex gap-1">
              <span className="h-5 w-5 rounded-md border border-black/10 bg-paper" />
              <span className="h-5 w-5 rounded-md border border-black/10" style={{ backgroundColor: draft.design.colors.background }} />
              <span className="h-5 w-5 rounded-md border border-black/10" style={{ backgroundColor: draft.design.colors.text }} />
            </span>
            <span className="mt-1.5 block text-[12.5px] font-semibold text-charcoal">Custom</span>
            <span className="block text-[11px] text-umber">Your own colors</span>
          </button>
        </div>
      </PanelBlock>

      <PanelBlock title="Header style">
        <div className="grid gap-2">
          <ChoiceCard
            label="Split"
            note="Logo left · links centre · CTA right"
            active={l.header === 'split'}
            onClick={() => apply({ header: 'split' })}
          />
          <ChoiceCard
            label="Centered"
            note="Logo stacked above centred links"
            active={l.header === 'centered'}
            onClick={() => apply({ header: 'centered' })}
          />
          <ChoiceCard
            label="Minimal"
            note="Logo left · compact link row"
            active={l.header === 'minimal'}
            onClick={() => apply({ header: 'minimal' })}
          />
        </div>
      </PanelBlock>

      <PanelBlock title="Hero style">
        <div className="grid grid-cols-3 gap-2">
          {(['fullscreen', 'split', 'editorial'] as const).map((value) => (
            <ChoiceCard
              key={value}
              label={value === 'fullscreen' ? 'Full' : value === 'split' ? 'Split' : 'Editorial'}
              active={l.hero === value}
              onClick={() => apply({ hero: value })}
              preview={
                <span className="flex h-12 items-center justify-center overflow-hidden rounded-lg border border-sand bg-cream">
                  {value === 'fullscreen' ? (
                    <span className="h-6 w-10 rounded bg-clay/60" />
                  ) : value === 'split' ? (
                    <span className="flex h-6 w-10 gap-0.5">
                      <span className="flex-1 rounded-s bg-clay/60" />
                      <span className="flex-1 rounded-e bg-stone" />
                    </span>
                  ) : (
                    <span className="h-1.5 w-10 rounded bg-clay/60" />
                  )}
                </span>
              }
            />
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title="Menu layout">
        <Segmented
          full
          value={l.menuLayout}
          onChange={(v) => apply({ menuLayout: v })}
          options={[
            { value: 'grid', label: 'Grid cards', icon: 'grid' },
            { value: 'list', label: 'Classic list', icon: 'list' },
          ]}
        />
        <Segmented
          full
          value={l.card}
          onChange={(v) => apply({ card: v })}
          options={[
            { value: 'bordered', label: 'Bordered' },
            { value: 'elevated', label: 'Elevated' },
            { value: 'flat', label: 'Flat' },
          ]}
        />
      </PanelBlock>

      <PanelBlock title="Images">
        <div className="grid grid-cols-4 gap-2">
          {ASPECTS.map((aspect) => (
            <button
              key={aspect.value}
              type="button"
              aria-pressed={l.aspect === aspect.value}
              onClick={() => apply({ aspect: aspect.value })}
              className={cx(
                'rounded-xl border p-2 transition',
                l.aspect === aspect.value ? 'border-charcoal bg-paper' : 'border-sand bg-cream/50 hover:border-clay'
              )}
            >
              <span className="mx-auto flex h-9 items-center justify-center">
                <span
                  className={cx(
                    'rounded-sm border-2',
                    l.aspect === aspect.value ? 'border-flame bg-flame/25' : 'border-clay bg-clay/20'
                  )}
                  style={{
                    width:
                      aspect.value === 'square' ? 26 : aspect.value === 'portrait' ? 22 : aspect.value === 'landscape' ? 32 : 34,
                    height:
                      aspect.value === 'square' ? 26 : aspect.value === 'portrait' ? 28 : aspect.value === 'landscape' ? 24 : 19,
                  }}
                />
              </span>
              <span className="mt-1 block text-center text-[11px] font-medium text-umber">{aspect.label}</span>
            </button>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title="Shape & spacing">
        <div className="space-y-4">
          <SliderField label="Corner radius" value={l.radius} min={0} max={24} suffix="px" onChange={(v) => apply({ radius: v })} />
          <div>
            <div className="mb-1.5 text-[13px] font-medium text-espresso">Section spacing</div>
            <Segmented
              full
              value={String(l.spacing)}
              onChange={(v) => apply({ spacing: Number(v) as 0 | 1 | 2 })}
              options={[
                { value: '0', label: 'Compact' },
                { value: '1', label: 'Balanced' },
                { value: '2', label: 'Airy' },
              ]}
            />
          </div>
        </div>
      </PanelBlock>
    </div>
  )
}

/* -------------------------------- sections -------------------------------- */

const SECTION_META: Record<SectionId, { label: string; note: string; icon: string }> = {
  featured: { label: 'Featured dishes', note: 'Hand-picked highlights', icon: 'star' },
  menu: { label: 'Menu', note: 'The full menu by category', icon: 'utensils' },
  about: { label: 'Our story', note: 'Description + hero photo', icon: 'book' },
  gallery: { label: 'Gallery', note: 'Photo grid from your library', icon: 'image' },
  hours: { label: 'Opening hours', note: 'Weekly schedule table', icon: 'clock' },
  contact: { label: 'Contact', note: 'Address, phone, map link', icon: 'mapPin' },
}

export function SectionsPanel() {
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)

  if (!draft) return <PanelNote>Loading the working copy…</PanelNote>
  const sections = draft.design.sections

  const toggle = (id: SectionId) =>
    updateDraft((d) => {
      const section = d.design.sections.find((s) => s.id === id)
      if (section) section.enabled = !section.enabled
    })

  const move = (id: SectionId, dir: -1 | 1) =>
    updateDraft((d) => {
      const index = d.design.sections.findIndex((s) => s.id === id)
      const next = index + dir
      if (index < 0 || next < 0 || next >= d.design.sections.length) return
      const [moved] = d.design.sections.splice(index, 1)
      d.design.sections.splice(next, 0, moved)
    })

  const enabledCount = sections.filter((s) => s.enabled).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PanelNote>Sections render top to bottom on the public menu.</PanelNote>
        <Badge tone="neutral">{enabledCount} of {sections.length} on</Badge>
      </div>

      <ul className="space-y-2">
        {sections.map((section, index) => {
          const meta = SECTION_META[section.id]
          return (
            <li
              key={section.id}
              className={cx(
                'flex items-center gap-3 rounded-xl border p-3 transition',
                section.enabled ? 'border-sand bg-paper' : 'border-dashed border-stone bg-cream/40'
              )}
            >
              <span
                className={cx(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition',
                  section.enabled ? 'bg-charcoal text-ivory' : 'bg-stone/50 text-umber'
                )}
              >
                <Icon name={meta.icon} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-[13.5px] font-medium text-charcoal">{meta.label}</span>
                <span className="line-clamp-1 text-[12px] text-umber">{meta.note}</span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <IconButton icon="chevronUp" label={`Move ${meta.label} up`} size={14} disabled={index === 0} onClick={() => move(section.id, -1)} />
                <IconButton
                  icon="chevronDown"
                  label={`Move ${meta.label} down`}
                  size={14}
                  disabled={index === sections.length - 1}
                  onClick={() => move(section.id, 1)}
                />
                <span className="ms-1">
                  <Toggle checked={section.enabled} onChange={() => toggle(section.id)} />
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
