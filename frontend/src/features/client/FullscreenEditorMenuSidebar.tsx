import { useState } from 'react'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, EmptyState, Field, IconButton, Img, Input, Modal, Toggle } from '../../shared/ui/ui.tsx'
import { ImagePicker } from '../../shared/ui/ImagePicker.tsx'
import { ImageEditPanel } from './design/ImageEditPanel.tsx'
import { IMG } from '../../shared/lib/images.ts'
import { money, uid } from '../../shared/lib/utils.ts'
import type { MenuItem } from '../../shared/lib/types.ts'
import { useI18n } from '../../shared/i18n'

interface Props {
  draft: any
  updateDraft: (recipe: (draft: any) => void) => void
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

export function MenuSidebar({ draft, updateDraft }: Props) {
  const { t } = useI18n()
  const [editing, setEditing] = useState<{ categoryId: string; item: MenuItem } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const stats = draft.menu.reduce(
    (acc: any, c: any) => {
      acc.items += c.items.length
      acc.available += c.items.filter((i: any) => i.available).length
      return acc
    },
    { categories: draft.menu.length, items: 0, available: 0 }
  )

  const addCategory = () =>
    updateDraft((d: any) => {
      d.menu.push({ id: uid('cat'), name: 'New category', note: '', items: [] })
    })

  const renameCategory = (id: string, name: string) =>
    updateDraft((d: any) => {
      const c = d.menu.find((x: any) => x.id === id)
      if (c) c.name = name
    })

  const setCategoryNote = (id: string, note: string) =>
    updateDraft((d: any) => {
      const c = d.menu.find((x: any) => x.id === id)
      if (c) c.note = note
    })

  const removeCategory = (id: string) => {
    updateDraft((d: any) => {
      d.menu = d.menu.filter((c: any) => c.id !== id)
    })
    setConfirmDelete(null)
  }

  const moveCategory = (id: string, dir: -1 | 1) =>
    updateDraft((d: any) => {
      const index = d.menu.findIndex((c: any) => c.id === id)
      const next = index + dir
      if (index < 0 || next < 0 || next >= d.menu.length) return
      const [moved] = d.menu.splice(index, 1)
      d.menu.splice(next, 0, moved)
    })

  const addItem = (categoryId: string) => {
    const item = newItem()
    updateDraft((d: any) => {
      d.menu.find((c: any) => c.id === categoryId)?.items.push(item)
    })
    setEditing({ categoryId, item })
  }

  const patchItem = (categoryId: string, itemId: string, patch: Partial<MenuItem>) =>
    updateDraft((d: any) => {
      const item = d.menu.find((c: any) => c.id === categoryId)?.items.find((i: any) => i.id === itemId)
      if (item) Object.assign(item, patch)
    })

  const removeItem = (categoryId: string, itemId: string) => {
    updateDraft((d: any) => {
      const c = d.menu.find((x: any) => x.id === categoryId)
      if (c) c.items = c.items.filter((i: any) => i.id !== itemId)
    })
  }

  const duplicateItem = (categoryId: string, itemId: string) =>
    updateDraft((d: any) => {
      const c = d.menu.find((x: any) => x.id === categoryId)
      const index = c?.items.findIndex((i: any) => i.id === itemId) ?? -1
      if (!c || index < 0) return
      const copy: MenuItem = { ...structuredClone(c.items[index]), id: uid('item'), name: `${c.items[index].name} (copy)` }
      c.items.splice(index + 1, 0, copy)
    })

  const moveItem = (categoryId: string, itemId: string, dir: -1 | 1) =>
    updateDraft((d: any) => {
      const c = d.menu.find((x: any) => x.id === categoryId)
      if (!c) return
      const index = c.items.findIndex((i: any) => i.id === itemId)
      const next = index + dir
      if (index < 0 || next < 0 || next >= c.items.length) return
      const [moved] = c.items.splice(index, 1)
      c.items.splice(next, 0, moved)
    })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-4 border-b border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{stats.categories} {t('menuSidebar.categories')}</Badge>
            <Badge tone="neutral">{stats.items} {t('menuSidebar.dishes')}</Badge>
            <Badge tone="moss">{stats.available} {t('menuSidebar.available')}</Badge>
          </div>
          <Button size="sm" variant="outline" icon="plus" onClick={addCategory}>
            {t('menuSidebar.addCategory')}
          </Button>
        </div>
      </div>

      {draft.menu.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            icon="utensils"
            title={t('menuSidebar.noCategories')}
            message={t('menuSidebar.noCategoriesDesc')}
            action={<Button size="sm" icon="plus" onClick={addCategory}>{t('menuSidebar.addCategory')}</Button>}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-4">
          {draft.menu.map((category: any, categoryIndex: number) => (
            <div
              key={category.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              {/* Category header */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2.5">
                <span className="text-white/30" title="Reorder category">
                  <Icon name="grip" size={16} />
                </span>
                <span className="hidden text-[12px] font-semibold text-white/40 sm:block">
                  {String(categoryIndex + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <input
                    value={category.name}
                    aria-label="Category name"
                    onChange={(e) => renameCategory(category.id, e.target.value)}
                    className="w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[14.5px] font-semibold text-white transition hover:border-white/20 focus:border-flame focus:bg-white/10 focus:outline-none"
                  />
                  <input
                    value={category.note}
                    placeholder={t('menuSidebar.categoryNotePlaceholder')}
                    aria-label="Category note"
                    onChange={(e) => setCategoryNote(category.id, e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-[12.5px] text-white/60 transition placeholder:text-white/40 hover:border-white/20 focus:border-flame focus:bg-white/10 focus:outline-none"
                  />
                </div>
                <span className="hidden shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-medium text-white/60 sm:block">
                  {category.items.length} {category.items.length === 1 ? t('menuSidebar.dish') : t('menuSidebar.dishes')}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon="chevronUp" label={t('menuSidebar.moveUp')} size={15} disabled={categoryIndex === 0} onClick={() => moveCategory(category.id, -1)} />
                  <IconButton icon="chevronDown" label={t('menuSidebar.moveDown')} size={15} disabled={categoryIndex === draft.menu.length - 1} onClick={() => moveCategory(category.id, 1)} />
                  <IconButton icon="trash" label={t('menuSidebar.deleteCategory')} size={15} onClick={() => setConfirmDelete(category.id)} />
                </div>
              </div>

              {/* Items */}
              <ul className="divide-y divide-white/5">
                {category.items.map((item: MenuItem, itemIndex: number) => (
                  <li
                    key={item.id}
                    className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/5"
                  >
                    <Img
                      src={item.image}
                      alt={item.name}
                      className="shrink-0 rounded-lg border border-white/10 object-cover h-10 w-10"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="line-clamp-1 font-medium text-white">{item.name}</span>
                        {item.featured ? <Badge tone="flame">{t('menuSidebar.featured')}</Badge> : null}
                        {item.popular ? <Badge tone="gold" icon="star">{t('menuSidebar.popular')}</Badge> : null}
                        {!item.available ? <Badge tone="outline">{t('menuSidebar.offMenu')}</Badge> : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-end">
                      <div className="font-semibold text-white">{money(item.price)}</div>
                      {item.compareAt && item.compareAt > item.price ? (
                        <div className="text-[11.5px] text-white/40 line-through">{money(item.compareAt)}</div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 transition">
                      <IconButton icon="chevronUp" label={t('menuSidebar.moveUp')} size={14} disabled={itemIndex === 0} onClick={() => moveItem(category.id, item.id, -1)} />
                      <IconButton icon="chevronDown" label={t('menuSidebar.moveDown')} size={14} disabled={itemIndex === category.items.length - 1} onClick={() => moveItem(category.id, item.id, 1)} />
                      <IconButton icon="copy" label={t('menuSidebar.duplicate')} size={14} onClick={() => duplicateItem(category.id, item.id)} />
                      <IconButton icon="pencil" label={t('menuSidebar.edit')} size={14} onClick={() => setEditing({ categoryId: category.id, item: structuredClone(item) })} />
                      <IconButton icon="trash" label={t('menuSidebar.delete')} size={14} onClick={() => removeItem(category.id, item.id)} />
                    </div>
                  </li>
                ))}
              </ul>

              {category.items.length === 0 ? (
                <p className="px-3 py-3 text-[13px] text-white/40">{t('menuSidebar.emptyCategory')}</p>
              ) : null}

              <div className="border-t border-white/10 bg-white/5 px-3 py-2.5">
                <Button size="sm" variant="outline" icon="plus" onClick={() => addItem(category.id)} className="w-full">
                  {t('menuSidebar.addDish')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Modal */}
      <ItemModal
        state={editing}
        onClose={() => setEditing(null)}
        onChange={(patch) => {
          if (!editing) return
          patchItem(editing.categoryId, editing.item.id, patch)
          setEditing({ categoryId: editing.categoryId, item: { ...editing.item, ...patch } })
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t('menuSidebar.deleteCategoryConfirm')}
        description={t('menuSidebar.deleteCategoryConfirmDesc')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" icon="trash" onClick={() => confirmDelete && removeCategory(confirmDelete)}>
              {t('menuSidebar.deleteCategory')}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-white/80">
          {t('menuSidebar.deleteCategoryMsg', { name: draft.menu.find((c: any) => c.id === confirmDelete)?.name, count: draft.menu.find((c: any) => c.id === confirmDelete)?.items.length ?? 0 })}
        </p>
      </Modal>
    </div>
  )
}

/* Item Modal Component */
function ItemModal({
  state,
  onClose,
  onChange,
}: {
  state: { categoryId: string; item: MenuItem } | null
  onClose: () => void
  onChange: (patch: Partial<MenuItem>) => void
}) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'details' | 'photo'>('details')

  if (!state) return null
  const { item } = state

  return (
    <Modal
      open
      onClose={onClose}
      title={t('menuSidebar.editDish')}
      description={item.name}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.done')}
          </Button>
          <Button icon="check" onClick={onClose}>
            {t('menuSidebar.applyChanges')}
          </Button>
        </>
      }
    >
      <div className="mb-5 flex gap-2">
        <Button size="sm" variant={tab === 'details' ? 'dark' : 'outline'} onClick={() => setTab('details')} icon="pencil">
          {t('menuSidebar.details')}
        </Button>
        <Button size="sm" variant={tab === 'photo' ? 'dark' : 'outline'} onClick={() => setTab('photo')} icon="image">
          {t('menuSidebar.photo')}
        </Button>
      </div>

      {tab === 'details' ? (
        <div className="space-y-4">
          <Field label={t('menuSidebar.dishName')}>
            <Input value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>

          <Field label={t('menuSidebar.description')} hint={`${item.description.length}/120`}>
            <textarea
              value={item.description}
              maxLength={120}
              rows={2}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm leading-relaxed text-white transition focus:border-flame focus:outline-none focus:ring-4 focus:ring-flame/12"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('menuSidebar.price')}>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={item.price}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
              />
            </Field>
            <Field label={t('menuSidebar.promoPrice')} hint={t('menuSidebar.promoPriceHint')}>
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

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Toggle
              label={t('menuSidebar.featuredDish')}
              description={t('menuSidebar.featuredDishDesc')}
              checked={item.featured}
              onChange={(v) => onChange({ featured: v })}
            />
            <Toggle
              label={t('menuSidebar.markPopular')}
              description={t('menuSidebar.markPopularDesc')}
              checked={item.popular}
              onChange={(v) => onChange({ popular: v })}
            />
            <Toggle
              label={t('menuSidebar.availableToday')}
              description={t('menuSidebar.availableTodayDesc')}
              checked={item.available}
              onChange={(v) => onChange({ available: v })}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-white">{t('menuSidebar.pickPhoto')}</span>
            <span className="text-[11.5px] text-white/50">{t('menuSidebar.offlineLibrary')}</span>
          </div>
          <ImagePicker value={item.image} onSelect={(src) => onChange({ image: src })} />
          <ImageEditPanel
            title={t('design.imageEdit.photoEdit')}
            value={item.image}
            fit={item.imageFit}
            onChange={(src) => onChange({ image: src })}
            onFitChange={(fit) => onChange({ imageFit: fit })}
          />
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 p-3">
            <Img src={item.image} alt="Current dish" className="h-16 w-16 rounded-lg border border-white/10 object-cover" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white">{t('menuSidebar.currentPhoto')}</p>
              <p className="line-clamp-1 text-[12.5px] text-white/60">{item.name}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}