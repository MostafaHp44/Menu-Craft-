import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Icon } from '../../shared/ui/icons.tsx'
import { Badge, Button, Card, Segmented, Select, StatCard } from '../../shared/ui/ui.tsx'
import { publicUrl } from '../../shared/lib/hooks.ts'
import { cx } from '../../shared/lib/utils.ts'
import { useActiveRestaurant, useStore } from '../../shared/store/useStore.ts'

type SizeId = 'small' | 'medium' | 'large'
type Correction = 'M' | 'Q' | 'H'

const SIZES: Record<SizeId, { px: number; label: string; note: string }> = {
  small: { px: 160, label: 'Table tent', note: '40 mm · close range' },
  medium: { px: 260, label: 'Counter', note: '70 mm · stand-off' },
  large: { px: 340, label: 'Window', note: '120 mm · from the street' },
}

export default function QrCodePage() {
  const r = useActiveRestaurant()
  const stats = useStore((s) => s.restaurants.find((x) => x.id === s.activeId)?.stats)
  const [size, setSize] = useState<SizeId>('medium')
  const [level, setLevel] = useState<Correction>('Q')
  const [dark, setDark] = useState(true)
  const [logoIn, setLogoIn] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)

  const url = `https://${publicUrl(r.slug)}`
  const fg = dark ? '#14110F' : '#FFFFFF'
  const bg = dark ? '#FAF7F1' : '#14110F'
  const px = SIZES[size].px

  const payload = useMemo(
    () => (logoIn ? url : `${url}?ref=qr`),
    [url, logoIn]
  )

  /* ------------------------------- downloads ------------------------------ */

  const serialize = (): string | null => {
    const node = svgRef.current
    if (!node) return null
    const clone = node.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(px))
    clone.setAttribute('height', String(px))
    return new XMLSerializer().serializeToString(clone)
  }

  const downloadSvg = () => {
    const markup = serialize()
    if (!markup) return
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
    triggerDownload(URL.createObjectURL(blob), `${r.slug}-menu-qr.svg`, true)
  }

  const downloadPng = () => {
    const markup = serialize()
    if (!markup) return
    const scale = 4
    const svgUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = px * scale
      canvas.height = px * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(svgUrl)
      canvas.toBlob((blob) => {
        if (!blob) return
        triggerDownload(URL.createObjectURL(blob), `${r.slug}-menu-qr.png`, true)
      }, 'image/png')
    }
    image.src = svgUrl
  }

  const scans = stats?.qrScans ?? 0
  const views = stats?.views ?? 1

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total scans" value={scans.toLocaleString()} delta="+9.4%" icon="qr" />
        <StatCard label="Scans from QR" value={`${Math.round((scans / views) * 100)}%`} delta="+1.1%" icon="activity" />
        <StatCard label="Active codes" value="3" icon="printer" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        {/* QR canvas */}
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand/80 px-5 py-4">
            <div>
              <h2 className="text-[15.5px] font-semibold text-charcoal">Menu QR code</h2>
              <p className="mt-0.5 font-mono text-[12.5px] text-umber">{url}</p>
            </div>
            <Badge tone="outline" icon="info">Simulated address</Badge>
          </div>

          <div className="flex flex-col items-center gap-6 px-5 py-8 sm:flex-row sm:items-start sm:justify-center sm:py-10">
            <div
              className={cx(
                'relative flex items-center justify-center rounded-3xl p-5 shadow-[0_40px_90px_-50px_rgba(15,13,11,0.9)] transition',
                dark ? 'bg-[#FAF7F1]' : 'bg-[#14110F]'
              )}
              style={{ border: `1px solid ${dark ? '#E9E1D4' : '#2b2622'}` }}
            >
              <QRCodeSVG
                ref={svgRef}
                value={payload}
                size={px}
                level={level}
                bgColor={bg}
                fgColor={fg}
                marginSize={1}
              />
              {logoIn ? (
                <span
                  className="absolute flex items-center justify-center rounded-xl shadow-lg"
                  style={{
                    width: Math.round(px * 0.19),
                    height: Math.round(px * 0.19),
                    backgroundColor: bg,
                    outline: `4px solid ${bg}`,
                  }}
                >
                  <span
                    className="text-center font-semibold leading-none"
                    style={{ color: fg, fontSize: Math.round(px * 0.062) }}
                  >
                    {r.logoText.slice(0, 2)}
                  </span>
                </span>
              ) : null}
            </div>

            <div className="w-full max-w-xs space-y-4">
              <div>
                <div className="mb-1.5 text-[12.5px] font-medium text-espresso">Print size</div>
                <Segmented<SizeId>
                  full
                  size="sm"
                  value={size}
                  onChange={setSize}
                  ariaLabel="QR print size"
                  options={[
                    { value: 'small', label: 'S' },
                    { value: 'medium', label: 'M' },
                    { value: 'large', label: 'L' },
                  ]}
                />
                <p className="mt-1.5 text-[12px] text-umber">
                  {SIZES[size].label} · {SIZES[size].note} · {px}px
                </p>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-espresso">
                  Error correction
                </span>
                <Select value={level} onChange={(e) => setLevel(e.target.value as Correction)}>
                  <option value="M">Medium — smaller code</option>
                  <option value="Q">Quartile — recommended for print</option>
                  <option value="H">High — survives logos & scuffs</option>
                </Select>
              </label>

              <div className="space-y-2.5 rounded-xl border border-sand bg-cream/50 p-3.5">
                <Segmented<'light' | 'dark'>
                  full
                  size="sm"
                  value={dark ? 'dark' : 'light'}
                  onChange={(v) => setDark(v === 'dark')}
                  ariaLabel="QR color style"
                  options={[
                    { value: 'dark', label: 'Dark on ivory' },
                    { value: 'light', label: 'Light on ink' },
                  ]}
                />
                <button
                  type="button"
                  onClick={() => setLogoIn((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 text-start"
                >
                  <span className="text-[12.5px] text-espresso">Centre monogram</span>
                  <span
                    className={cx(
                      'relative h-5 w-9 rounded-full transition-colors',
                      logoIn ? 'bg-flame' : 'bg-stone'
                    )}
                  >
                    <span
                      className={cx(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all',
                        logoIn ? 'start-[18px]' : 'start-0.5'
                      )}
                    />
                  </span>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <Button icon="download" onClick={downloadPng}>
                  Download PNG
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon="download" full onClick={downloadSvg}>
                    SVG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="printer"
                    full
                    onClick={() => window.setTimeout(() => window.print(), 80)}
                  >
                    Print sheet
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-sand/80 bg-cream/50 px-5 py-3.5 text-[12px] text-clay">
            Files are generated in your browser from the live QR — nothing is uploaded anywhere.
          </div>
        </Card>

        {/* explanation */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-[14.5px] font-semibold text-charcoal">How this works</h3>
            <ol className="mt-3.5 space-y-3.5">
              {[
                {
                  icon: 'qr',
                  title: 'The code encodes your address',
                  text: `Scanning resolves to ${publicUrl(r.slug)} — a simulated MenuCraft subdomain. No domain or DNS record is provisioned in this prototype.`,
                },
                {
                  icon: 'smartphone',
                  title: 'Guests land on the live menu',
                  text: 'The published design, menu and prices come straight from your saved configuration — exactly what you see in the preview.',
                },
                {
                  icon: 'pencil',
                  title: 'Edits appear after publishing',
                  text: 'Change a price in the editor, publish, and the same QR code starts showing the new price instantly.',
                },
                {
                  icon: 'chart',
                  title: 'Scans are simulated',
                  text: 'Scan counts in this demo are mock analytics used to demonstrate the dashboard.',
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal text-ivory">
                    <span className="text-[12px] font-semibold">{i + 1}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-charcoal">
                      <Icon name={step.icon} size={14} className="text-flame" />
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-umber">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h3 className="text-[14.5px] font-semibold text-charcoal">Where to place it</h3>
            <div className="mt-3 space-y-2.5">
              {[
                { place: 'Table tents', detail: 'One per table · medium size', scans: 612 },
                { place: 'Entrance window', detail: 'Street-facing · large size', scans: 402 },
                { place: 'Receipt footer', detail: 'Small size · high correction', scans: 270 },
              ].map((row) => (
                <div key={row.place} className="flex items-center justify-between gap-3 rounded-xl border border-sand px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-[13px] font-medium text-charcoal">{row.place}</div>
                    <div className="line-clamp-1 text-[11.5px] text-umber">{row.detail}</div>
                  </div>
                  <div className="shrink-0 text-end">
                    <div className="text-[13.5px] font-semibold text-charcoal">{row.scans}</div>
                    <div className="text-[11px] text-clay">scans</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-clay">Placement performance is simulated demo data.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function triggerDownload(href: string, filename: string, revoke: boolean) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  if (revoke) window.setTimeout(() => URL.revokeObjectURL(href), 2000)
}
