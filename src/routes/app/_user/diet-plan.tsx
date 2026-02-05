import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  Calendar,
  Droplets,
  Target,
  UtensilsCrossed,
  Utensils,
  Camera,
  X,
} from 'lucide-react'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { MEAL_TYPES } from '@/lib/constants'
import { toast } from 'sonner'

export const Route = createFileRoute('/app/_user/diet-plan')({
  component: DietPlanRoute,
})

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function DietPlanRoute() {
  const { user } = useAuth()

  const planOwnerId = user?.trainerId ?? user?._id
  const isTrainerManaged = user?.role === 'trainerManagedCustomer'
  const needsCalories = !isTrainerManaged

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

  const addDietLog = useMutation(api.dietLogs.addDietLog)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const dietPlans = useQuery(
    api.dietPlans.getDietPlansByUser,
    planOwnerId ? { userId: planOwnerId } : 'skip',
  )

  const dietPlan = dietPlans?.[0] ?? null

  const weekDayLabels: Record<string, string> = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  }

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    postWorkout: 'Post-workout',
  }

  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

  const mealsByDay = useMemo(() => {
    if (!dietPlan) return {} as Record<string, typeof dietPlan.mealTemplate>
    return dietPlan.mealTemplate.reduce(
      (acc, meal) => {
        const dayKey = meal.day || 'unknown'
        if (!acc[dayKey]) acc[dayKey] = []
        acc[dayKey].push(meal)
        return acc
      },
      {} as Record<string, typeof dietPlan.mealTemplate>,
    )
  }, [dietPlan])

  const availableDays = dayOrder.filter((day) => mealsByDay[day]?.length)
  const todayKey = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[
    new Date().getDay()
  ]
  const [activeDay, setActiveDay] = useState<string>(todayKey)

  useEffect(() => {
    if (!availableDays.length) return
    setActiveDay((prev) => {
      if (availableDays.includes(prev)) return prev
      if (availableDays.includes(todayKey)) return todayKey
      return availableDays[0]
    })
  }, [availableDays])

  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    Object.entries(mealsByDay).forEach(([day, meals]) => {
      totals[day] = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
    })
    return totals
  }, [mealsByDay])

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

  const handlePickImage = () => {
    imageInputRef.current?.click()
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
    if (!isTrainerManaged) {
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

  if (!dietPlans) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading diet plan...</p>
      </div>
    )
  }

  if (!dietPlan) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Diet Plan</h1>
          <p className="text-muted-foreground">
            Your assigned nutrition plan will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Utensils className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No plan assigned</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Ask your trainer to assign a diet plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => setDietDrawerOpen(true)}
          className="h-14 w-[calc(100%-2rem)] max-w-screen-sm rounded-full shadow-lg fixed left-1/2 -translate-x-1/2 bottom-20 z-30"
        >
          <UtensilsCrossed className="w-5 h-5 mr-2" />
          Log Diet
        </Button>

        <Drawer open={dietDrawerOpen} onOpenChange={setDietDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
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
                Track your nutrition and calories
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-4">
              <div className="space-y-4">
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
                        {type === 'postWorkout' ? 'Post' : type}
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

                <div className="space-y-2">
                  <label htmlFor="diet-description" className="text-sm font-medium">
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

                {!isTrainerManaged && (
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

            <DrawerFooter className="pt-2">
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{dietPlan.name}</h1>
          <p className="text-sm text-muted-foreground">
            {dietPlan.description}
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {dietPlan.goal && (
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              {dietPlan.goal}
            </div>
          )}
          {dietPlan.durationWeeks && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {dietPlan.durationWeeks} weeks
            </div>
          )}
          {dietPlan.dailyCalorieTarget && (
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-4 w-4" />
              {dietPlan.dailyCalorieTarget} cal/day
            </div>
          )}
          {dietPlan.hydrationTarget && (
            <div className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4" />
              {dietPlan.hydrationTarget}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Active Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dietPlan.activeDays.map((day) => (
                <span
                  key={day}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {weekDayLabels[day] || day}
                </span>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {dietPlan.coachNote && (
          <Card>
            <CardHeader>
              <CardTitle>Coach Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {dietPlan.coachNote}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Meal Template
            </CardTitle>
            <CardDescription>
              {dietPlan.mealTemplate.length} meal
              {dietPlan.mealTemplate.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="grid w-full grid-cols-7">
                {availableDays.map((day) => (
                  <TabsTrigger key={day} value={day}>
                    {weekDayLabels[day]?.slice(0, 3) ?? day}
                  </TabsTrigger>
                ))}
              </TabsList>

              {availableDays.map((day) => (
                <TabsContent key={day} value={day} className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {weekDayLabels[day] || day}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {mealsByDay[day].length} meal
                      {mealsByDay[day].length !== 1 ? 's' : ''} ·{' '}
                      {dayTotals[day] ?? 0} cal
                    </span>
                  </div>
                  <div className="space-y-3">
                    {mealsByDay[day].map((meal, index) => (
                      <div
                        key={`${day}-${index}`}
                        className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {mealTypeLabels[meal.mealType] || meal.mealType}
                            </p>
                            <p className="text-base font-semibold mt-1">
                              {meal.title}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {meal.calories} cal
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {meal.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {dietPlan.mealTemplate.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No meals configured in this template
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => setDietDrawerOpen(true)}
        className="h-14 w-[calc(100%-2rem)] max-w-screen-sm rounded-full shadow-lg fixed left-1/2 -translate-x-1/2 bottom-20 z-30"
      >
        <UtensilsCrossed className="w-5 h-5 mr-2" />
        Log Diet
      </Button>

      <Drawer open={dietDrawerOpen} onOpenChange={setDietDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
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
              Track your nutrition and calories
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <div className="space-y-4">
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
                      {type === 'postWorkout' ? 'Post' : type}
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

              <div className="space-y-2">
                <label htmlFor="diet-description" className="text-sm font-medium">
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
            </div>
          </div>

          <DrawerFooter className="pt-2">
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
