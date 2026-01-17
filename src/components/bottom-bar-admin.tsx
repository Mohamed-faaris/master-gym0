import React from "react"
import { Grid, Plus, User } from "lucide-react"

type Props = {
  onContextClick?: () => void
  onPrimaryClick?: () => void
  onUserClick?: () => void
  showUserIndicator?: boolean
}

export function BottomBarAdmin({
  onContextClick,
  onPrimaryClick,
  onUserClick,
  showUserIndicator = false,
}: Props) {
  return (
    <nav
      aria-label="Admin bottom bar"
      className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 transform items-center justify-center px-4"
    >
      <div className="pointer-events-auto flex h-14 items-center gap-6 rounded-full bg-black/60 px-3 py-2 shadow-xl backdrop-blur-lg ring-1 ring-white/5">
        {/* Left: Context / Grid */}
        <button
          type="button"
          onClick={onContextClick}
          aria-label="Switch context"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-200 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Grid size={18} />
        </button>

        {/* Center: Prominent primary action */}
        <button
          type="button"
          onClick={onPrimaryClick}
          aria-label="Primary action"
          className="relative -mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/95 p-2 text-black shadow-[0_10px_30px_rgba(130,255,0,0.18)] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-lime-300"
        >
          <span className="absolute -inset-1 rounded-full opacity-60 blur-xl" />
          <Plus size={36} strokeWidth={1.5} />
        </button>

        {/* Right: User with indicator */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={onUserClick}
            aria-label="Open user menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-200 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <User size={18} />
          </button>

          {showUserIndicator && (
            <span className="absolute -right-1 top-6 inline-block h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_6px_rgba(130,255,0,0.7)]" />
          )}
        </div>
      </div>
    </nav>
  )
}


export default BottomBarAdmin
