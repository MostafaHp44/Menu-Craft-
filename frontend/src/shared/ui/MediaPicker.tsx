import { useEffect, useState } from 'react'
import { apiUrl } from '../api/url.ts'
import { Button, Img } from './ui.tsx'
import { templateAPI } from '../lib/api.service.ts'
import { IMAGE_LIBRARY } from '../lib/images.ts'
import { useI18n } from '../i18n'

export interface MediaItem {
  url: string
  filename: string
  kind: 'image' | 'video'
  size: number
  mtime: number
  source: string
}

/** Curated stock images, de-duplicated by source URL. */
export const STOCK_MEDIA: MediaItem[] = (() => {
  const seen = new Set<string>()
  const out: MediaItem[] = []
  for (const lib of IMAGE_LIBRARY) {
    if (seen.has(lib.src)) continue
    seen.add(lib.src)
    out.push({
      url: lib.src,
      filename: lib.src.split('/').pop() || lib.label,
      kind: 'image',
      size: 0,
      mtime: 0,
      source: 'stock',
    })
  }
  return out
})()

/* ------------------------------------------------------------------ */
/* Uploaded-media loaders (cached per page load)                       */
/* ------------------------------------------------------------------ */

let platformCache: MediaItem[] | null = null
let platformPromise: Promise<MediaItem[]> | null = null

/** Platform media (templates + restaurants uploads) — super admin only. */
export function loadUploadedMedia(): Promise<MediaItem[]> {
  if (platformCache) return Promise.resolve(platformCache)
  if (!platformPromise) {
    platformPromise = templateAPI
      .listMedia()
      .then((res) => {
        platformCache = res.data || []
        return platformCache
      })
      .catch((e) => {
        platformPromise = null
        throw e
      })
  }
  return platformPromise
}

/** After a fresh upload through the platform uploader, refresh the cache. */
export function invalidateUploadedCache() {
  platformCache = null
  platformPromise = null
}

/** Client media (the caller's own restaurant uploads) — any signed-in user. */
export async function loadClientUploads(): Promise<MediaItem[]> {
  const res = await fetch(apiUrl('/api/uploads'), { credentials: 'include' })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) throw new Error(json?.error || `Request failed: ${res.status}`)
  return (json.data || []) as MediaItem[]
}

/* ------------------------------------------------------------------ */
/* Picker modal                                                        */
/* ------------------------------------------------------------------ */

export function MediaPickerModal({
  kind,
  value,
  onPick,
  onClose,
  loader = loadUploadedMedia,
}: {
  kind: 'image' | 'video'
  value: string
  onPick: (url: string) => void
  onClose: () => void
  /** defaults to the platform media list; pass loadClientUploads for clients */
  loader?: () => Promise<MediaItem[]>
}) {
  const { t } = useI18n()
  const [uploads, setUploads] = useState<MediaItem[] | null>(null)

  useEffect(() => {
    let alive = true
    loader()
      .then((list) => {
        if (alive) setUploads(list.filter((u) => u.kind === kind))
      })
      .catch(() => {
        // not allowed / offline → stock section only, no error noise
        if (alive) setUploads([])
      })
    return () => {
      alive = false
    }
  }, [kind, loader])

  const pick = (url: string) => {
    onPick(url)
    onClose()
  }

  const card = (item: MediaItem) => {
    const selected = item.url === value
    return (
      <button
        key={item.url}
        type="button"
        onClick={() => pick(item.url)}
        className={`relative overflow-hidden rounded-xl border bg-paper text-start transition ${
          selected ? 'border-charcoal ring-2 ring-charcoal/40' : 'border-sand hover:border-umber/40'
        }`}
      >
        {item.kind === 'video' ? (
          <video src={item.url} muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
        ) : (
          <Img src={item.url} alt={item.filename} className="aspect-video w-full object-cover" />
        )}
        <span className="block truncate px-2 py-1.5 text-[11px] text-umber" dir="ltr">
          {item.filename}
        </span>
        {selected ? (
          <span className="absolute inset-x-0 top-0 bg-charcoal py-0.5 text-center text-[10px] font-bold text-ivory">
            {t('design.imageEdit.alreadyPicked')}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-sand bg-paper p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-bold text-charcoal">{t('design.imageEdit.libraryTitle')}</p>
            <p className="mt-1 text-[12px] text-umber">{t('design.imageEdit.libraryHint')}</p>
          </div>
          <Button size="sm" variant="ghost" icon="x" onClick={onClose}>
            ✕
          </Button>
        </div>

        {kind === 'image' ? (
          <div className="mb-5">
            <p className="mb-2 text-[12px] font-semibold text-espresso">{t('design.imageEdit.stockImages')}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{STOCK_MEDIA.map(card)}</div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-[12px] font-semibold text-espresso">{t('design.imageEdit.uploadedMedia')}</p>
          {uploads === null ? (
            <p className="text-[12px] text-umber">{t('design.imageEdit.loadingLibrary')}</p>
          ) : uploads.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sand p-4 text-center text-[12px] text-umber">
              {t('design.imageEdit.uploadedEmpty')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{uploads.map(card)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
