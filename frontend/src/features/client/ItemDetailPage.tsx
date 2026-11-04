import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, Button, Select } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function ItemDetailPage() {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const [qty, setQty] = useState(1)
  const [addon, setAddon] = useState('')

  return (
    <div className="max-w-xl mx-auto px-4 py-10" dir={lang === 'ar' || lang === 'ku' ? 'rtl' : 'ltr'}>
      <Link to="/menu" className="text-sm text-flame hover:underline">{t('item.back', { defaultValue: 'Back to menu' })}</Link>
      <Card className="p-6 mt-4">
        <h1 className="text-xl font-bold text-charcoal">{id === '1' ? 'Falafel Sandwich' : 'Item ' + id}</h1>
        <p className="text-[13px] text-umber mt-1">{t('item.desc', { defaultValue: 'Fresh prepared with tahini.' })}</p>
        <p className="font-bold text-lg mt-2">${id === '1' ? 12 : 8}</p>

        <div className="mt-4">
          <h3 className="text-sm font-semibold">{t('item.options', { defaultValue: 'Options / Add-ons' })}</h3>
          <Select value={addon} onChange={e => setAddon(e.target.value)}>
            <option value="">{t('item.noAddon', { defaultValue: 'No add-on' })}</option>
            <option value="extra">Extra sauce</option>
            <option value="cheese">Cheese</option>
          </Select>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 py-0.5 rounded-md bg-sand/60">-</button>
          <span className="font-medium">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="px-2 py-0.5 rounded-md bg-sand/60">+</button>
        </div>

        <div className="mt-5 flex gap-3">
          <Link to="/cart" className="flex-1"><Button size="lg">{t('item.addToCart', { defaultValue: 'Add to cart' })}</Button></Link>
        </div>

        <div className="mt-4 rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-[11px] text-amber-800">
          <strong>API note:</strong> Glasses/menu API (`GET /api/menu/{id}`) and cart-add endpoint (`POST /api/cart/items`) are partially available; checkout endpoint unavailable.
        </div>
      </Card>
    </div>
  )
}
