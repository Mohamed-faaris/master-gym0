import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/* ======================================================
   CONSTANTS (Single Source of Truth)
====================================================== */

const ROLES = [
  'trainer',
  'trainerManagedCustomer',
  'selfManagedCustomer',
  'admin',
] as const

const WORKOUT_STATUSES = ['ongoing', 'completed', 'cancelled'] as const
const ROUTINE_TYPES = ['custom', 'trainer'] as const

export const MEAL_TYPES = [
  'breakfast',
  'middaySnack',
  'lunch',
  'preWorkout',
  'postWorkout',
] as const

export const GALLERY_STATUSES = [
  'approved',
  'subitted',
  'rejrected',
  'notSubmited',
] as const

export const GALLERY_ACCESS = ['private', 'public'] as const
export const CONTENT_STATUSES = ['active', 'draft', 'inactive'] as const

const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/* ======================================================
   ENUM → VALIDATOR HELPER
====================================================== */

function enumToValidator<T extends ReadonlyArray<string>>(values: T) {
  return v.union(...values.map(v.literal))
}

/* ======================================================
   VALIDATORS
====================================================== */

const RoleValidator = enumToValidator(ROLES)
const WorkoutStatusValidator = enumToValidator(WORKOUT_STATUSES)
const RoutineTypeValidator = enumToValidator(ROUTINE_TYPES)
const MealTypeValidator = enumToValidator(MEAL_TYPES)
const GalleryStatusValidator = enumToValidator(GALLERY_STATUSES)
const GalleryAccessValidator = enumToValidator(GALLERY_ACCESS)
const ContentStatusValidator = enumToValidator(CONTENT_STATUSES)
const DayOfWeekValidator = enumToValidator(DAYS_OF_WEEK)

/* ======================================================
   TABLES
====================================================== */

/* -------------------- USERS -------------------- */

const users = defineTable({
  name: v.string(),
  phoneNumber: v.string(), // unique via index
  email: v.optional(v.string()),
  pin: v.string(), // 6-digit, stored as-is (explicitly insecure)

  role: RoleValidator,

  goal: v.optional(v.string()),

  trainerId: v.optional(v.id('users')),
  dietPlanId: v.optional(v.id('dietPlans')),
  trainingPlanId: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_phone', ['phoneNumber'])
  .index('by_phone_pin', ['phoneNumber', 'pin'])
  .index('by_trainer', ['trainerId'])

/* -------------------- USER META -------------------- */

const userMeta = defineTable({
  userId: v.id('users'),

  age: v.optional(v.number()),
  address: v.optional(v.string()),
  gender: v.optional(v.string()),
  height: v.optional(v.number()),
  focusArea: v.optional(v.string()),
  progressPercent: v.optional(v.number()),
  readinessNote: v.optional(v.string()),
  accentColor: v.optional(v.string()),

  currentWeight: v.optional(v.number()),
  targetWeight: v.optional(v.number()),

  emergencyContactName: v.optional(v.string()),
  emergencyContactPhone: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
}).index('by_user', ['userId'])

const userMeasurement = defineTable({
  userId: v.id('users'),

  chest: v.optional(v.number()),
  shoulder: v.optional(v.number()),
  hip: v.optional(v.number()),
  arms: v.optional(v.number()),
  legs: v.optional(v.number()),

  timeSpanDays: v.optional(v.number()),

  createdAt: v.number(),
  updatedAt: v.number(),
}).index('by_user', ['userId'])

/* -------------------- DIET LOGS -------------------- */

const dietLogs = defineTable({
  userId: v.id('users'),
  createdAt: v.number(),
  mealType: MealTypeValidator,
  title: v.string(),
  description: v.string(),
  calories: v.optional(v.number()),
  imageId: v.optional(v.id('_storage')),
}).index('by_user', ['userId'])

/* -------------------- WEIGHT LOGS -------------------- */

const weightLogs = defineTable({
  userId: v.id('users'),

  createdAt: v.number(),
  weight: v.number(),
}).index('by_user', ['userId'])

/* -------------------- ROUTINES -------------------- */

const routines = defineTable({
  name: v.string(),
  userId: v.optional(v.id('users')), // null if global/app routine
  authorId: v.id('users'), // Who created it
  type: RoutineTypeValidator, // 'custom' | 'trainer'

  dayOfWeek: v.optional(DayOfWeekValidator),
  focus: v.optional(v.string()),

  exercises: v.array(
    v.object({
      exerciseId: v.optional(v.id('exercises')),
      exerciseName: v.string(),
      sets: v.array(
        v.object({
          reps: v.optional(v.number()),
          weight: v.optional(v.number()),
          restTime: v.optional(v.number()), // in seconds
        }),
      ),
    }),
  ),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_author', ['authorId'])
  .index('by_type', ['type'])

export const dietPlans = defineTable({
  name: v.string(),
  description: v.string(),
  goal: v.optional(v.string()),
  durationDays: v.optional(v.number()),

  // Days that are active in this plan
  activeDays: v.array(DayOfWeekValidator),

  // Daily targets
  dailyCalorieTarget: v.optional(v.number()),
  hydrationTarget: v.optional(v.string()),

  // Coach guidance
  coachNote: v.optional(v.string()),

  // Meal template for each day (repeatable structure)
  mealTemplate: v.array(
    v.object({
      day: DayOfWeekValidator,
      mealType: MealTypeValidator,
      title: v.string(),
      description: v.string(),
      calories: v.number(),
    }),
  ),

  createdBy: v.id('users'),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index('by_creator', ['createdBy'])

/* -------------------- WORKOUT SESSIONS -------------------- */

const workoutSessions = defineTable({
  userId: v.id('users'),
  routineId: v.optional(v.id('routines')),
  instructorId: v.optional(v.id('users')), // If a trainer started it

  startTime: v.number(),
  endTime: v.optional(v.number()),

  status: WorkoutStatusValidator, // 'ongoing', 'completed', 'cancelled'
  dayOfWeek: DayOfWeekValidator,

  exercises: v.array(
    v.object({
      exerciseId: v.optional(v.id('exercises')),
      exerciseName: v.string(),
      sets: v.array(
        v.object({
          reps: v.optional(v.number()),
          weight: v.optional(v.number()),
          restTime: v.optional(v.number()),
          completed: v.boolean(),
        }),
      ),
    }),
  ),

  totalTime: v.number(), // in seconds
  totalCaloriesBurned: v.number(),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_day', ['userId', 'dayOfWeek'])
  .index('by_user_status', ['userId', 'status'])

/* -------------------- GALLERY -------------------- */

const gallery = defineTable({
  userId: v.id('users'),
  imgUrl: v.string(),
  storageId: v.optional(v.id('_storage')),
  status: GalleryStatusValidator,
  access: GalleryAccessValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_access', ['access'])

/* -------------------- ABOUT CONTENT -------------------- */

const aboutContent = defineTable({
  title: v.string(),
  subtitle: v.optional(v.string()),
  paragraph: v.string(),
  branchNames: v.array(v.string()),
  achievements: v.array(v.string()),
  founderName: v.optional(v.string()),
  founderRole: v.optional(v.string()),
  founderBio: v.optional(v.string()),
  status: ContentStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_status', ['status'])
  .index('by_updatedAt', ['updatedAt'])

/* -------------------- SUCCESS STORIES -------------------- */

const successStories = defineTable({
  slug: v.string(),
  title: v.string(),
  imageStorageId: v.optional(v.id('_storage')),
  imageUrl: v.optional(v.string()),
  paragraph: v.string(),
  points: v.array(v.string()),
  status: ContentStatusValidator,
  order: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_status', ['status'])
  .index('by_status_order', ['status', 'order'])
  .index('by_slug', ['slug'])

/* -------------------- TRANSFORMATION IMAGES -------------------- */

const transformationImages = defineTable({
  title: v.optional(v.string()),
  imageStorageId: v.optional(v.id('_storage')),
  imageUrl: v.string(),
  order: v.number(),
  status: ContentStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_status', ['status'])
  .index('by_status_order', ['status', 'order'])

/* -------------------- EXERCISES -------------------- */

const exercises = defineTable({
  name: v.string(),
  createdAt: v.number(),
}).index('by_name', ['name'])

/* ======================================================= */

export default defineSchema({
  users,
  userMeta,
  userMeasurement,
  dietLogs,
  weightLogs,
  routines,
  dietPlans,
  workoutSessions,
  gallery,
  aboutContent,
  successStories,
  transformationImages,
  exercises,
})
