import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, Img } from '../../shared/ui/ui.tsx'
import { useCustomize } from '../../shared/lib/hooks.ts'
import { TEMPLATES, getTemplate } from '../../templates/data/templates.ts'
import { cx } from '../../shared/lib/utils.ts'
import { useActiveRestaurant } from '../../shared/store/useStore.ts'

export default function TemplatesPage() {
  const r = useActiveRestaurant()
  const customize = useCustomize()
  const current = getTemplate(r.templateId)

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-[16px] font-semibold text-charcoal">
            Applied: <span className="text-flame">{current.name}</span>
          </h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-umber">
            Applying a template replaces your design (colors, fonts, layout) while keeping your menu,
            photos and contact details untouched.
          </p>
        </div>
        <Link
          to="/templates"
          className="inline-flex items-center gap-1.5 rounded-full border border-sand px-4 py-2 text-[13px] font-medium text-espresso transition hover:border-clay hover:bg-cream"
        >
          Full template gallery
          <Icon name="arrowRight" size={14} />
        </Link>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((template) => {
          const active = template.id === r.templateId
          return (
            <article
              key={template.id}
              className={cx(
                'group flex flex-col overflow-hidden rounded-2xl border bg-paper transition',
                active
                  ? 'border-charcoal ring-2 ring-flame/35'
                  : 'border-sand hover:-translate-y-1 hover:border-clay hover:shadow-[0_24px_50px_-38px_rgba(27,23,20,0.8)]'
              )}
            >
              <Link to={`/templates/${template.id}`} className="relative block overflow-hidden">
                <Img
                  src={template.previewImage}
                  alt={`${template.name} preview`}
                  className="aspect-[16/11] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                <span className="absolute start-3 top-3 flex items-center gap-2">
                  {active ? (
                    <Badge tone="dark" className="bg-flame text-white">
                      In use
                    </Badge>
                  ) : null}
                  {template.featured && !active ? <Badge tone="dark">Featured</Badge> : null}
                </span>
                <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                  <span className="text-white">
                    <span className="block text-[15.5px] font-semibold drop-shadow">{template.name}</span>
                    <span className="block text-[12px] text-white/80">{template.category}</span>
                  </span>
                  <span className="flex gap-1">
                    {template.chips.slice(0, 3).map((chip, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-white/40"
                        style={{ backgroundColor: chip }}
                      />
                    ))}
                  </span>
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-[13px] leading-relaxed text-umber">{template.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-cream px-2.5 py-1 text-[11px] text-umber">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2 pt-1">
                  <Link
                    to={`/templates/${template.id}`}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-sand text-[13px] font-medium text-espresso transition hover:border-clay hover:bg-cream"
                  >
                    <Icon name="eye" size={14} />
                    Preview
                  </Link>
                  <Button
                    size="sm"
                    className="h-9 flex-1"
                    variant={active ? 'outline' : 'dark'}
                    onClick={() => customize(template.id)}
                  >
                    {active ? 'Re-open' : 'Use template'}
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
