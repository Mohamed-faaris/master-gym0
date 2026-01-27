import { cn } from '@/lib/utils'

export function BarSpark({
  values,
  ariaLabel,
  variant = 'warm',
}: {
  values: Array<number>
  ariaLabel: string
  variant?: 'warm' | 'cool'
}) {
  const max = Math.max(...values, 1)

  const fill = variant === 'cool' ? 'var(--app-accent-2)' : 'var(--app-accent)'

  return (
    <div className="grid grid-cols-7 gap-1.5" role="img" aria-label={ariaLabel}>
      {values.slice(0, 7).map((v, idx) => {
        const h = Math.max(6, Math.round((v / max) * 44))
        return (
          <div
            key={idx}
            className={cn(
              'relative h-12 overflow-hidden rounded-lg border border-border/60 bg-background/40',
            )}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-lg"
              style={{
                height: h,
                background: `color-mix(in oklab, ${fill}, white 10%)`,
              }}
              aria-hidden
            />
          </div>
        )
      })}
    </div>
  )
}

export function LineSpark({
  values,
  ariaLabel,
  variant = 'warm',
}: {
  values: Array<number>
  ariaLabel: string
  variant?: 'warm' | 'cool'
}) {
  const w = 320
  const h = 88
  const pad = 8
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1e-6, max - min)

  const stroke =
    variant === 'cool' ? 'var(--app-accent-2)' : 'var(--app-accent)'

  const pts = values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2)
      const y = pad + (1 - (v - min) / span) * (h - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="block h-[88px] w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={`color-mix(in oklab, ${stroke}, white 10%)`}
              stopOpacity="0.35"
            />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        <polyline
          points={pts}
          fill="none"
          stroke={`color-mix(in oklab, ${stroke}, black 10%)`}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polygon
          points={`${pts} ${w - pad},${h - pad} ${pad},${h - pad}`}
          fill="url(#sparkFill)"
        />
      </svg>
    </div>
  )
}
