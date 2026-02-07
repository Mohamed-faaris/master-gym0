import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { MEAL_TYPES } from './schema'

const MealTypeValidator = v.union(...MEAL_TYPES.map(v.literal))

// Add a diet log
export const addDietLog = mutation({
  args: {
    userId: v.id('users'),
    mealType: MealTypeValidator,
    title: v.string(),
    description: v.string(),
    calories: v.optional(v.number()),
    imageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const dietLogId = await ctx.db.insert('dietLogs', {
      userId: args.userId,
      mealType: args.mealType,
      title: args.title,
      description: args.description,
      ...(args.calories === undefined ? {} : { calories: args.calories }),
      imageId: args.imageId,
      createdAt: now,
    })

    return dietLogId
  },
})

// Get diet logs by user
export const getDietLogsByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('dietLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')

    const dietLogs = args.limit
      ? await query.take(args.limit)
      : await query.collect()

    return dietLogs
  },
})

// Get diet log history with pagination
export const getDietLogsHistory = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10

    let query = ctx.db
      .query('dietLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')

    if (args.cursor !== undefined) {
      query = query.filter((q) => q.lt(q.field('createdAt'), args.cursor!))
    }

    const logs = await query.take(limit)

    const logsWithUrl = await Promise.all(
      logs.map(async (log) => ({
        ...log,
        imageUrl: log.imageId ? await ctx.storage.getUrl(log.imageId) : null,
      })),
    )

    const nextCursor =
      logs.length === limit ? logs[logs.length - 1].createdAt : null

    return {
      logs: logsWithUrl,
      nextCursor,
    }
  },
})

// Get diet logs for today
export const getTodayDietLogs = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    const dietLogs = await ctx.db
      .query('dietLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('createdAt'), todayTimestamp))
      .collect()

    return dietLogs
  },
})

// Get calories consumed today
export const getTodayCalories = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    const dietLogs = await ctx.db
      .query('dietLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('createdAt'), todayTimestamp))
      .collect()

    const totalCalories = dietLogs.reduce(
      (sum, log) => sum + (log.calories || 0),
      0,
    )

    return {
      totalCalories,
      logs: dietLogs,
    }
  },
})

// Delete a diet log
export const deleteDietLog = mutation({
  args: {
    dietLogId: v.id('dietLogs'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.dietLogId)
    if (existing?.imageId) {
      await ctx.storage.delete(existing.imageId)
    }
    await ctx.db.delete(args.dietLogId)
    return { success: true }
  },
})

// Update a diet log
export const updateDietLog = mutation({
  args: {
    dietLogId: v.id('dietLogs'),
    mealType: v.optional(MealTypeValidator),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    calories: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { dietLogId, ...updates } = args

    await ctx.db.patch(dietLogId, updates)

    return dietLogId
  },
})

// Get diet stats for a user
export const getDietStats = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const dietLogs = await ctx.db
      .query('dietLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const totalLogs = dietLogs.length
    const totalCalories = dietLogs.reduce(
      (sum, log) => sum + (log.calories || 0),
      0,
    )
    const averageCalories = totalLogs > 0 ? totalCalories / totalLogs : 0

    return {
      totalLogs,
      totalCalories,
      averageCalories,
    }
  },
})
