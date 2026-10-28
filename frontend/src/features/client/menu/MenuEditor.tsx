import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../../shared/ui/icons.tsx'
import { Badge, Button, EmptyState, Field, IconButton, Img, Input, Modal, Toggle } from '../../../shared/ui/ui.tsx'
import { ImagePicker } from '../../../shared/ui/ImagePicker.tsx'
import { IMG } from '../../../shared/lib/images.ts'
import { cx, money, uid } from '../../../shared/lib/utils.ts'
import type { MenuItem } from '../../../shared/lib/types.ts'
import { useStore } from '../../../shared/store/useStore.ts'

/* ------------------------------------------------------------------ *
 * Shared menu CRUD surface — used by /dashboard/menu and by the
 * visual editor's "Menu" panel. Always edits the working draft.
 * ------------------------------------------------------------------ */

interface Props {
  /** denser paddings for the editor's narrow control column */
  compact?: boolean
  /** show Save / Discard footer (dashboard). The editor uses its top bar. */
  showActions?: boolean
}

function newItem(): MenuItem {
  return {
    id: uid('item'),
    name: 'New dish',
    description: 'Describe the dish in one line.',
    price: 12,
    compareAt: null,
    image: IMG.saladPlate,
    featured: false,
    popular: false,
    available: true,
  }
}

export function MenuEditor({ compact = false, showActions = false }: Props) {
  const draft = useStore((s) => s.draft)
  const dirty = useStore((s) => s.dirty)
  const beginEdit = useStore((s) => s.beginEdit)
  const updateDraft = useStore((s) => s.updateDraft)
  const saveDraft = useStore((s) => s.saveDraft)
  const discardDraft = useStore((s) => s.discardDraft)
  const showToast = useStore((s) => s.showToast)

  const [editing, setEditing] = useState<{ categoryId: string; item: MenuItem } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!draft) beginEdit()
  }, [draft, beginEdit])

  const stats = useMemo(() => {
    if (!draft) return { categories: 0, items: 0, available: 0 }
    const items = draft.menu.reduce((sum, c) => sum + c.items.length, 0)
    const available = draft.menu.reduce((sum, c) => sum + c.items.filter((i) => i.available).length, 0)
    return { categories: draft.menu.length, items, available }
  }, [draft])

  if (!draft) {
    return <EmptyState title="Loading your menu" message="Opening the working copy of your restaurant…" />
  }

  const menu = draft.menu
  const pad = compact ? 'p-3' : 'p-4 sm:p-5'

  /* ------------------------------ mutations ------------------------------ */

  const addCategory = () =>
    updateDraft((d) => {
      d.menu.push({ id: uid('cat'), name: 'New category', note: '', items: [] })
    })

  const renameCategory = (id: string, name: string) =>
    updateDraft((d) => {
      const c = d.menu.find((x) => x.id === id)
      if (c) c.name = name
    })

  const setCategoryNote = (id: string, note: string) =>
    updateDraft((d) => {
      const c = d.menu.find((x) => x.id === id)
      if (c) c.note = note
    })

  const removeCategory = (id: string) => {
    updateDraft((d) => {
      d.menu = d.menu.filter((c) => c.id !== id)
    })
    setConfirmDelete(null)
    showToast({ title: 'Category removed', tone: 'info' })
  }

  const moveCategory = (id: string, dir: -1 | 1) =>
    updateDraft((d) => {
      const index = d.menu.findIndex((c) => c.id === id)
      const next = index + dir
      if (index < 0 || next < 0 || next >= d.menu.length) return
      const [moved] = d.menu.splice(index, 1)
      d.menu.splice(next, 0, moved)
    })

  const addItem = (categoryId: string) => {
    const item = newItem()
    updateDraft((d) => {
      d.menu.find((c) => c.id === categoryId)?.items.push(item)
    })
    setEditing({ categoryId, item })
  }

  const patchItem = (categoryId: string, itemId: string, patch: Partial<MenuItem>) =>
    updateDraft((d) => {
      const item = d.menu.find((c) => c.id === categoryId)?.items.find((i) => i.id === itemId)
      if (item) Object.assign(item, patch)
    })

  const removeItem = (categoryId: string, itemId: string) => {
    updateDraft((d) => {
      const c = d.menu.find((x) => x.id === categoryId)
      if (c) c.items = c.items.filter((i) => i.id !== itemId)
    })
    showToast({ title: 'Dish removed', tone: 'info' })
  }

  const duplicateItem = (categoryId: string, itemId: string) =>
    updateDraft((d) => {
      const c = d.menu.find((x) => x.id === categoryId)
      const index = c?.items.findIndex((i) => i.id === itemId) ?? -1
      if (!c || index < 0) return
      const copy: MenuItem = { ...structuredClone(c.items[index]), id: uid('item'), name: `${c.items[index].name} (copy)` }
      c.items.splice(index + 1, 0, copy)
      showToast({ title: 'Dish duplicated', tone: 'success' })
    })

  const moveItem = (categoryId: string, itemId: string, dir: -1 | 1) =>
    updateDraft((d) => {
      const c = d.menu.find((x) => x.id === categoryId)
      if (!c) return
      const index = c.items.findIndex((i) => i.id === itemId)
      const next = index + dir
      if (index < 0 || next < 0 || next >= c.items.length) return
      const [moved] = c.items.splice(index, 1)
      c.items.splice(next, 0, moved)
    })

  /* -------------------------------- render -------------------------------- */

  return (
    <div className={cx('space-y-4', showActions && 'pb-2')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{stats.categories} categories</Badge>
          <Badge tone="neutral">{stats.items} dishes</Badge>
          <Badge tone="moss">{stats.available} available</Badge>
          {dirty ? <Badge tone="gold" icon="pencil">Unsaved</Badge> : null}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" icon="plus" onClick={addCategory}>
            Add category
          </Button>
        </div>
      </div>

      {menu.length === 0 ? (
        <EmptyState
          icon="utensils"
          title="No categories yet"
          message="Start by adding a category such as “Starters”, then fill it with dishes."
          action={<Button size="sm" icon="plus" onClick={addCategory}>Add category</Button>}
        />
      ) : null}

      {menu.map((category, categoryIndex) => (
        <div
          key={category.id}
          className="overflow-hidden rounded-2xl border border-sand bg-paper shadow-[0_14px_34px_-30px_rgba(27,23,20,0.7)]"
        >
          {/* category header */}
          <div className={cx('flex items-center gap-2 border-b border-sand/80 bg-cream/60', pad)}>
            <span className="text-clay" title="Reorder category">
              <Icon name="grip" size={16} />
            </span>
            <span className="hidden text-[12px] font-semibold text-clay sm:block">
              {String(categoryIndex + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <input
                value={category.name}
                aria-label="Category name"
                onChange={(e) => renameCategory(category.id, e.target.value)}
                className="w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[14.5px] font-semibold text-charcoal transition hover:border-sand focus:border-flame focus:bg-paper focus:outline-none"
              />
              <input
                value={category.note}
                placeholder="Optional note — e.g. “Served after 17:00”"
                aria-label="Category note"
                onChange={(e) => setCategoryNote(category.id, e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-[12.5px] text-umber transition placeholder:text-clay hover:border-sand focus:border-flame focus:bg-paper focus:outline-none"
              />
            </div>
            <span className="hidden shrink-0 rounded-full bg-paper px-2.5 py-1 text-[11.5px] font-medium text-umber sm:block">
              {category.items.length} {category.items.length === 1 ? 'dish' : 'dishes'}
            </span>
            <div className="flex shrink-0 items-center">
              <IconButton icon="chevronUp" label="Move category up" size={15} disabled={categoryIndex === 0} onClick={() => moveCategory(category.id, -1)} />
              <IconButton
                icon="chevronDown"
                label="Move category down"
                size={15}
                disabled={categoryIndex === menu.length - 1}
                onClick={() => moveCategory(category.id, 1)}
              />
              <IconButton icon="trash" label="Delete category" size={15} onClick={() => setConfirmDelete(category.id)} />
            </div>
          </div>

          {/* items */}
          <ul className="divide-y divide-sand/70">
            {category.items.map((item, itemIndex) => (
              <li
                key={item.id}
                className={cx(
                  'group flex items-center gap-3 transition hover:bg-cream/40',
                  compact ? 'px-3 py-2.5' : 'px-4 py-3'
                )}
              >
                <Img
                  src={item.image}
                  alt={item.name}
                  className={cx('shrink-0 rounded-lg border border-sand object-cover', compact ? 'h-10 w-10' : 'h-12 w-12')}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cx('line-clamp-1 font-medium text-charcoal', compact ? 'text-[13px]' : 'text-[14px]')}>
                      {item.name}
                    </span>
                    {item.featured ? <Badge tone="flame">Featured</Badge> : null}
                    {item.popular ? <Badge tone="gold" icon="star">Popular</Badge> : null}
                    {!item.available ? <Badge tone="outline">Off menu</Badge> : null}
                  </div>
                  {!compact && item.description ? (
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-umber">{item.description}</p>
                  ) : null}
                </div>

                <div className="shrink-0 text-end">
                  <div className={cx('font-semibold text-charcoal', compact ? 'text-[13px]' : 'text-[14px]')}>
                    {money(item.price)}
                  </div>
                  {item.compareAt && item.compareAt > item.price ? (
                    <div className="text-[11.5px] text-clay line-through">{money(item.compareAt)}</div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                  <IconButton
                    icon="chevronUp"
                    label="Move dish up"
                    size={14}
                    disabled={itemIndex === 0}
                    onClick={() => moveItem(category.id, item.id, -1)}
                  />
                  <IconButton
                    icon="chevronDown"
                    label="Move dish down"
                    size={14}
                    disabled={itemIndex === category.items.length - 1}
                    onClick={() => moveItem(category.id, item.id, 1)}
                  />
                  <IconButton
                    icon="copy"
                    label="Duplicate dish"
                    size={14}
                    onClick={() => duplicateItem(category.id, item.id)}
                  />
                  <IconButton
                    icon="pencil"
                    label="Edit dish"
                    size={14}
                    onClick={() => setEditing({ categoryId: category.id, item: structuredClone(item) })}
                  />
                  <IconButton
                    icon="trash"
                    label="Delete dish"
                    size={14}
                    onClick={() => removeItem(category.id, item.id)}
                  />
                </div>
              </li>
            ))}
          </ul>

          {category.items.length === 0 ? (
            <p className={cx('text-[13px] text-clay', compact ? 'px-3 py-3' : 'px-4 py-4')}>
              This category is empty — add the first dish.
            </p>
          ) : null}

          <div className={cx('border-t border-sand/70 bg-cream/40', pad)}>
            <Button size="sm" variant="outline" icon="plus" onClick={() => addItem(category.id)}>
              Add dish
            </Button>
          </div>
        </div>
      ))}

      {showActions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand bg-paper p-4">
          <p className="text-[13px] text-umber">
            {dirty ? 'You have unsaved changes to this menu.' : 'Everything is saved.'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={!dirty} onClick={() => discardDraft()}>
              Discard
            </Button>
            <Button size="sm" variant="outline" icon="save" disabled={!dirty} onClick={() => saveDraft()}>
              Save changes
            </Button>
            <Button size="sm" icon="send" onClick={() => useStore.getState().publishDemo()}>
              Publish demo
            </Button>
          </div>
        </div>
      ) : null}

      <ItemModal
        state={editing}
        onClose={() => setEditing(null)}
        onChange={(patch) => {
          if (!editing) return
          patchItem(editing.categoryId, editing.item.id, patch)
          setEditing({ categoryId: editing.categoryId, item: { ...editing.item, ...patch } })
        }}
      />

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this category?"
        description="Every dish inside it will be removed from the menu. This can be undone from the editor."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon="trash" onClick={() => confirmDelete && removeCategory(confirmDelete)}>
              Delete category
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-umber">
          You are about to delete{' '}
          <strong className="font-semibold text-charcoal">
            {menu.find((c) => c.id === confirmDelete)?.name}
          </strong>{' '}
          and its {menu.find((c) => c.id === confirmDelete)?.items.length ?? 0} dish(es).
        </p>
      </Modal>
    </div>
  )
}

/* ------------------------------- item modal ------------------------------- */

function ItemModal({
  state,
  onClose,
  onChange,
}: {
  state: { categoryId: string; item: MenuItem } | null
  onClose: () => void
  onChange: (patch: Partial<MenuItem>) => void
}) {
  const [tab, setTab] = useState<'details' | 'photo'>('details')

  if (!state) return null
  const { item } = state

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit dish"
      description={item.name}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
          <Button icon="check" onClick={onClose}>
            Apply changes
          </Button>
        </>
      }
    >
      <div className="mb-5 flex gap-2">
        <Button
          size="sm"
          variant={tab === 'details' ? 'dark' : 'outline'}
          onClick={() => setTab('details')}
          icon="pencil"
        >
          Details
        </Button>
        <Button
          size="sm"
          variant={tab === 'photo' ? 'dark' : 'outline'}
          onClick={() => setTab('photo')}
          icon="image"
        >
          Photo
        </Button>
      </div>

      {tab === 'details' ? (
        <div className="space-y-4">
          <Field label="Dish name">
            <Input value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>

          <Field label="Description" hint={`${item.description.length}/120`}>
            <textarea
              value={item.description}
              maxLength={120}
              rows={2}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full rounded-xl border border-sand bg-paper px-3.5 py-2.5 text-sm leading-relaxed text-charcoal transition focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/12"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={item.price}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
              />
            </Field>
            <Field label="Promotional price" hint="optional · shows struck through">
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="—"
                value={item.compareAt ?? ''}
                onChange={(e) => onChange({ compareAt: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-sand bg-cream/50 p-4">
            <Toggle
              label="Featured dish"
              description="Appears in the Featured Dishes section"
              checked={item.featured}
              onChange={(v) => onChange({ featured: v })}
            />
            <Toggle
              label="Mark as popular"
              description="Shows a “Popular” badge on the menu"
              checked={item.popular}
              onChange={(v) => onChange({ popular: v })}
            />
            <Toggle
              label="Available today"
              description="Turn off to hide it from guests without deleting it"
              checked={item.available}
              onChange={(v) => onChange({ available: v })}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-espresso">Pick a photo</span>
            <span className="text-[11.5px] text-clay">Bundled library · works offline</span>
          </div>
          <ImagePicker value={item.image} onSelect={(src) => onChange({ image: src })} />
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-sand p-3">
            <Img src={item.image} alt="Current dish" className="h-16 w-16 rounded-lg border border-sand object-cover" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-charcoal">Current photo</p>
              <p className="line-clamp-1 text-[12.5px] text-umber">{item.name}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
