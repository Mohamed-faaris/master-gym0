import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.weekly(
  'cleanup orphaned image storage',
  { dayOfWeek: 'sunday', hourUTC: 2, minuteUTC: 0 },
  internal.storageCleanup.deleteOrphanedImageStorage,
)

export default crons
