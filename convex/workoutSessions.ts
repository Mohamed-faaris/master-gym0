import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const DayOfWeekValidator = v.union(
  v.literal('mon'),
  v.literal('tue'),
  v.literal('wed'),
  v.literal('thu'),
  v.literal('fri'),
  v.literal('sat'),
  v.literal('sun'),
)

/**
 * Start a new workout session
 */
export const startSession = mutation({
  args: {
    userId: v.id('users'),
    trainingPlanId: v.optional(v.id('trainingPlans')),
    dayStart: v.number(),
    dayEnd: v.number(),
    dayOfWeek: DayOfWeekValidator,
    exercises: v.optional(
      v.array(
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
    ),
  },
  handler: async (ctx, args) => {
    const existingSession = await ctx.db
      .query('workoutSessions')
      .withIndex('by_user_day', (q) =>
        q.eq('userId', args.userId).eq('dayOfWeek', args.dayOfWeek),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field('startTime'), args.dayStart),
          q.lt(q.field('startTime'), args.dayEnd),
        ),
      )
      .order('desc')
      .first()

    if (existingSession) {
      return existingSession._id
    }

    let exercises = args.exercises

    if (args.trainingPlanId) {
      const trainingPlan = await ctx.db.get(args.trainingPlanId)
      const dayPlan = trainingPlan?.days.find(
        (day) => day.day === args.dayOfWeek,
      )

      if (dayPlan) {
        exercises = dayPlan.exercises.map((exercise) => ({
          exerciseName: exercise.exerciseName,
          noOfSets: exercise.noOfSets,
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            restTime: set.restTime,
            completed: false,
          })),
        }))
      }
    }

    if (!exercises) {
      throw new Error(
        'Workout session requires exercises or a valid training plan day',
      )
    }

    const sessionId = await ctx.db.insert('workoutSessions', {
      userId: args.userId,
      trainingPlanId: args.trainingPlanId,
      dayOfWeek: args.dayOfWeek,
      status: 'ongoing',
      startTime: Date.now(),
      exercises,
      totalTime: 0,
      totalCaloriesBurned: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return sessionId
  },
})

/**
 * Add self-managed exercise to today's workout session.
 * Creates an ongoing session for the day if one does not exist.
 */
export const addSelfManagedExerciseToToday = mutation({
  args: {
    userId: v.id('users'),
    dayOfWeek: DayOfWeekValidator,
    dayStart: v.number(),
    dayEnd: v.number(),
    exerciseName: v.string(),
    sets: v.array(
      v.object({
        reps: v.optional(v.number()),
        weight: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existingSession = await ctx.db
      .query('workoutSessions')
      .withIndex('by_user_day', (q) =>
        q.eq('userId', args.userId).eq('dayOfWeek', args.dayOfWeek),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field('startTime'), args.dayStart),
          q.lt(q.field('startTime'), args.dayEnd),
        ),
      )
      .order('desc')
      .first()

    const now = Date.now()
    const exerciseToAppend = {
      exerciseName: args.exerciseName,
      noOfSets: args.sets.length,
      sets: args.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight,
        completed: false,
      })),
    }

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        exercises: [...existingSession.exercises, exerciseToAppend],
        status: 'ongoing',
        totalTime: existingSession.totalTime,
        totalCaloriesBurned: existingSession.totalCaloriesBurned,
        updatedAt: now,
      })
      return existingSession._id
    }

    const sessionId = await ctx.db.insert('workoutSessions', {
      userId: args.userId,
      trainingPlanId: undefined,
      dayOfWeek: args.dayOfWeek,
      status: 'ongoing',
      startTime: now,
      exercises: [exerciseToAppend],
      totalTime: 0,
      totalCaloriesBurned: 0,
      createdAt: now,
      updatedAt: now,
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
    totalTime: v.number(),
    totalCaloriesBurned: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      exercises: args.exercises,
      totalTime: args.totalTime,
      totalCaloriesBurned: args.totalCaloriesBurned,
      endTime: Date.now(),
      status: 'ongoing',
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
        q.eq('userId', args.userId).eq('status', 'ongoing'),
      )
      .collect()

    return sessions.length > 0 ? sessions[0] : null
  },
})

/**
 * Get latest workout session for a given day
 */
export const getLatestSessionForDay = query({
  args: {
    userId: v.id('users'),
    dayOfWeek: v.optional(DayOfWeekValidator),
    dayStart: v.optional(v.number()),
    dayEnd: v.optional(v.number()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dayStart = args.dayStart ?? args.startTime
    const dayEnd = args.dayEnd ?? args.endTime

    if (dayStart == null || dayEnd == null) {
      throw new Error('Missing dayStart/dayEnd for getLatestSessionForDay')
    }

    const dayOfWeek =
      args.dayOfWeek ??
      (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
        new Date(dayStart).getDay()
      ] as 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')

    const session = await ctx.db
      .query('workoutSessions')
      .withIndex('by_user_day', (q) =>
        q.eq('userId', args.userId).eq('dayOfWeek', dayOfWeek),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field('startTime'), dayStart),
          q.lt(q.field('startTime'), dayEnd),
        ),
      )
      .order('desc')
      .first()

    return session ?? null
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
        q.eq('userId', args.userId).eq('status', 'completed'),
      )
      .collect()

    const totalSessions = sessions.length
    const totalCalories = sessions.reduce(
      (sum, s) => sum + s.totalCaloriesBurned,
      0,
    )
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
