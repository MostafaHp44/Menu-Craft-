import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { MarketingFooter } from '../../shared/chrome/MarketingFooter.tsx'
import { MarketingHeader } from '../../shared/chrome/MarketingHeader.tsx'
import { Badge, Button, EmptyState, Img } from '../../shared/ui/ui.tsx'
import { useCustomize } from '../../shared/lib/hooks.ts'
import { TEMPLATE_CATEGORIES } from '../../templates/data/templates.ts'
import { useTemplateList } from '../../templates/data/useTemplateList.ts'
import { cx } from '../../shared/lib/utils.ts'
import type { TemplateCategory } from '../../shared/lib/types.ts'

type SortId = 'featured' | 'az' | 'category'

export default function Templates() {
  const customize = useCustomize()
  const templates = useTemplateList()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof TEMPLATE_CATEGORIES)[number]>('All')
  const [sort, setSort] = useState<SortId>('featured')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = templates.filter((template) => {
      const matchesCategory = category === 'All' || template.category === category
      if (!matchesCategory) return false
      if (!q) return true
      const haystack = [
        template.name,
        template.category,
        template.tagline,
        template.description,
        template.personality,
        ...template.tags,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })

    if (sort === 'az') return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'category') return [...filtered].sort((a, b) => a.category.localeCompare(b.category))
    return [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured))
  }, [query, category, sort, templates])

  const reset = () => {
    setQuery('')
    setCategory('All')
    setSort('featured')
  }

  return (
    <div className="min-h-screen bg-ivory">
      <MarketingHeader solid />

      {/* -------------------------------- head -------------------------------- */}
      <section className="relative overflow-hidden border-b border-sand/70 pb-14 pt-[118px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(232,87,31,0.12),transparent_65%)]"
        />
        <div className="page relative">
          <div className="max-w-3xl">
            <span className="eyebrow flex items-center gap-2">
              <span className="h-px w-6 bg-current opacity-50" />
              Template gallery
              <span className="h-px w-6 bg-current opacity-50" />
            </span>
            <h1 className="display-serif mt-4 text-[clamp(38px,5.6vw,68px)] leading-[1.04] text-charcoal">
              Eight complete designs.
              <br />
              Every one is editable.
            </h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-espresso/85">
              Each template ships with its own palette, typography, layout and sample menu. Preview it as a
              real scrolling site, then take it into the editor and make it yours.
            </p>
          </div>

          {/* controls */}
          <div className="mt-9 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-umber">
                <Icon name="search" size={17} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search “fine dining”, “dark”, “bakery”…"
                aria-label="Search templates"
                className="h-12 w-full rounded-full border border-sand bg-paper ps-11 pe-11 text-[14.5px] text-charcoal shadow-[0_14px_36px_-30px_rgba(27,23,20,0.9)] transition placeholder:text-clay focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/12"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  className="absolute end-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-umber transition hover:bg-cream"
                >
                  <Icon name="x" size={15} />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="me-1 text-[12.5px] text-clay">
                {results.length} of {templates.length}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                aria-label="Sort templates"
                className="h-10 rounded-full border border-sand bg-paper px-4 text-[13px] font-medium text-espresso transition hover:border-clay focus:border-flame focus:outline-none"
              >
                <option value="featured">Featured first</option>
                <option value="az">A → Z</option>
                <option value="category">By category</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((item) => {
              const active = category === item
              const count =
                item === 'All'
                  ? templates.length
                  : templates.filter((t) => t.category === (item as TemplateCategory)).length
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(item)}
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition',
                    active
                      ? 'border-charcoal bg-charcoal text-ivory shadow-[0_12px_28px_-20px_rgba(27,23,20,0.95)]'
                      : 'border-sand bg-paper text-espresso hover:border-clay hover:bg-cream'
                  )}
                >
                  {item}
                  <span className={cx('text-[11px]', active ? 'text-ivory/60' : 'text-clay')}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------- grid -------------------------------- */}
      <section className="page py-12 lg:py-16">
        {results.length === 0 ? (
          <EmptyState
            icon="search"
            title="No templates match that search"
            message={`Nothing found for “${query}”${category !== 'All' ? ` in ${category}` : ''}. Try a broader term or clear the filters.`}
            action={
              <Button icon="refresh" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((template, index) => (
              <article
                key={template.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-sand bg-paper anim-fade-up"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                {/* image + live hover swap */}
                <Link
                  to={`/templates/${template.id}`}
                  className="relative block aspect-[16/11] overflow-hidden bg-cream"
                  aria-label={`Preview ${template.name}`}
                >
                  <Img
                    src={template.previewImage}
                    alt={`${template.name} template preview`}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                  />
                  <Img
                    src={template.gallery[0] ?? template.heroImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100 group-hover:scale-[1.05]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/15" />

                  <span className="absolute start-4 top-4 flex flex-wrap gap-2">
                    {template.custom ? (
                      <Badge tone="dark" className="bg-gold text-ink">
                        New
                      </Badge>
                    ) : null}
                    {template.featured ? (
                      <Badge tone="dark" className="bg-flame text-white" icon="star">
                        Featured
                      </Badge>
                    ) : null}
                    <Badge tone="dark">{template.category}</Badge>
                  </span>

                  <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <span className="text-white">
                      <span className="block text-[19px] font-semibold leading-tight drop-shadow-sm">
                        {template.name}
                      </span>
                      <span className="block text-[12.5px] text-white/85">{template.personality}</span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-flame">
                      <Icon name="arrowUpRight" size={16} />
                    </span>
                  </span>

                  {/* palette chips */}
                  <span className="absolute end-4 top-4 flex gap-1.5">
                    {template.chips.map((chip, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border border-white/50 shadow-sm"
                        style={{ backgroundColor: chip }}
                      />
                    ))}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[14px] leading-relaxed text-umber">{template.tagline}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-cream px-2.5 py-1 text-[11.5px] text-umber">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-4 border-t border-sand/70 pt-3.5 text-[12px] text-clay">
                    <span className="flex items-center gap-1.5">
                      <Icon name="utensils" size={13} />
                      {template.sampleMenu.length} sections
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="users" size={13} />
                      {template.custom
                        ? 'just added'
                        : `${template.usageCount.toLocaleString()} uses`}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button to={`/templates/${template.id}`} variant="outline" size="sm" icon="eye" full>
                      Preview
                    </Button>
                    <Button size="sm" variant="dark" icon="arrowRight" full onClick={() => customize(template.id)}>
                      Customize
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------- CTA --------------------------------- */}
      <section className="relative overflow-hidden bg-ink py-16 text-ivory lg:py-20">
        <div className="page relative text-center">
          <span className="eyebrow text-ivory/50">Not sure yet?</span>
          <h2 className="display-serif mx-auto mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] leading-[1.06]">
            Start with any template — switching later keeps your menu.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-ivory/65">
            Dishes, prices, photos and contact details never change when you change the design.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button to="/dashboard/editor" size="lg" variant="accent" icon="layout">
              Open the editor
            </Button>
            <Button to="/dashboard" size="lg" variant="light" icon="home">
              Go to dashboard
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
