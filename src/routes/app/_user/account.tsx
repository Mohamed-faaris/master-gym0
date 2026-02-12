import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Bell,
  Camera,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/useAuth'

export const Route = createFileRoute('/app/_user/account')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user, signOut, deleteAt: expiresIn } = useAuth()
  const navigate = useNavigate()

  // Fetch user stats
  const workoutStats = useQuery(
    api.workoutSessions.getSessionStats,
    user ? { userId: user._id } : 'skip',
  )

  const handleLogout = () => {
    signOut()
    navigate({ to: '/app/sign-in' })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h` : `${minutes}m`
  }

  const memberSince = user
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown'

  const expiresInDays =
    typeof expiresIn === 'number'
      ? Math.max(0, Math.ceil((expiresIn - Date.now()) / (1000 * 60 * 60 * 24)))
      : null

  const ceoAchievements = [
    '17 years in sports field',
    'Weight lifting (University medal bronze)',
    'Powerlifting gold medal',
    "Mr Tamil Nadu Men's Physique (Gold)",
    'VNR bodybuilding (Silver)',
    'Mr South India / Mr India participation',
    'MMA: Silambam national & international gold',
    'International referee and Tamil Nadu team coach',
    '10 years in fitness coaching',
  ]

  const successStories = [
    {
      title: '12 Week',
      subtitle: 'Cut',
      color: 'from-chart-1/20 to-chart-1/5',
    },
    {
      title: 'Muscle',
      subtitle: 'Gain',
      color: 'from-chart-2/20 to-chart-2/5',
    },
    {
      title: 'Post',
      subtitle: 'Pregnancy',
      color: 'from-chart-3/20 to-chart-3/5',
    },
  ]

  const gymBranches = ['Main Branch', 'West Branch', "Women's Exclusive Branch"]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your profile and settings
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.name ?? 'Guest'}</h2>
              <p className="text-sm text-muted-foreground">
                Member since {memberSince}
              </p>
              {expiresInDays !== null ? (
                <p className="text-sm text-muted-foreground">
                  Expiring in {expiresInDays} days
                </p>
              ) : null}
            </div>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{user?.email ?? 'No email'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{user?.phoneNumber ?? 'No phone'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Gallery */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {!workoutStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {workoutStats.totalSessions}
                  </div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatDuration(workoutStats.totalTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Time
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Card */}
        <Link to="/app/gallery" className="block">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Gallery</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-primary mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                View Photos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Manage notification preferences
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl bg-muted/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Info className="w-4 h-4 text-chart-3" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Master Fitness started on 22.08.2022 and continues to grow. We
                  currently have 3 branches, including one dedicated to women.
                </p>
                {/* <div className="flex flex-wrap gap-2">
                  {gymBranches.map((branch) => (
                    <span
                      key={branch}
                      className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
                    >
                      {branch}
                    </span>
                  ))}
                </div> */}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg leading-none">
                  CEO Nagaraj
                </h3>
                <p className="text-sm text-muted-foreground">
                  Founder & Head Coach
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  With over 15 years of experience in strength training and
                  nutrition, Nagaraj has transformed 500+ lives as a certified
                  master trainer.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm">Achievements</div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {ceoAchievements.map((achievement) => (
                  <li key={achievement} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Success Stories</h3>
            <div className="grid grid-cols-3 gap-3">
              {successStories.map((story) => (
                <div
                  key={`${story.title}-${story.subtitle}`}
                  className={`aspect-square rounded-lg bg-linear-to-br ${story.color} flex items-center justify-center border`}
                >
                  <div className="text-center p-2">
                    <div className="text-xs font-medium">{story.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {story.subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="rounded-xl border p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Info className="w-4 h-4 text-chart-3" />
              </div>
              <h3 className="font-medium">Gym Information</h3>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-foreground/70" />
                <div>
                  <div className="font-medium text-foreground">Hours</div>
                  <div>Mon - Fri: 5:00 AM - 11:00 PM</div>
                  <div>Sat - Sun: 7:00 AM - 9:00 PM</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-foreground/70" />
                <div>
                  <div className="font-medium text-foreground">Locations</div>
                  <div>
                    Main Branch • West Branch • Women\'s Exclusive Branch
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Gym Details */}
          {/* <div className="p-4 rounded-lg bg-muted/30 space-y-3 text-sm">
            <div>
              <div className="font-semibold mb-1">Master Gym</div>
              <div className="text-muted-foreground">
                Your premier fitness destination
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Hours</div>
              <div className="text-muted-foreground">
                Mon - Fri: 5:00 AM - 11:00 PM
                <br />
                Sat - Sun: 7:00 AM - 9:00 PM
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Location</div>
              <div className="text-muted-foreground">
                123 Fitness Street
                <br />
                New York, NY 10001
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Contact</div>
              <div className="text-muted-foreground">
                Phone: (555) 987-6543
                <br />
                Email: info@mastergym.com
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Amenities</div>
              <div className="text-muted-foreground">
                • Free weights & machines
                <br />
                • Cardio equipment
                <br />
                • Group classes
                <br />
                • Personal training
                <br />
                • Locker rooms & showers
                <br />• Free parking
              </div>
            </div>
          </div> */}
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="space-y-2">
        <button className="w-full p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors">
          <div className="text-sm font-medium">Privacy Policy</div>
        </button>
        <button className="w-full p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors">
          <div className="text-sm font-medium">Terms of Service</div>
        </button>
        <div className="text-center text-xs text-muted-foreground py-2">
          Version 1.0.0
        </div>
      </div>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        size="lg"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </Button>

      {/* Extra padding for bottom nav */}
      <div className="h-4" />
    </div>
  )
}
