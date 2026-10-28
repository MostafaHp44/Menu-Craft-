import { Segmented, type SegmentOption } from '../../../shared/ui/ui.tsx'

/**
 * `Segmented` with touch-friendly pills: options grow to 40px on phones and
 * keep the original 28/32px height from `sm` up (desktop is unchanged). The
 * wrapper scrolls horizontally — with a visible thin scrollbar — when longer
 * translations (ku) would otherwise overflow narrow columns.
 */
export function TouchSegmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  full,
  size = 'md',
}: {
  options: Array<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  full?: boolean
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex min-w-0 max-w-full overflow-x-auto pb-2.5 sm:pb-0.5 thin-scroll [&_[role=tablist]]:shrink-0 [&_[role=tab]]:min-h-10 sm:[&_[role=tab]]:min-h-7">
      <Segmented<T>
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        full={full}
        size={size}
      />
    </div>
  )
}
