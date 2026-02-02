import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Home,
  Dumbbell,
  Plus,
  FileText,
  User,
  UtensilsCrossed,
  Scale,
  Utensils,
  X,
  Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerNestedRoot,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { MEAL_TYPES } from '@/lib/constants'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  { to: '/app', icon: Home, label: 'Dashboard' },
  { to: '/app/workouts', icon: Dumbbell, label: 'Workouts' },
]

const navItemsRight: NavItem[] = [
  { to: '/app/logs', icon: FileText, label: 'Logs' },
  { to: '/app/account', icon: User, label: 'Account' },
]

export function BottomNavigation() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { user } = useAuth()

  // Form states
  const [weight, setWeight] = React.useState('')
  const [mealType, setMealType] =
    React.useState<(typeof MEAL_TYPES)[number]>('breakfast')
  const [dietTitle, setDietTitle] = React.useState('')
  const [dietDescription, setDietDescription] = React.useState('')
  const [calories, setCalories] = React.useState('')

  // Drawer states
  const [weightDrawerOpen, setWeightDrawerOpen] = React.useState(false)
  const [dietDrawerOpen, setDietDrawerOpen] = React.useState(false)

  // Mutations
  const addWeightLog = useMutation(api.weightLogs.addWeightLog)
  const addDietLog = useMutation(api.dietLogs.addDietLog)

  const isActive = (path: string) => {
    if (path === '/app') {
      return currentPath === '/app' || currentPath === '/app/'
    }
    return currentPath.startsWith(path)
  }

  const handleLogWeight = async () => {
    if (!user) return
    const weightValue = parseFloat(weight)
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error('Please enter a valid weight')
      return
    }
    try {
      await addWeightLog({ userId: user._id, weight: weightValue })
      toast.success('Weight logged successfully')
      setWeight('')
      setWeightDrawerOpen(false)
    } catch (error) {
      toast.error('Failed to log weight')
    }
  }

  const handleLogDiet = async () => {
    if (!user) return
    const calValue = parseInt(calories)
    if (!dietTitle || isNaN(calValue)) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      await addDietLog({
        userId: user._id,
        mealType,
        title: dietTitle,
        description: dietDescription,
        calories: calValue,
      })
      toast.success('Meal logged successfully')
      setDietTitle('')
      setDietDescription('')
      setCalories('')
      setDietDrawerOpen(false)
    } catch (error) {
      toast.error('Failed to log meal')
    }
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg">
        <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          <button
            onClick={() => {
              setDrawerOpen(true)
            }}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors hover:text-foreground"
          >
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6" />
            </div>
          </button>

          {navItemsRight.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        shouldScaleBackground
      >
        <DrawerContent className="max-w-screen-sm mx-auto">
          <DrawerHeader>
            <DrawerTitle>Quick Actions</DrawerTitle>
            <DrawerDescription>
              Start a new workout or log your progress
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-3 p-6">
            <Link to="/app/workout-session" onClick={() => setDrawerOpen(false)}>
              <Button
                variant="outline"
                className="w-full h-16 text-lg justify-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Start Workout</div>
                  <div className="text-sm text-muted-foreground">
                    Begin today's training
                  </div>
                </div>
              </Button>
            </Link>

            <DrawerNestedRoot>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-16 text-lg justify-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-chart-2" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Log Weight</div>
                    <div className="text-sm text-muted-foreground">
                      Track your progress
                    </div>
                  </div>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-w-screen-sm mx-auto">
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
            </DrawerNestedRoot>

            <DrawerNestedRoot>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-16 text-lg justify-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-chart-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Log Diet</div>
                    <div className="text-sm text-muted-foreground">
                      Record your meals
                    </div>
                  </div>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-w-screen-sm mx-auto">
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
                            {type === 'postWorkout' ? 'Post' : type}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    {/* Camera Button */}
                    <Button variant="outline" className="w-full h-32 border-dashed">
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Add Photo
                        </span>
                      </div>
                    </Button>

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

                    {/* Calories Input */}
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
                      !dietTitle.trim() || !calories || parseFloat(calories) <= 0
                    }
                  >
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Log Meal
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </DrawerNestedRoot>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
