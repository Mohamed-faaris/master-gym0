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

const EXERCISE_NAMES = [
  // CHEST (8)
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Decline Bench Press',
  'Dumbbell Fly',
  'Cable Chest Fly',
  'Push-Ups',
  'Dumbbell Pullover',
  'Smith Machine Bench Press',
  // BACK (8)
  'Lat Pulldown',
  'Pull-Ups / Assisted Pull-Ups',
  'Seated Cable Row',
  'Bent-Over Barbell Row',
  'One-Arm Dumbbell Row',
  'T-Bar Row',
  'Deadlift',
  'Straight-Arm Pulldown',
  // SHOULDERS (7)
  'Barbell Overhead Press',
  'Dumbbell Lateral Raise',
  'Front Raise',
  'Rear Delt Fly',
  'Arnold Press',
  'Upright Row',
  'Face Pull',
  // BICEPS (6)
  'Barbell Curl',
  'Dumbbell Curl',
  'Hammer Curl',
  'Preacher Curl',
  'Concentration Curl',
  'Cable Biceps Curl',
  // TRICEPS (6)
  'Cable Triceps Pushdown',
  'Skull Crushers',
  'Overhead Dumbbell Triceps Extension',
  'Bench Dips',
  'Close-Grip Bench Press',
  'Triceps Kickbacks',
  // LEGS (10)
  'Barbell Squat',
  'Leg Press',
  'Walking Lunges',
  'Leg Extension',
  'Leg Curl',
  'Romanian Deadlift',
  'Standing Calf Raises',
  'Seated Calf Raises',
  'Bulgarian Split Squat',
  'Hack Squat',
  // CORE / ABS (5)
  'Hanging Leg Raises',
  'Cable Crunch',
  'Ab Wheel Rollout',
  'Plank',
  'Russian Twist',
] as const

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
const MealTypeValidator = enumToValidator(MEAL_TYPES)
const GalleryStatusValidator = enumToValidator(GALLERY_STATUSES)
const GalleryAccessValidator = enumToValidator(GALLERY_ACCESS)
const ContentStatusValidator = enumToValidator(CONTENT_STATUSES)
const DayOfWeekValidator = enumToValidator(DAYS_OF_WEEK)
const ExerciseNameValidator = enumToValidator(EXERCISE_NAMES)

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
  trainingPlanId: v.optional(v.id('trainingPlans')),
  dietPlanId: v.optional(v.id('dietPlans')),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_phone', ['phoneNumber'])
  .index('by_phone_pin', ['phoneNumber', 'pin'])
  .index('by_trainer', ['trainerId'])
  .index('by_training_plan', ['trainingPlanId'])

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

/* -------------------- TRAINING PLANS -------------------- */

const trainingPlans = defineTable({
  name: v.string(),
  description: v.string(),
  isCopy: v.boolean(),
  isAssigned: v.boolean(),

  days: v.array(
    v.object({
      day: DayOfWeekValidator,
      dayTitle: v.optional(v.string()),
      dayDescription: v.optional(v.string()),
      exercises: v.array(
        v.object({
          exerciseName: v.string(),
          noOfSets: v.number(),
          sets: v.array(
            v.object({
              reps: v.optional(v.number()),
              weight: v.optional(v.number()),
              restTime: v.optional(v.number()),
            }),
          ),
        }),
      ),
    }),
  ),

  durationDays: v.number(),
  createdBy: v.id('users'),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index('by_creator', ['createdBy'])

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
  trainingPlanId: v.optional(v.id('trainingPlans')),

  startTime: v.number(),
  endTime: v.optional(v.number()),

  status: WorkoutStatusValidator, // 'ongoing', 'completed', 'cancelled'
  dayOfWeek: DayOfWeekValidator,

  exercises: v.array(
    v.object({
      exerciseName: v.string(),
      noOfSets: v.number(),
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

/* ======================================================= */

export default defineSchema({
  users,
  userMeta,
  userMeasurement,
  dietLogs,
  weightLogs,
  trainingPlans,
  dietPlans,
  workoutSessions,
  gallery,
  aboutContent,
  successStories,
  transformationImages,
})
