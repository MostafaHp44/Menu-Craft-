import { useState } from 'react';
import { useCartStore } from '../../features/public/publicCart';
import { guestOrderAPI } from '../../shared/lib/api.service';

export default function TemplateCheckoutOverlay({ restaurant: r, onClose, onPlaced }: { restaurant: any; onClose: () => void; onPlaced: () => void }) {
  const cart = useCartStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tableNum, setTableNum] = useState('');
  const [fulfillment, setFulfillment] = useState<'pickup'|'delivery'|'table'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ordering = r?.ordering || {};
  const fulfillmentOpts = ordering.fulfillment || { delivery: true, pickup: true };
  const methods = ordering.paymentMethods ? Object.entries(ordering.paymentMethods)
    .filter((entry: [string, any]) => entry[1] && entry[1].enabled)
    .map((entry: [string, any]) => ({ code: entry[0], label: entry[0].charAt(0).toUpperCase() + entry[0].slice(1) }))
    : [{ code: 'cash', label: 'Cash' }];

  const c = r?.design?.colors || {};
  const primary = c.primary || '#e11d48';
  const accent = c.accent || '#f59e0b';
  const card = c.card || '#ffffff';
  const text = c.text || '#1f2937';

  const submit = async () => {
    setError(null);
    if (!name.trim() || !phone.trim()) { setError('Please enter your name and phone'); return; }
    if (cart.subtotal <= 0) { setError('Your cart is empty'); return; }
    if (fulfillment === 'delivery' && (!address.trim() || address.trim().length < 5)) { setError('Please provide a delivery address'); return; }
    if (fulfillment === 'table' && (!tableNum.trim())) { setError('Please enter a table number'); return; }
    setSending(true);
    try {
      const payload: any = {
        restaurantId: r.id,
        slug: r.slug,
        customer: { name: name.trim(), phone: phone.trim() },
        fulfillment,
        deliveryAddress: fulfillment === 'delivery' ? address.trim() : undefined,
        table: fulfillment === 'table' ? tableNum.trim() || '1' : undefined,
        paymentMethod,
        lines: cart.lines.map((l: any) => ({ itemId: l.itemId, qty: l.qty, options: l.options.map((o: any) => ({ groupId: o.groupId, optionId: o.optionId })) })),
        idempotencyKey: Math.random().toString(36).slice(2),
      };
      const res = await guestOrderAPI.create(payload);
      if (res?.ok && res?.data?.id) { onPlaced(); } else { setError('Order failed. Please try again.'); }
    } catch (e: any) { setError(e?.message || 'Order failed'); } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/70 via-black/40 to-slate-900/70 backdrop-blur-md p-4" role="dialog" aria-modal>
      <button className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-[0_32px_80px_-24px_rgba(0,0,0,0.35)] ring-1 ring-white/20" style={{ background: card, color: text }}>
        {/* Header uses template colors */}
        <div className="relative px-8 pt-8 pb-10 text-white" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }}>
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-white px-3.5 py-1.5 text-xs font-bold shadow transition">✕ Close</button>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight drop-shadow">Complete Your Order</h2>
          <p className="mt-1 text-white/90 text-sm font-medium">{cart.subtotal.toFixed(2)} USD · {cart.count} item{cart.count > 1 ? 's' : ''}</p>
        </div>

        <div className="px-8 pb-8 pt-6 space-y-5">
          {/* Name + Phone */}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 block" style={{ color: primary }}>Your Name</span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full rounded-2xl border-0 bg-white/60 px-4 py-3 text-sm font-medium shadow-inner focus:outline-none focus:ring-2 transition placeholder:text-slate-400" style={{ color: text, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.05)' }} />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 block" style={{ color: accent }}>Phone</span>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" inputMode="tel" className="w-full rounded-2xl border-0 bg-white/60 px-4 py-3 text-sm font-medium shadow-inner focus:outline-none focus:ring-2 transition placeholder:text-slate-400" style={{ color: text, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.05)' }} />
            </label>
          </div>

          {/* Fulfillment */}
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-widest mb-2 block" style={{ color: primary }}>How would you like it?</span>
            <div className="flex gap-3 flex-wrap">
              {fulfillmentOpts.pickup && <button type="button" onClick={() => setFulfillment('pickup')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold border-2 shadow-sm transition ${fulfillment === 'pickup' ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`} style={fulfillment === 'pickup' ? { background: `linear-gradient(135deg, ${primary}, ${accent})` } : {}}>Pickup</button>}
              {fulfillmentOpts.delivery && <button type="button" onClick={() => setFulfillment('delivery')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold border-2 shadow-sm transition ${fulfillment === 'delivery' ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`} style={fulfillment === 'delivery' ? { background: `linear-gradient(135deg, ${primary}, ${accent})` } : {}}>Delivery</button>}
              <button type="button" onClick={() => setFulfillment('table')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold border-2 shadow-sm transition ${fulfillment === 'table' ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`} style={fulfillment === 'table' ? { background: `linear-gradient(135deg, ${primary}, ${accent})` } : {}}>Dine-in</button>
            </div>
          </label>

          {/* Address */}
          {fulfillment === 'delivery' && (
            <label className="block animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 block" style={{ color: primary }}>Delivery Address</span>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, building, apartment..." rows={2} className="w-full rounded-2xl border-0 bg-gradient-to-r from-white/70 to-white/40 px-4 py-3 text-sm font-medium shadow-inner focus:outline-none focus:ring-2 transition resize-none placeholder:text-slate-400" style={{ color: text, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.05)' }} />
            </label>
          )}

          {/* Table */}
          {fulfillment === 'table' && (
            <label className="block animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 block" style={{ color: accent }}>Table Number</span>
              <input value={tableNum} onChange={e => setTableNum(e.target.value)} placeholder="e.g. 12" inputMode="numeric" className="w-full rounded-2xl border-0 bg-gradient-to-r from-white/70 to-white/40 px-4 py-3 text-sm font-medium shadow-inner focus:outline-none focus:ring-2 transition placeholder:text-slate-400" style={{ color: text, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.05)' }} />
            </label>
          )}

          {/* Payment */}
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-widest mb-2 block" style={{ color: primary }}>Payment</span>
            <div className="flex gap-3 flex-wrap">
              {methods.map(m => (
                <button key={m.code} type="button" onClick={() => setPaymentMethod(m.code)} className={`rounded-xl px-4 py-2.5 text-sm font-bold border-2 shadow-sm transition ${paymentMethod === m.code ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`} style={paymentMethod === m.code ? { background: `linear-gradient(135deg, ${primary}, ${accent})` } : {}}>
                  {m.label}
                </button>
              ))}
            </div>
          </label>

          {/* Submit */}
          <button type="button" onClick={submit} disabled={sending} className="w-full rounded-2xl py-4 text-lg font-extrabold text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed tracking-tight" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
            {sending ? 'Placing your order...' : 'Complete Order'}
          </button>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
              ✕ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
