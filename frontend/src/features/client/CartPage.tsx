import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Input, Select, Field } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function CartPage() {
  const { t, lang } = useI18n()
  const [items, setItems] = useState<{ id: string; name: string; qty: number; price: number; note: string; options: string[] }[]>(() => {
    try {
      const saved = localStorage.getItem('cart_items')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [branchId, setBranchId] = useState(() => localStorage.getItem('cart_branch') || '')
  const [mode, setMode] = useState<'dinein' | 'delivery' | 'takeaway'>('dinein')
  const [tableNo, setTableNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNote, setCustomerNote] = useState('')

  const total = items.reduce((s, i) => s + i.qty * i.price, 0)

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items))
  }, [items])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" dir={lang === 'ar' || lang === 'ku' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-charcoal mb-6">{t('cart.title', { defaultValue: 'Cart' })}</h1>

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-[15px] text-charcoal mb-3">{t('cart.items', { defaultValue: 'Items' })}</h2>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border-b border-sand/50 pb-3 mb-3">
            <div className="flex-1">
              <p className="font-medium text-[13.5px]">{item.name}</p>
              <p className="text-[12px] text-umber">{item.qty} × {item.price}</p>
              {item.note ? <p className="text-[11px] text-clay">Note: {item.note}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} className="px-2 py-0.5 rounded-md bg-sand/60">-</button>
              <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
              <button onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))} className="px-2 py-0.5 rounded-md bg-sand/60">+</button>
              <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="ml-2 text-rose text-xs">{t('cart.remove', { defaultValue: 'Remove' })}</button>
            </div>
          </div>
        ))}
        <div className="mt-4 pt-3 border-t border-sand flex justify-between items-center">
          <span className="font-medium text-charcoal">{t('cart.total', { defaultValue: 'Total' })}</span>
          <span className="font-bold text-xl">{total.toFixed(2)}</span>
        </div>
      </Card>

      <Card className="p-5 mb-5">
        <h2 className="font-semibold text-[15px] text-charcoal mb-3">{t('cart.branch', { defaultValue: 'Branch' })}</h2>
        <Select value={branchId} onChange={e => { setBranchId(e.target.value); localStorage.setItem('cart_branch', e.target.value) }}>
          <option value="">{t('cart.chooseBranch', { defaultValue: 'Choose branch' })}</option>
          <option value="b1">Main Branch</option>
          <option value="b2">Downtown Branch</option>
        </Select>

        <h2 className="font-semibold text-[15px] text-charcoal mb-2 mt-4">{t('cart.mode', { defaultValue: 'Order mode' })}</h2>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setMode('dinein')} className={`px-3 py-1 rounded-full text-sm font-medium ${mode === 'dinein' ? 'bg-ink text-ivory' : 'bg-sand text-umber'}`}>{t('cart.dinein')}</button>
          <button onClick={() => setMode('delivery')} className={`px-3 py-1 rounded-full text-sm font-medium ${mode === 'delivery' ? 'bg-ink text-ivory' : 'bg-sand text-umber'}`}>{t('cart.delivery')}</button>
          <button onClick={() => setMode('takeaway')} className={`px-3 py-1 rounded-full text-sm font-medium ${mode === 'takeaway' ? 'bg-ink text-ivory' : 'bg-sand text-umber'}`}>{t('cart.takeaway')}</button>
        </div>

        {mode === 'dinein' && (
          <Field label={t('cart.table', { defaultValue: 'Table number' })}>
            <Input value={tableNo} onChange={e => setTableNo(e.target.value)} placeholder="e.g. 5" />
          </Field>
        )}

        <div className="grid gap-3 mt-3">
          <Field label={t('cart.customerName', { defaultValue: 'Your name' })}>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </Field>
          <Field label={t('cart.customerPhone', { defaultValue: 'Phone' })}>
            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
          </Field>
          <Field label={t('cart.note', { defaultValue: 'Note' })}>
            <Input value={customerNote} onChange={e => setCustomerNote(e.target.value)} placeholder="Allergies, special requests..." />
          </Field>
        </div>
      </Card>

      <div className="flex gap-3">
        <Link to="/checkout" className="flex-1"><Button size="lg">{t('cart.checkout', { defaultValue: 'Checkout' })}</Button></Link>
        <Link to="/" className="flex-1"><Button size="lg" variant="outline">{t('cart.continue', { defaultValue: 'Continue shopping' })}</Button></Link>
      </div>

      <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[12.5px] text-amber-800">
        <strong>API unavailable:</strong> Checkout endpoint (`POST /api/orders/checkout`) and cart persistence (`POST /api/cart`) are not exposed by the backend yet. Branch selection is persisted in localStorage. Order tracking endpoint (GET /api/orders/ORDER_ID) pending.
      </div>
    </div>
  )
}
