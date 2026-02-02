import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * Start a new workout session
 */
export const startSession = mutation({
    args: {
        userId: v.id('users'),
        trainingPlanId: v.optional(v.id('trainingPlans')),
        dayOfWeek: v.union(
            v.literal('mon'),
            v.literal('tue'),
            v.literal('wed'),
            v.literal('thu'),
            v.literal('fri'),
            v.literal('sat'),
            v.literal('sun')
        ),
        exercises: v.array(
            v.object({
                exerciseName: v.string(),
                index: v.number(),
                completed: v.boolean(),
                timeSpent: v.number(),
                sets: v.array(
                    v.object({
                        setIndex: v.number(),
                        reps: v.number(),
                        weight: v.number(),
                        completed: v.boolean(),
                    })
                ),
                notes: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const sessionId = await ctx.db.insert('workoutSessions', {
            userId: args.userId,
            trainingPlanId: args.trainingPlanId,
            dayOfWeek: args.dayOfWeek,
            status: 'ongoing',
            startTime: Date.now(),
            exercises: args.exercises,
            totalTime: 0,
            totalCaloriesBurned: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })
        return sessionId
    },
})

/**
 * Update workout session progress
 */
export const updateSessionProgress = mutation({
    args: {
        sessionId: v.id('workoutSessions'),
        exercises: v.array(
            v.object({
                exerciseName: v.string(),
                index: v.number(),
                completed: v.boolean(),
                timeSpent: v.number(),
                sets: v.array(
                    v.object({
                        setIndex: v.number(),
                        reps: v.number(),
                        weight: v.number(),
                        completed: v.boolean(),
                    })
                ),
                notes: v.optional(v.string()),
            })
        ),
        totalTime: v.number(),
        totalCaloriesBurned: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.sessionId, {
            exercises: args.exercises,
            totalTime: args.totalTime,
            totalCaloriesBurned: args.totalCaloriesBurned,
            updatedAt: Date.now(),
        })
        return args.sessionId
    },
})

/**
 * Complete a workout session
 */
export const completeSession = mutation({
    args: {
        sessionId: v.id('workoutSessions'),
        totalTime: v.number(),
        totalCaloriesBurned: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.sessionId, {
            status: 'completed',
            endTime: Date.now(),
            totalTime: args.totalTime,
            totalCaloriesBurned: args.totalCaloriesBurned,
            updatedAt: Date.now(),
        })
        return args.sessionId
    },
})

/**
 * Cancel a workout session
 */
export const cancelSession = mutation({
    args: {
        sessionId: v.id('workoutSessions'),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.sessionId, {
            status: 'cancelled',
            endTime: Date.now(),
            updatedAt: Date.now(),
        })
        return args.sessionId
    },
})

/**
 * Get current ongoing workout session for user
 */
export const getOngoingSession = query({
    args: {
        userId: v.id('users'),
    },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query('workoutSessions')
            .withIndex('by_user_status', (q) =>
                q.eq('userId', args.userId).eq('status', 'ongoing')
            )
            .collect()

        return sessions.length > 0 ? sessions[0] : null
    },
})

/**
 * Get workout session history for user
 */
export const getSessionHistory = query({
    args: {
        userId: v.id('users'),
        limit: v.number(),
    },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query('workoutSessions')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .order('desc')
            .take(args.limit)

        return sessions
    },
})

/**
 * Get session statistics
 */
export const getSessionStats = query({
    args: {
        userId: v.id('users'),
    },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query('workoutSessions')
            .withIndex('by_user_status', (q) =>
                q.eq('userId', args.userId).eq('status', 'completed')
            )
            .collect()

        const totalSessions = sessions.length
        const totalCalories = sessions.reduce((sum, s) => sum + s.totalCaloriesBurned, 0)
        const totalTime = sessions.reduce((sum, s) => sum + s.totalTime, 0)
        const avgTimePerSession = totalSessions > 0 ? totalTime / totalSessions : 0

        return {
            totalSessions,
            totalCalories,
            totalTime,
            avgTimePerSession,
        }
    },
})
