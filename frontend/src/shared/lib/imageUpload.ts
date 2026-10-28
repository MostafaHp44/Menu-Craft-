/**
 * Client-side image upload pipeline — decode, downscale, compress.
 * Everything runs in the browser: no network, no server. The result is a
 * `data:` URL small enough to survive localStorage's ~5MB shared quota.
 */

/** hard ceiling on the picked file (raw bytes, before compression) */
const MAX_FILE_BYTES = 12 * 1024 * 1024
/** longest edge after downscaling — plenty for cards & heroes at 390px */
const MAX_EDGE = 1100
const QUALITY = 0.8

export type ImageUploadErrorCode = 'tooLarge' | 'type' | 'decode'

/** thrown by `fileToDataUrl` — callers map `code` to an i18n key */
export class ImageUploadError extends Error {
  readonly code: ImageUploadErrorCode

  constructor(code: ImageUploadErrorCode) {
    super(code)
    this.name = 'ImageUploadError'
    this.code = code
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageUploadError('decode'))
    }
    img.src = url
  })
}

/** webp is lossy & tiny; older engines return a PNG data URL instead — fall back to jpeg */
function encode(canvas: HTMLCanvasElement): string {
  const webp = canvas.toDataURL('image/webp', QUALITY)
  if (webp.startsWith('data:image/webp')) return webp
  return canvas.toDataURL('image/jpeg', QUALITY)
}

/** `File` → compressed `data:` URL (max edge 1100px, webp q0.8 → jpeg q0.8 fallback) */
export async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageUploadError('type')
  if (file.size > MAX_FILE_BYTES) throw new ImageUploadError('tooLarge')

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageUploadError('decode')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return encode(canvas)
}
