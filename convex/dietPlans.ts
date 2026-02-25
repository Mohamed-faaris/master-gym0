import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { MEAL_TYPES } from './schema'

const DayOfWeekValidator = v.union(
  v.literal('mon'),
  v.literal('tue'),
  v.literal('wed'),
  v.literal('thu'),
  v.literal('fri'),
  v.literal('sat'),
  v.literal('sun'),
)

const MealTypeValidator = v.union(...MEAL_TYPES.map(v.literal))

const MealTemplateValidator = v.object({
  day: DayOfWeekValidator,
  mealType: MealTypeValidator,
  title: v.string(),
  description: v.string(),
  calories: v.number(),
})

export const createDietPlan = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    goal: v.optional(v.string()),
    durationDays: v.optional(v.number()),
    activeDays: v.array(DayOfWeekValidator),
    dailyCalorieTarget: v.optional(v.number()),
    hydrationTarget: v.optional(v.string()),
    coachNote: v.optional(v.string()),
    mealTemplate: v.array(MealTemplateValidator),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const dietPlanId = await ctx.db.insert('dietPlans', {
      name: args.name,
      description: args.description,
      goal: args.goal,
      durationDays: args.durationDays,
      activeDays: args.activeDays,
      dailyCalorieTarget: args.dailyCalorieTarget,
      hydrationTarget: args.hydrationTarget,
      coachNote: args.coachNote,
      mealTemplate: args.mealTemplate,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    })

    return dietPlanId
  },
})

export const getDietPlansByUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const dietPlans = await ctx.db
      .query('dietPlans')
      .withIndex('by_creator', (q) => q.eq('createdBy', args.userId))
      .order('desc')
      .collect()

    return dietPlans
  },
})

export const getDietPlanById = query({
  args: {
    dietPlanId: v.id('dietPlans'),
  },
  handler: async (ctx, args) => {
    const dietPlan = await ctx.db.get(args.dietPlanId)
    return dietPlan
  },
})

export const updateDietPlan = mutation({
  args: {
    dietPlanId: v.id('dietPlans'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    goal: v.optional(v.string()),
    durationDays: v.optional(v.number()),
    activeDays: v.optional(v.array(DayOfWeekValidator)),
    dailyCalorieTarget: v.optional(v.number()),
    hydrationTarget: v.optional(v.string()),
    coachNote: v.optional(v.string()),
    mealTemplate: v.optional(v.array(MealTemplateValidator)),
  },
  handler: async (ctx, args) => {
    const { dietPlanId, ...updates } = args

    await ctx.db.patch(dietPlanId, {
      ...updates,
      updatedAt: Date.now(),
    })

    return dietPlanId
  },
})

export const deleteDietPlan = mutation({
  args: {
    dietPlanId: v.id('dietPlans'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.dietPlanId)
    return { success: true }
  },
})

// Assign diet plan to user
export const assignDietPlanToUser = mutation({
  args: {
    userId: v.id('users'),
    dietPlanId: v.id('dietPlans'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      dietPlanId: args.dietPlanId,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Unassign diet plan from user
export const unassignDietPlanFromUser = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      dietPlanId: undefined,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

export const backfillDietPlanMealDays = mutation({
  args: {},
  handler: async (ctx) => {
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    const plans = await ctx.db.query('dietPlans').collect()

    let updatedCount = 0

    for (const plan of plans) {
      const hasMissingDay = plan.mealTemplate.some(
        (meal) => !('day' in meal) || !meal.day,
      )

      if (!hasMissingDay) continue

      const activeDays =
        plan.activeDays && plan.activeDays.length > 0
          ? plan.activeDays
          : dayOrder

      const updatedMeals = plan.mealTemplate.flatMap((meal) => {
        if (meal.day) return [meal]
        return activeDays.map((day) => ({
          ...meal,
          day,
        }))
      })

      await ctx.db.patch(plan._id, {
        mealTemplate: updatedMeals,
        updatedAt: Date.now(),
      })

      updatedCount++
    }

    return { updatedCount }
  },
})

export const migrateDurationWeeksToDays = mutation({
  args: {},
  handler: async (ctx) => {
    const dietPlans = await ctx.db.query('dietPlans').collect()
    const trainingPlans = await ctx.db.query('trainingPlans').collect()
    const userMeasurements = await ctx.db.query('userMeasurement').collect()

    let dietPlanCount = 0
    let trainingPlanCount = 0
    let measurementCount = 0

    for (const plan of dietPlans) {
      const weeks = (plan as any).durationWeeks
      if (weeks !== undefined) {
        await ctx.db.patch(plan._id, {
          durationDays: weeks * 7,
          updatedAt: Date.now(),
        })
        dietPlanCount++
      }
    }

    for (const plan of trainingPlans) {
      const weeks = (plan as any).durationWeeks
      if (weeks !== undefined) {
        await ctx.db.patch(plan._id, {
          durationDays: weeks * 7,
          updatedAt: Date.now(),
        })
        trainingPlanCount++
      }
    }

    for (const measurement of userMeasurements) {
      const weeks = (measurement as any).timeSpanWeeks
      if (weeks !== undefined) {
        await ctx.db.patch(measurement._id, {
          timeSpanDays: weeks * 7,
          updatedAt: Date.now(),
        })
        measurementCount++
      }
    }

    return { dietPlanCount, trainingPlanCount, measurementCount }
  },
})
