import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  Clock,
  TrendingUp,
  Flame,
  Scale,
  UtensilsCrossed,
  Camera,
  X,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { TodayProgressChart } from '@/components/charts/today-progress-chart'
import { ActivityTimeCard } from '@/components/activity-time-card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { MEAL_TYPES } from '@/lib/constants'
import { useAuth } from '@/components/auth/useAuth'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

export const Route = createFileRoute('/app/_user/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  const isTrainerManaged = user?.role === 'trainerManagedCustomer'
  const needsCalories = !isTrainerManaged
  const trainerManagedCopy = isTrainerManaged
    ? 'Calories will be added by your trainer after review.'
    : 'Track your nutrition and calories'

  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false)
  const [weight, setWeight] = useState('')

  const [dietDrawerOpen, setDietDrawerOpen] = useState(false)
  const [mealType, setMealType] =
    useState<(typeof MEAL_TYPES)[number]>('breakfast')
  const [dietTitle, setDietTitle] = useState('')
  const [dietDescription, setDietDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageStorageId, setImageStorageId] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024

  // Database queries
  const workoutStats = useQuery(
    api.workoutSessions.getSessionStats,
    user ? { userId: user._id } : 'skip',
  )
  const recentWorkouts = useQuery(
    api.workoutSessions.getSessionHistory,
    user ? { userId: user._id, limit: 7 } : 'skip',
  )

  // Mutations
  const addWeightLog = useMutation(api.weightLogs.addWeightLog)
  const addDietLog = useMutation(api.dietLogs.addDietLog)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  // Calculate weekly stats
  const getWeeklyStats = () => {
    if (!recentWorkouts)
      return { days: [], totalCalories: 0, totalTime: 0, workoutCount: 0 }

    const now = new Date()
    const weekData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
      (day, index) => {
        const dayDate = new Date(now)
        const currentDay = now.getDay()
        const targetDay = index === 6 ? 0 : index + 1 // Monday=1 to Sunday=0
        const diff = currentDay - targetDay
        dayDate.setDate(now.getDate() - diff)
        dayDate.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayDate)
        dayEnd.setHours(23, 59, 59, 999)

        const dayWorkouts = recentWorkouts.filter((w) => {
          const workoutDate = new Date(w.startTime)
          return workoutDate >= dayDate && workoutDate <= dayEnd
        })

        const calories = dayWorkouts.reduce(
          (sum, w) => sum + (w.totalCaloriesBurned || 0),
          0,
        )
        return { day, calories }
      },
    )

    const totalCalories = recentWorkouts.reduce(
      (sum, w) => sum + (w.totalCaloriesBurned || 0),
      0,
    )
    const totalTime = recentWorkouts.reduce(
      (sum, w) => sum + (w.totalTime || 0),
      0,
    )
    const workoutCount = recentWorkouts.filter(
      (w) => w.status === 'completed',
    ).length

    return { days: weekData, totalCalories, totalTime, workoutCount }
  }

  const weeklyStats = getWeeklyStats()

  const handleLogWeight = async () => {
    if (!user) {
      toast.error('Please sign in first')
      return
    }
    const weightValue = parseFloat(weight)
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error('Please enter a valid weight')
      return
    }

    try {
      await addWeightLog({ userId: user._id, weight: weightValue })
      toast.success(`Weight logged: ${weightValue} kg`)
      setWeight('')
      setWeightDrawerOpen(false)
    } catch {
      toast.error('Failed to log weight')
    }
  }

  const handleLogDiet = async () => {
    if (!user) {
      toast.error('Please sign in first')
      return
    }
    if (!dietTitle.trim()) {
      toast.error('Please enter a meal title')
      return
    }
    let caloriesValue: number | undefined
    if (needsCalories) {
      const parsedCalories = parseFloat(calories)
      if (isNaN(parsedCalories) || parsedCalories <= 0) {
        toast.error('Please enter valid calories')
        return
      }
      caloriesValue = parsedCalories
    }

    try {
      await addDietLog({
        userId: user._id,
        mealType,
        title: dietTitle,
        description: dietDescription,
        calories: caloriesValue,
        imageId: imageStorageId ?? undefined,
      })
      toast.success(
        `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} logged!`,
      )
      setDietTitle('')
      setDietDescription('')
      setCalories('')
      clearImageState()
      setDietDrawerOpen(false)
    } catch {
      toast.error('Failed to log meal')
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const clearImageState = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setSelectedImageFile(null)
    setImagePreviewUrl(null)
    setImageStorageId(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const uploadImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      clearImageState()
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be 5MB or smaller')
      clearImageState()
      return
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedImageFile(file)
    setImagePreviewUrl(previewUrl)
    setIsUploadingImage(true)

    try {
      const uploadUrl = await generateUploadUrl()
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: file,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setImageStorageId(data.storageId)
    } catch {
      toast.error('Failed to upload image')
      clearImageState()
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handlePickImage = async () => {
    if (isUploadingImage) return

    try {
      const [{ Capacitor }, cameraModule] = await Promise.all([
        import('@capacitor/core'),
        import('@capacitor/camera'),
      ])

      if (Capacitor.getPlatform() === 'web') {
        imageInputRef.current?.click()
        return
      }

      const photo = await cameraModule.Camera.getPhoto({
        quality: 80,
        source: cameraModule.CameraSource.Camera,
        resultType: cameraModule.CameraResultType.Uri,
      })

      if (!photo.webPath) {
        toast.error('Failed to read image')
        return
      }

      const imageResponse = await fetch(photo.webPath)
      const imageBlob = await imageResponse.blob()
      const extension = imageBlob.type === 'image/png' ? 'png' : 'jpg'
      const imageFile = new File(
        [imageBlob],
        `meal-photo-${Date.now()}.${extension}`,
        { type: imageBlob.type || 'image/jpeg' },
      )

      await uploadImageFile(imageFile)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('cancel')
      ) {
        return
      }
      toast.error('Failed to open camera')
      imageInputRef.current?.click()
    }
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await uploadImageFile(file)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Activity Time Card */}
      <ActivityTimeCard />

      {/* Weekly Summary - Disabled for now
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Calories Burned</h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {weeklyStats.days.map(({ day, calories }) => {
                const maxCalories = Math.max(
                  ...weeklyStats.days.map((d) => d.calories),
                  400,
                )
                const height =
                  maxCalories > 0 ? (calories / maxCalories) * 100 : 0
                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full bg-muted rounded-t-lg relative"
                      style={{
                        height: `${height}%`,
                        minHeight: calories > 0 ? '20%' : '4px',
                      }}
                    >
                      <div className="absolute inset-0 bg-chart-1 rounded-t-lg" />
                    </div>
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="w-4 h-4" />
                <span className="text-sm">Total Calories</span>
              </div>
              <div className="text-2xl font-bold">
                {workoutStats?.totalCalories?.toLocaleString() ?? '0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Total Time</span>
              </div>
              <div className="text-2xl font-bold">
                {formatDuration(workoutStats?.totalTime ?? 0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Workouts</span>
              </div>
              <div className="text-2xl font-bold">
                {workoutStats?.totalSessions ?? 0}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Avg/Day</span>
              </div>
              <div className="text-2xl font-bold">
                {weeklyStats.workoutCount > 0
                  ? Math.round(weeklyStats.totalCalories / 7)
                  : 0}{' '}
                cal
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      */}

      {/* Today's Stats - Radial Chart */}
      <TodayProgressChart />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentWorkouts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Your recent workouts will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.slice(0, 5).map((workout) => (
                <div
                  key={workout._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        workout.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : workout.status === 'ongoing'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {workout.status} Session
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(workout.startTime).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {workout.totalCaloriesBurned ?? 0} cal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workout.totalTime
                        ? formatDuration(workout.totalTime)
                        : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Log Drawer */}
      <Drawer open={weightDrawerOpen} onOpenChange={setWeightDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setWeightDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Scale className="h-7 w-7 text-primary" />
            </div>
            <DrawerTitle className="text-center text-xl">
              Log Your Weight
            </DrawerTitle>
            <DrawerDescription className="text-center">
              Track your weight progress over time
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <label
                  htmlFor="weight"
                  className="block text-sm font-medium text-muted-foreground text-center"
                >
                  Current Weight
                </label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const current = parseFloat(weight) || 70
                      setWeight((current - 0.5).toFixed(1))
                    }}
                    className="h-14 w-14 rounded-full p-0"
                  >
                    <span className="text-xl font-semibold">-</span>
                  </Button>

                  <div className="relative flex-1 max-w-[200px]">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleLogWeight()
                        }
                      }}
                      className="pr-12 text-2xl h-14 text-center font-bold"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">
                      kg
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const current = parseFloat(weight) || 70
                      setWeight((current + 0.5).toFixed(1))
                    }}
                    className="h-14 w-14 rounded-full p-0"
                  >
                    <span className="text-xl font-semibold">+</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="pt-2">
            <Button
              onClick={handleLogWeight}
              size="lg"
              className="w-full"
              disabled={!weight || parseFloat(weight) <= 0}
            >
              <Scale className="mr-2 h-4 w-4" />
              Log Weight
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Diet Log Drawer */}
      <Drawer open={dietDrawerOpen} onOpenChange={setDietDrawerOpen}>
        <DrawerContent className="flex max-h-[85vh] flex-col">
          <DrawerHeader className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setDietDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <UtensilsCrossed className="h-7 w-7 text-primary" />
            </div>
            <DrawerTitle className="text-center text-xl">
              Log Your Meal
            </DrawerTitle>
            <DrawerDescription className="text-center">
              {trainerManagedCopy}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              {/* Meal Type Tabs */}
              <Tabs
                defaultValue="breakfast"
                value={mealType}
                onValueChange={(v) => setMealType(v as typeof mealType)}
              >
                <TabsList className="grid w-full grid-cols-5">
                  {MEAL_TYPES.map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="text-xs capitalize"
                    >
                      {type === 'middaySnack'
                        ? 'Snack'
                        : type === 'preWorkout'
                          ? 'Pre'
                        : type === 'postWorkout'
                          ? 'Post'
                          : type}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="space-y-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed p-0"
                  onClick={handlePickImage}
                  disabled={isUploadingImage}
                >
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Meal preview"
                      className="h-full w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {isUploadingImage ? 'Uploading...' : 'Add Photo'}
                      </span>
                    </div>
                  )}
                </Button>
                {imagePreviewUrl && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">
                      {selectedImageFile?.name ?? 'Selected image'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearImageState}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label htmlFor="diet-title" className="text-sm font-medium">
                  Meal Title
                </label>
                <Input
                  id="diet-title"
                  type="text"
                  placeholder="e.g., Grilled Chicken Salad"
                  value={dietTitle}
                  onChange={(e) => setDietTitle(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label
                  htmlFor="diet-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="diet-description"
                  placeholder="Add notes about your meal..."
                  value={dietDescription}
                  onChange={(e) => setDietDescription(e.target.value)}
                  className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {needsCalories && (
                <div className="space-y-2">
                  <label htmlFor="calories" className="text-sm font-medium">
                    Calories
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        const current = parseFloat(calories) || 0
                        setCalories(Math.max(0, current - 50).toString())
                      }}
                      className="h-11 w-11 rounded-full p-0"
                    >
                      <span className="text-xl font-semibold">-</span>
                    </Button>

                    <div className="relative flex-1">
                      <Input
                        id="calories"
                        type="number"
                        step="10"
                        placeholder="0"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        className="pr-16 text-lg h-11 text-center font-semibold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        kcal
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        const current = parseFloat(calories) || 0
                        setCalories((current + 50).toString())
                      }}
                      className="h-11 w-11 rounded-full p-0"
                    >
                      <span className="text-xl font-semibold">+</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DrawerFooter className="shrink-0 border-t bg-background pt-2">
            <Button
              onClick={handleLogDiet}
              size="lg"
              className="w-full"
              disabled={
                !dietTitle.trim() ||
                (needsCalories &&
                  (!calories || parseFloat(calories) <= 0)) ||
                isUploadingImage
              }
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Log Meal
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
