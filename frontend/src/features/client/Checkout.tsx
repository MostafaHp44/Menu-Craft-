import { useState, type FormEvent } from 'react'
import { Button, Input } from '../../shared/ui/ui.tsx'
import { orderAPI } from '../../shared/lib/api.service.ts'

export default function Checkout({ restaurantId, items, onOrderComplete }: { restaurantId: string; items: { item: any; qty: number }[]; onOrderComplete: (orderId: string) => void }) {
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [method, setMethod] = useState<'cash' | 'card' | 'cod' | 'bank_transfer' | 'paypal'>('cash')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const total = items.reduce((sum, i) => sum + (i.item?.price || 0) * i.qty, 0)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await orderAPI.create({
        restaurantId,
        customer,
        customerPhone: phone,
        deliveryAddress: address,
        channel: 'online',
        paymentMethod: method,
        note,
        lines: items.map((i) => ({
          itemId: i.item.id,
          name: i.item.name?.en || 'Item',
          price: i.item.price || 0,
          qty: i.qty,
          extras: '',
        })),
      })
      if (res.ok) {
        onOrderComplete(res.data?.id || res.data?.orderId || 'new')
      }
    } catch (err: any) {
      console.error('Checkout error:', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">Checkout</h2>
      <Input label="Name" value={customer} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomer(e.target.value)} required />
      <Input label="Phone" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
      <Input label="Address" value={address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)} />
      <div>
        <label className="block text-sm font-medium mb-1">Payment Method</label>
        <div className="flex gap-2 flex-wrap">
          {['cash', 'card', 'cod', 'bank_transfer', 'paypal'].map((m) => (
            <Button key={m} type="button" size="sm" variant={method === m ? 'accent' : 'outline'} onClick={() => setMethod(m as typeof method)}>{m}</Button>
          ))}
        </div>
      </div>
      <Input label="Notes" value={note} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)} />
      <div className="text-right font-semibold">Total: ${total.toFixed(2)}</div>
      <Button type="submit" disabled={submitting || !customer || items.length === 0}>{submitting ? 'Submitting...' : 'Confirm Order'}</Button>
    </form>
  )
}
