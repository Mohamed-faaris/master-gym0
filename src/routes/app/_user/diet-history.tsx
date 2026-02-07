import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { Camera, UtensilsCrossed } from 'lucide-react'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export const Route = createFileRoute('/app/_user/diet-history')({
  component: RouteComponent,
})

type HistoryLog = {
  _id: string
  title: string
  description: string
  mealType: string
  calories?: number
  createdAt: number
  imageUrl: string | null
}

function RouteComponent() {
  const { user } = useAuth()
  const [cursor, setCursor] = useState<number | null>(null)
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [entries, setEntries] = useState<HistoryLog[]>([])
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const history = useQuery(
    api.dietLogs.getDietLogsHistory,
    user
      ? {
          userId: user._id,
          limit: 10,
          cursor: cursor ?? undefined,
        }
      : 'skip',
  )

  useEffect(() => {
    if (!user) return
    setEntries([])
    setCursor(null)
    setNextCursor(null)
    setIsLoadingMore(false)
  }, [user?._id])

  useEffect(() => {
    if (!history) return
    setEntries((prev) => {
      const map = new Map(prev.map((log) => [log._id, log]))
      history.logs.forEach((log) => {
        map.set(log._id, log as HistoryLog)
      })
      return Array.from(map.values())
    })
    setNextCursor(history.nextCursor ?? null)
    setIsLoadingMore(false)
  }, [history])

  const hasMore = nextCursor !== null

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (!nextCursor || isLoadingMore) return
        setIsLoadingMore(true)
        setCursor(nextCursor)
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, nextCursor])

  const mealTypeLabels = useMemo(
    () => ({
      breakfast: 'Breakfast',
      middaySnack: 'Midday Snack',
      lunch: 'Lunch',
      preWorkout: 'Pre-workout',
      postWorkout: 'Post-workout',
    }),
    [],
  )

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="pt-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Diet History</h1>
          <p className="text-muted-foreground">All logged meals</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/app/diet-plan">Back</Link>
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No history yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Start logging meals to see your history here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((log) => (
            <Card
              key={log._id}
              className={log.imageUrl ? 'cursor-pointer' : undefined}
              onClick={() => {
                if (log.imageUrl) {
                  setSelectedImageUrl(log.imageUrl)
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{log.title}</CardTitle>
                    <CardDescription>
                      {mealTypeLabels[log.mealType] ?? log.mealType}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {log.calories ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {log.description && (
                  <p className="text-sm text-muted-foreground">
                    {log.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                  {log.imageUrl && (
                    <span className="inline-flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      Photo
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div ref={sentinelRef} className="h-8" />
          {isLoadingMore && (
            <p className="text-center text-xs text-muted-foreground">
              Loading more...
            </p>
          )}
          {!hasMore && (
            <p className="text-center text-xs text-muted-foreground">
              End of history
            </p>
          )}
        </div>
      )}

      <Drawer
        open={selectedImageUrl !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedImageUrl(null)
        }}
      >
        <DrawerContent className="flex max-h-[85vh] flex-col">
          <DrawerHeader>
            <DrawerTitle>Meal Photo</DrawerTitle>
            <DrawerDescription>Logged meal image</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {selectedImageUrl && (
              <img
                src={selectedImageUrl}
                alt="Meal"
                className="w-full rounded-lg object-cover"
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
