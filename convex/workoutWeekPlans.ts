import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const RoutineScopeValidator = v.union(
  v.literal('all'),
  v.literal('trainer_clients'),
  v.literal('single_client'),
)

const DayOfWeekValidator = v.union(
  v.literal('mon'),
  v.literal('tue'),
  v.literal('wed'),
  v.literal('thu'),
  v.literal('fri'),
  v.literal('sat'),
  v.literal('sun'),
)

const ExerciseSetValidator = v.object({
  reps: v.optional(v.number()),
  weight: v.optional(v.number()),
  restTime: v.optional(v.number()),
})

const RoutineExerciseValidator = v.object({
  exerciseId: v.optional(v.id('exercises')),
  exerciseName: v.string(),
  supersetGroupId: v.optional(v.string()),
  sets: v.array(ExerciseSetValidator),
})

const WorkoutDayPlanValidator = v.object({
  day: DayOfWeekValidator,
  focus: v.optional(v.string()),
  exercises: v.array(RoutineExerciseValidator),
})

const comparePlanFreshness = (
  a: { updatedAt: number; createdAt: number },
  b: { updatedAt: number; createdAt: number },
) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)

const resolveWeekPlanScope = (plan: { scope?: string; userId?: unknown }) => {
  if (
    plan.scope === 'all' ||
    plan.scope === 'trainer_clients' ||
    plan.scope === 'single_client'
  ) {
    return plan.scope
  }

  return plan.userId ? 'single_client' : 'trainer_clients'
}

export const createWorkoutWeekPlan = mutation({
  args: {
    name: v.string(),
    userId: v.optional(v.id('users')),
    authorId: v.id('users'),
    scope: RoutineScopeValidator,
    goal: v.optional(v.string()),
    notes: v.optional(v.string()),
    activeDays: v.array(DayOfWeekValidator),
    dayPlans: v.array(WorkoutDayPlanValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return ctx.db.insert('workoutWeekPlans', {
      name: args.name,
      userId: args.userId,
      authorId: args.authorId,
      scope: args.scope,
      goal: args.goal,
      notes: args.notes,
      activeDays: args.activeDays,
      dayPlans: args.dayPlans,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const getReusableWorkoutWeekPlansByAuthor = query({
  args: { authorId: v.id('users') },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query('workoutWeekPlans')
      .withIndex('by_author', (q) => q.eq('authorId', args.authorId))
      .collect()

    return plans
      .filter((plan) => {
        const scope = resolveWeekPlanScope(plan)
        return scope === 'trainer_clients' || scope === 'all'
      })
      .sort(comparePlanFreshness)
  },
})

export const getWorkoutWeekPlansByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query('workoutWeekPlans')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    return plans
      .filter((plan) => resolveWeekPlanScope(plan) === 'single_client')
      .sort(comparePlanFreshness)
  },
})

export const getPremadeWorkoutWeekPlansForUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return []
    }

    const plans = await ctx.db.query('workoutWeekPlans').collect()

    return plans
      .filter((plan) => {
        const scope = resolveWeekPlanScope(plan)
        if (scope === 'all') {
          return true
        }

        if (scope === 'trainer_clients') {
          return !!user.trainerId && plan.authorId === user.trainerId
        }

        return false
      })
      .sort(comparePlanFreshness)
  },
})

export const getWorkoutWeekPlanById = query({
  args: { planId: v.id('workoutWeekPlans') },
  handler: async (ctx, args) => ctx.db.get(args.planId),
})

export const updateWorkoutWeekPlan = mutation({
  args: {
    planId: v.id('workoutWeekPlans'),
    name: v.optional(v.string()),
    scope: v.optional(RoutineScopeValidator),
    goal: v.optional(v.string()),
    notes: v.optional(v.string()),
    activeDays: v.optional(v.array(DayOfWeekValidator)),
    dayPlans: v.optional(v.array(WorkoutDayPlanValidator)),
  },
  handler: async (ctx, args) => {
    const { planId, ...updates } = args
    await ctx.db.patch(planId, {
      ...updates,
      updatedAt: Date.now(),
    })
    return planId
  },
})

export const deleteWorkoutWeekPlan = mutation({
  args: { planId: v.id('workoutWeekPlans') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.planId)
    return { success: true }
  },
})

export const copyWorkoutWeekPlanToUser = mutation({
  args: {
    planId: v.id('workoutWeekPlans'),
    targetUserId: v.id('users'),
    authorId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) throw new Error('Workout week plan not found')

    const now = Date.now()
    return ctx.db.insert('workoutWeekPlans', {
      name: plan.name,
      userId: args.targetUserId,
      authorId: args.authorId,
      scope: 'single_client',
      goal: plan.goal,
      notes: plan.notes,
      activeDays: plan.activeDays,
      dayPlans: plan.dayPlans,
      createdAt: now,
      updatedAt: now,
    })
  },
})
