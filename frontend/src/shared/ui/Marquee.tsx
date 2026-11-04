import { useI18n } from '../i18n'

interface Props {
  items: string[]
  className?: string
}

/** Continuously scrolling text ticker. Duplicated for seamless loop. */
export function Marquee({ items, className = '' }: Props) {
  const { dir } = useI18n()
  const doubled = [...items, ...items]

  return (
    <div className={`relative overflow-hidden py-4 ${className}`} aria-hidden="true">
      <div
        className="flex w-max gap-8 whitespace-nowrap"
        style={{
          animation: 'marquee-scroll 30s linear infinite',
          direction: dir === 'rtl' ? 'rtl' : 'ltr',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 text-[13px] font-medium uppercase tracking-[0.2em] text-umber/50"
          >
            {item}
            <span className="h-1 w-1 rounded-full bg-flame/40" />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
