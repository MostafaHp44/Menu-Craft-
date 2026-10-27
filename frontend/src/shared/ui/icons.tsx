import type { ReactNode } from 'react'

/**
 * Hand-built stroke icon set (24×24 grid, 1.7 stroke) so the whole product
 * shares one consistent visual language without an icon dependency.
 */
const ICONS: Record<string, ReactNode> = {
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6.5 7 7.5 20h9L17.5 7" />
      <path d="M9 7V4.5h6V7" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15.5A1.5 1.5 0 0 1 4.5 14V5.5A1.5 1.5 0 0 1 6 4h8.5A1.5 1.5 0 0 1 16 5.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4.5 20 19.5" />
      <path d="M9.5 7A9.6 9.6 0 0 1 12 6.7c6 0 9.5 5.3 9.5 5.3a17 17 0 0 1-3 3.6" />
      <path d="M6.4 8.4A16.6 16.6 0 0 0 2.5 12s3.5 5.3 9.5 5.3a9.8 9.8 0 0 0 3.6-.7" />
      <path d="M10.3 10.5a2.6 2.6 0 0 0 3.5 3.6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.2-4.2" />
    </>
  ),
  filter: <path d="M4 6h16l-6.2 7.2V19L10 21v-7.8Z" />,
  palette: (
    <>
      <path d="M12 3.2a8.8 8.8 0 1 0 0 17.6c1.1 0 1.8-.8 1.8-1.7 0-1.4 1.1-2.4 2.5-2.4h1.6a3.1 3.1 0 0 0 3.1-3.1c0-5.6-4.4-10.4-9-10.4Z" />
      <circle cx="7.6" cy="12.4" r="1.15" />
      <circle cx="9.7" cy="8.2" r="1.15" />
      <circle cx="14.6" cy="7.6" r="1.15" />
      <circle cx="17.2" cy="11.4" r="1.15" />
    </>
  ),
  type: (
    <>
      <path d="M4 6.5V4.5h16v2" />
      <path d="M12 4.5v15" />
      <path d="M8.5 19.5h7" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M9.5 9.5V20" />
    </>
  ),
  sections: (
    <>
      <rect x="3" y="4" width="18" height="5" rx="1.6" />
      <rect x="3" y="13" width="18" height="7" rx="1.6" />
      <path d="M6.5 16.5h6" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.6" cy="10" r="1.6" />
      <path d="m4.5 17.5 4.8-4.6 3.6 3.4 3-2.8 3.6 3.5" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      <path d="M14 14h3v3h-3zM20.5 14v3M14 20.5h3M20.5 20.5h.01" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M3 12h2.4M18.6 12H21M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
    </>
  ),
  list: (
    <>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <circle cx="4.4" cy="6.5" r="1.1" />
      <circle cx="4.4" cy="12" r="1.1" />
      <circle cx="4.4" cy="17.5" r="1.1" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  star: <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />,
  sparkles: (
    <>
      <path d="m11 3 1.5 4.2L17 8.7l-4.5 1.5L11 14.4 9.5 10.2 5 8.7l4.5-1.5Z" />
      <path d="m18 14.5.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9Z" />
    </>
  ),
  store: (
    <>
      <path d="M4.5 10.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-8.5" />
      <path d="M3.2 9.5 4.8 4.2h14.4l1.6 5.3a3 3 0 0 1-5.8.6 3 3 0 0 1-5.8 0 3 3 0 0 1-5.8-.6Z" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <rect x="5" y="11" width="3.6" height="7" rx="1.2" />
      <rect x="10.4" y="5.5" width="3.6" height="12.5" rx="1.2" />
      <rect x="15.8" y="14" width="3.6" height="4" rx="1.2" />
    </>
  ),
  activity: <path d="M3 12h3.6l2.6 6.5L13 5.5l2.6 6.5H21" />,
  users: (
    <>
      <circle cx="9.2" cy="8.2" r="3.4" />
      <path d="M3.4 19.4a5.9 5.9 0 0 1 11.6 0" />
      <path d="M16.2 5.4a3.4 3.4 0 0 1 0 6" />
      <path d="M17.6 14.2a5.9 5.9 0 0 1 3 5.2" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8.5 4.7L12 12.4 3.5 7.7Z" />
      <path d="m3.8 12.4 8.2 4.5 8.2-4.5" />
      <path d="m3.8 16.6 8.2 4.5 8.2-4.5" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12.5" rx="2.2" />
      <path d="M9 20.5h6M12 16.5v4" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="2.8" width="10" height="18.4" rx="2.6" />
      <path d="M11 18.4h2" />
    </>
  ),
  maximize: (
    <>
      <path d="M8.5 3.5H4.5a1 1 0 0 0-1 1v4" />
      <path d="M15.5 3.5h4a1 1 0 0 1 1 1v4" />
      <path d="M8.5 20.5h-4a1 1 0 0 1-1-1v-4" />
      <path d="M15.5 20.5h4a1 1 0 0 0 1-1v-4" />
    </>
  ),
  minimize: (
    <>
      <path d="M4.5 8.5v-4a1 1 0 0 1 1-1h4" />
      <path d="M19.5 8.5v-4a1 1 0 0 0-1-1h-4" />
      <path d="M4.5 15.5v4a1 1 0 0 0 1 1h4" />
      <path d="M19.5 15.5v4a1 1 0 0 1-1 1h-4" />
    </>
  ),
  undo: (
    <>
      <path d="M4.5 8.5h9a5 5 0 0 1 0 10H8" />
      <path d="m8.5 4.5-4 4 4 4" />
    </>
  ),
  redo: (
    <>
      <path d="M19.5 8.5h-9a5 5 0 0 0 0 10H16" />
      <path d="m15.5 4.5 4 4-4 4" />
    </>
  ),
  save: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H16l3.5 3.5V19.5A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M8 3v5.5h7V3" />
      <path d="M8 21v-6h8v6" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 10 14" />
      <path d="M20.5 3.5 14 20.5l-3.8-6.7-6.7-3.8Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.4 2" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s6.8-5.6 6.8-10.8A6.8 6.8 0 0 0 5.2 10.2C5.2 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.2" r="2.5" />
    </>
  ),
  phone: (
    <path d="M6.2 3.5h3.1l1.7 4.3-2 1.4a12.6 12.6 0 0 0 5.8 5.8l1.4-2 4.3 1.7v3.1a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.4" />
      <path d="m3.8 7.4 8.2 5.7 8.2-5.7" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.1" cy="6.9" r="1.15" />
    </>
  ),
  facebook: (
    <path d="M14.4 8.6h2.6V5.2h-2.6A4.1 4.1 0 0 0 10.3 9.3v1.9H8v3.4h2.3V21h3.5v-6.4h2.4l.5-3.4h-2.9V9.6a1 1 0 0 1 1-1Z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.4c2.4 2.5 3.7 5.5 3.7 8.6s-1.3 6.1-3.7 8.6c-2.4-2.5-3.7-5.5-3.7-8.6S9.6 5.9 12 3.4Z" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.3" />
      <circle cx="15" cy="6" r="1.3" />
      <circle cx="9" cy="12" r="1.3" />
      <circle cx="15" cy="12" r="1.3" />
      <circle cx="9" cy="18" r="1.3" />
      <circle cx="15" cy="18" r="1.3" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L20.2 7.8a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16Z" />
      <path d="m14.8 5.6 3.6 3.6" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10.5" />
      <path d="m7.6 10.6 4.4 4.4 4.4-4.4" />
      <path d="M4.5 20h15" />
    </>
  ),
  printer: (
    <>
      <path d="M7 8.5V4h10v4.5" />
      <rect x="4" y="8.5" width="16" height="7.5" rx="2" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11.5 12.5" />
      <path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6.6 9.4V20h10.8V9.4" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.2" width="18" height="13.6" rx="2.4" />
      <path d="M3 10h18" />
      <path d="M7 14.8h4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5" />
      <circle cx="12" cy="7.9" r="1.05" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.2 3.4 19.6h17.2Z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="17" r="1.05" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="m9 8-4 4 4 4" />
      <path d="M5 12h10" />
    </>
  ),
  trendUp: (
    <>
      <path d="M3.5 16.5 9 11l3.5 3.5L20 7" />
      <path d="M14.5 7H20v5.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20.5 4v5h-5" />
    </>
  ),
  heart: (
    <path d="M12 20.2S4.6 15.6 4.6 10.6A3.9 3.9 0 0 1 12 8.2a3.9 3.9 0 0 1 7.4 2.4c0 5-7.4 9.6-7.4 9.6Z" />
  ),
  utensils: (
    <>
      <path d="M7 3.5v6.2a2.6 2.6 0 0 0 5.2 0V3.5" />
      <path d="M9.6 12.3v8.2" />
      <path d="M17.4 3.5c-1.6 1.4-2.3 3.1-2.3 5.4s.9 3.7 2.3 4.2v7.4" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.6A2.6 2.6 0 0 1 7.6 2H19.5v17.4H7.6A2.6 2.6 0 0 0 5 22Z" />
      <path d="M5 19.4A2.6 2.6 0 0 1 7.6 17H19.5" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12.6V5.4A1.4 1.4 0 0 1 5.4 4h7.2L20.6 12 12.6 20Z" />
      <circle cx="8.6" cy="8.6" r="1.4" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
}

export interface IconProps {
  name: string
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 18, className, strokeWidth = 1.7 }: IconProps) {
  const node = ICONS[name]
  if (!node) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {node}
    </svg>
  )
}

/** MenuCraft brand mark — used across marketing, app chrome and menus. */
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="17" fill="#14110F" />
      <path
        d="M19 45V19h6.4v10.6L35.4 19H42l-9.6 11.2L42.6 45h-7.2l-7.8-10.6-2.4 2.7V45Z"
        fill="#F7F2EA"
      />
      <circle cx="46" cy="23" r="4" fill="#E8571F" />
    </svg>
  )
}

export function Wordmark({
  className,
  markSize = 32,
  tone = 'dark',
}: {
  className?: string
  markSize?: number
  tone?: 'dark' | 'light'
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={markSize} />
      <span
        className={`text-[17px] font-semibold tracking-[-0.02em] ${
          tone === 'light' ? 'text-ivory' : 'text-charcoal'
        }`}
      >
        Menu<span className="text-flame">Craft</span>
      </span>
    </span>
  )
}
