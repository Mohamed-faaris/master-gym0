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
    durationWeeks: v.optional(v.number()),
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
      durationWeeks: args.durationWeeks,
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
    durationWeeks: v.optional(v.number()),
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
