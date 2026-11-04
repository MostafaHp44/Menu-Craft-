import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Input, Select } from '../../shared/ui/ui.tsx'

type CartItem = { id: string; name: string; qty: number; price: number; item_id?: string; note?: string }

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [branchId, setBranchId] = useState('')
  const [mode, setMode] = useState<'dinein'|'delivery'|'takeaway'>('dinein')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [tableNo, setTableNo] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; orderId?: string; error?: string } | null>(null)
  const [restaurantId, setRestaurantId] = useState('demo-restaurant')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart_items')
      if (saved) {
        const parsed = JSON.parse(saved)
        setItems(Array.isArray(parsed) ? parsed : [])
      }
      const b = localStorage.getItem('cart_branch')
      if (b) setBranchId(b)
      const m = localStorage.getItem('cart_mode')
      if (m) setMode(m as any)
    } catch {}
  }, [])

  const total = items.reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0)

  const submit = useCallback(async () => {
    if (!restaurantId || !branchId || items.length === 0) {
      setResult({ ok: false, error: 'Missing restaurant, branch, or items' })
      return
    }
    if (mode === 'delivery' && (!phone || phone.trim().length < 7)) {
      setResult({ ok: false, error: 'Phone required for delivery' })
      return
    }
    if (mode === 'delivery' && (!address || address.trim().length < 5)) {
      setResult({ ok: false, error: 'Address required for delivery' })
      return
    }
    setSending(true)
    setResult(null)
    try {
      const payload = {
        restaurant_id: restaurantId,
        branch_id: branchId,
        items: items.map(i => ({ item_id: i.item_id || i.id || 'item', qty: Math.max(1, Math.round(i.qty || 1)) })),
        customer_name: name.trim() || null,
        phone: phone.trim() || null,
        delivery_address: mode === 'delivery' ? (address.trim() || null) : null,
        table_no: mode === 'dinein' ? (tableNo.trim() || null) : null,
        note: note.trim() || null,
        channel: mode,
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({ ok: false }))
      if (res.status === 201 && data?.ok && data?.order?.id) {
        setResult({ ok: true, orderId: data.order.id })
        localStorage.removeItem('cart_items')
        localStorage.removeItem('cart_branch')
      } else {
        setResult({ ok: false, error: data?.message || data?.error || `HTTP ${res.status}` })
      }
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || 'Network error' })
    } finally {
      setSending(false)
    }
  }, [items, branchId, mode, name, phone, address, tableNo, note, restaurantId])

  if (result?.ok && result.orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-green-700 mb-2">Order Confirmed</h1>
          <p className="text-sm mb-4">Order number: <strong>{result.orderId}</strong></p>
          <Link to={`/orders/${result.orderId}`}><Button>Track Order</Button></Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Cart</h2>
        {items.length === 0 ? <p className="text-sm text-gray-500">Cart is empty.</p> : (
          <ul className="space-y-2 text-sm">
            {items.map(i => (
              <li key={i.id || i.item_id} className="flex justify-between"><span>{i.name} × {i.qty}</span><span>{(i.qty * i.price).toFixed(2)}</span></li>
            ))}
          </ul>
        )}
        <div className="font-semibold pt-2 border-t">Total: {total.toFixed(2)}</div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Order details</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label>Mode</label>
            <Select value={mode} onChange={e => { setMode(e.target.value as any); localStorage.setItem('cart_mode', e.target.value) }}>
              <option value="dinein">Dine-in</option>
              <option value="delivery">Delivery</option>
              <option value="takeaway">Takeaway</option>
            </Select>
          </div>
          <div>
            <label>Branch</label>
            <Input value={branchId} onChange={e => { setBranchId(e.target.value); localStorage.setItem('cart_branch', e.target.value) }} placeholder="Branch ID" />
          </div>
          <div>
            <label>Restaurant ID</label>
            <Input value={restaurantId} onChange={e => setRestaurantId(e.target.value)} placeholder="Restaurant ID" />
          </div>
        </div>
        <div>
          <label>Customer name</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label>Phone</label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        {mode === 'delivery' && (
          <div>
            <label>Delivery address</label>
            <Input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        )}
        {mode === 'dinein' && (
          <div>
            <label>Table No</label>
            <Input value={tableNo} onChange={e => setTableNo(e.target.value)} />
          </div>
        )}
        <div>
          <label>Note</label>
          <Input value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </Card>

      {result?.error && <div className="text-red-600 text-sm">{result.error}</div>}

      <div className="flex gap-3">
        <Button disabled={sending || items.length === 0} onClick={submit}>{sending ? 'Submitting...' : 'Confirm Order'}</Button>
        <Link to="/cart"><Button variant="outline">Back to Cart</Button></Link>
      </div>
    </div>
  )
}
