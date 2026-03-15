import React, { useEffect, useState } from 'react'
import { BellRing, Play, Pause, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RestTimerProps {
  initialSeconds: number
  onComplete?: () => void
  onSkip?: () => void
}

export function RestTimer({ initialSeconds, onComplete, onSkip }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    setSecondsLeft(initialSeconds)
    setIsPaused(false)
  }, [initialSeconds])

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (onComplete) onComplete()
          // Optionally trigger a sound/vibration here
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, secondsLeft, onComplete])

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleReset = () => {
    setSecondsLeft(initialSeconds)
    setIsPaused(false)
  }

  return (
    <div className="fixed bottom-[max(5rem,calc(4rem+var(--safe-bottom)))] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-primary text-primary-foreground shadow-xl rounded-2xl flex items-center justify-between p-3 px-5 transition-all">
        <div className="flex items-center gap-3">
          <BellRing className="w-5 h-5 opacity-80" />
          <span className="text-2xl font-bold font-mono tracking-wider tabular-nums">
            {formatTime(secondsLeft)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full h-10 w-10"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full h-10 w-10"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full h-10 w-10"
            onClick={onSkip}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
