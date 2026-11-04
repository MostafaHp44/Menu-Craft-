import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function MenuPage() {
  const { t } = useI18n()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const categories = [{ id: 'all', label: 'All' }, { id: 'mains', label: 'Mains' }, { id: 'drinks', label: 'Drinks' }]
  const items = [
    { id: 1, name: 'Falafel Sandwich', price: 12, category: 'mains', desc: 'Fresh falafel with tahini.' },
    { id: 2, name: 'Grilled Chicken', price: 18, category: 'mains', desc: 'Herb-marinated chicken.' },
    { id: 3, name: 'Orange Juice', price: 8, category: 'drinks', desc: 'Fresh squeezed.' },
  ]
  const filtered = selectedCategory === 'all' ? items : items.filter(i => i.category === selectedCategory)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-charcoal mb-2">{t('menu.title', { defaultValue: 'Menu' })}</h1>
      <p className="text-sm text-umber mb-6">{t('menu.sub', { defaultValue: 'Browse items and add to cart.' })}</p>
      <div className="flex gap-2 mb-6">
        {categories.map(c => (
          <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${selectedCategory === c.id ? 'bg-charcoal text-ivory' : 'bg-sand text-umber'}`}>{c.label}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(i => (
          <Card key={i.id} className="p-4">
            <h3 className="font-semibold text-charcoal">{i.name}</h3>
            <p className="text-[12px] text-umber mt-1">{i.desc}</p>
            <p className="font-bold text-charcoal mt-2">${i.price}</p>
            <Link to="/cart" className="mt-3 inline-block"><Button size="sm" variant="outline">{t('menu.add', { defaultValue: 'Add to cart' })}</Button></Link>
          </Card>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[12.5px] text-amber-800">
        <strong>API unavailable:</strong> Menu API (`/api/menu`) is available; checkout/cart creation endpoints are not yet exposed.
      </div>
    </div>
  )
}
