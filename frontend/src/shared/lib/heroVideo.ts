/**
 * Hero video storage — remote URLs pass through, uploaded files live as Blobs
 * in IndexedDB (localStorage can't hold video). A restaurant's `heroVideo` is a
 * light-weight reference: `https://…` for remote clips, `idb:<uuid>` for uploads.
 */

const DB_NAME = 'menucraft-videos-v1'
const STORE_NAME = 'videos'

/** hard ceiling per uploaded clip */
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024

/** CC0 demo clip — zero files on disk, keeps the feature testable out of the box */
export const SAMPLE_HERO_VIDEO = 'https://mdn.github.io/shared-assets/videos/flower.mp4'

interface StoredVideo {
  id: string
  blob: Blob
  createdAt: number
}

/** thrown by `saveVideo` — callers map `code` to an i18n key */
export class HeroVideoError extends Error {
  readonly code: 'tooLarge' | 'storage'

  constructor(code: 'tooLarge' | 'storage') {
    super(code)
    this.name = 'HeroVideoError'
    this.code = code
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new HeroVideoError('storage'))
  })
}

/** store the picked file, returns the `idb:<uuid>` reference for `Restaurant.heroVideo` */
export async function saveVideo(file: File): Promise<string> {
  if (file.size > MAX_VIDEO_BYTES) throw new HeroVideoError('tooLarge')

  const id = crypto.randomUUID()
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ id, blob: file, createdAt: Date.now() } satisfies StoredVideo)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new HeroVideoError('storage'))
      tx.onabort = () => reject(tx.error ?? new HeroVideoError('storage'))
    })
  } finally {
    db.close()
  }
  return `idb:${id}`
}

/** reference → playable src; `idb:` refs become object URLs the CALLER must revoke */
export async function resolveVideoSrc(ref: string | undefined): Promise<string | null> {
  if (!ref) return null
  if (ref.startsWith('http://') || ref.startsWith('https://')) return ref
  if (!ref.startsWith('idb:')) return null

  const db = await openDb()
  try {
    const record = await new Promise<StoredVideo | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(ref.slice(4)) as IDBRequest<StoredVideo | undefined>
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new HeroVideoError('storage'))
    })
    return record?.blob ? URL.createObjectURL(record.blob) : null
  } finally {
    db.close()
  }
}

/** drop the stored blob for `idb:` refs — remote URLs are a no-op */
export async function deleteVideo(ref: string | undefined): Promise<void> {
  if (!ref?.startsWith('idb:')) return

  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(ref.slice(4))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new HeroVideoError('storage'))
    })
  } finally {
    db.close()
  }
}

/** permissive validation for pasted URLs — any absolute http(s) link */
export function isRemoteVideoUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
