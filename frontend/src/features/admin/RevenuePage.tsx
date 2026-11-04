import { useEffect, useState } from 'react'
import { Card } from '../../shared/ui/ui.tsx'

export default function RevenuePage() {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('menucraft-token') || '') : ''
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/platform/admin/financial?period=month', {
      headers: { Authorization: 'Bearer ' + (token || '') }
    })
      .then(r => r.json())
      .then(d => { setData(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const net = data.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0)

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold text-ivory">Financial Reports</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 bg-smoke border-white/10">
          <p className="text-xs text-ivory/50 uppercase">Successful Revenue</p>
          <p className="text-2xl font-bold text-ivory">${net.toFixed(2)}</p>
        </Card>
        <Card className="p-5 bg-smoke border-white/10">
          <p className="text-xs text-ivory/50 uppercase">Records</p>
          <p className="text-2xl font-bold text-ivory">{data.length}</p>
        </Card>
        <Card className="p-5 bg-smoke border-white/10">
          <p className="text-xs text-ivory/50 uppercase">Source</p>
          <p className="text-sm text-ivory/80">Payments table (successful only)</p>
        </Card>
      </div>
      {/* Chart */}
      {!loading && data.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0f1220] p-6">
          <h3 className="text-sm font-semibold text-ivory mb-4">Revenue by Period</h3>
          <div className="flex items-end gap-2 h-40">
            {data.map((row: any, i: number) => {
              const val = Number(row.revenue || 0)
              const max = Math.max(...data.map((r: any) => Number(r.revenue || 0))) || 1
              const pct = Math.min(100, (val / max) * 100)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-flame to-flame/60" style={{ height: `${pct}%`, minHeight: 12 }} />
                  <span className="text-[10px] text-ivory/60 rotate-0 whitespace-nowrap">{String(row.period).slice(0, 7)}</span>
                  <span className="text-[11px] font-mono text-ivory/90">${val.toFixed(0)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? <p className="text-ivory/60">Loading reports...</p> : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-smoke">
          <table className="w-full text-sm text-ivory">
            <thead className="bg-white/5">
              <tr><th className="px-4 py-2 text-left">Period</th><th className="px-4 py-2 text-right">Revenue</th><th className="px-4 py-2 text-right">Pending</th><th className="px-4 py-2 text-right">Failed</th><th className="px-4 py-2 text-right">Refunded</th></tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-2">{row.period}</td>
                  <td className="px-4 py-2 text-right text-moss">${Number(row.revenue || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-flame">${Number(row.pending || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-rose">${Number(row.failed || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-amber">${Number(row.refunded || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
