import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const RoutineTypeValidator = v.union(v.literal('custom'), v.literal('trainer'))
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

const compareRoutineFreshness = (
  a: { updatedAt: number; createdAt: number },
  b: { updatedAt: number; createdAt: number },
) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)

const resolveRoutineScope = (routine: {
  scope?: string
  userId?: unknown
  type?: string
}) => {
  if (
    routine.scope === 'all' ||
    routine.scope === 'trainer_clients' ||
    routine.scope === 'single_client'
  ) {
    return routine.scope
  }

  if (routine.userId) {
    return 'single_client'
  }

  return routine.type === 'trainer' ? 'trainer_clients' : 'all'
}

// Create a routine
export const createRoutine = mutation({
  args: {
    name: v.string(),
    userId: v.optional(v.id('users')),
    authorId: v.id('users'),
    type: RoutineTypeValidator,
    scope: RoutineScopeValidator,
    dayOfWeek: v.optional(DayOfWeekValidator),
    focus: v.optional(v.string()),
    exercises: v.array(RoutineExerciseValidator),
  },
  handler: async (ctx, args) => {
    const routineId = await ctx.db.insert('routines', {
      name: args.name,
      userId: args.userId,
      authorId: args.authorId,
      type: args.type,
      scope: args.scope,
      dayOfWeek: args.dayOfWeek,
      focus: args.focus,
      exercises: args.exercises,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return routineId
  },
})

export const getRoutinesByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const routines = await ctx.db
      .query('routines')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    return routines
      .filter((routine) => resolveRoutineScope(routine) === 'single_client')
      .sort(compareRoutineFreshness)
  },
})

export const getPremadeRoutinesForUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return []
    }

    const routines = await ctx.db.query('routines').collect()

    return routines
      .filter((routine) => {
        const scope = resolveRoutineScope(routine)
        if (scope === 'all') {
          return true
        }

        if (scope === 'trainer_clients') {
          return !!user.trainerId && routine.authorId === user.trainerId
        }

        return false
      })
      .sort(compareRoutineFreshness)
  },
})

export const getReusableRoutinesByAuthor = query({
  args: { authorId: v.id('users') },
  handler: async (ctx, args) => {
    const routines = await ctx.db
      .query('routines')
      .withIndex('by_author', (q) => q.eq('authorId', args.authorId))
      .collect()

    return routines
      .filter((routine) => {
        const scope = resolveRoutineScope(routine)
        return scope === 'trainer_clients' || scope === 'all'
      })
      .sort(compareRoutineFreshness)
  },
})

export const getRoutinesByAuthor = query({
  args: { authorId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('routines')
      .withIndex('by_author', (q) => q.eq('authorId', args.authorId))
      .order('desc')
      .collect()
  },
})

export const getRoutineById = query({
  args: { routineId: v.id('routines') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.routineId)
  },
})

export const updateRoutine = mutation({
  args: {
    routineId: v.id('routines'),
    name: v.optional(v.string()),
    scope: v.optional(RoutineScopeValidator),
    dayOfWeek: v.optional(DayOfWeekValidator),
    focus: v.optional(v.string()),
    exercises: v.optional(v.array(RoutineExerciseValidator)),
  },
  handler: async (ctx, args) => {
    const { routineId, ...updates } = args
    await ctx.db.patch(routineId, { ...updates, updatedAt: Date.now() })
    return routineId
  },
})

export const deleteRoutine = mutation({
  args: { routineId: v.id('routines') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.routineId)
    return { success: true }
  },
})

export const copyRoutineToUser = mutation({
  args: {
    routineId: v.id('routines'),
    targetUserId: v.id('users'),
    authorId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const routine = await ctx.db.get(args.routineId)
    if (!routine) throw new Error('Routine not found')

    const newRoutineId = await ctx.db.insert('routines', {
      name: routine.name,
      userId: args.targetUserId,
      authorId: args.authorId,
      type: 'custom',
      scope: 'single_client',
      dayOfWeek: routine.dayOfWeek,
      focus: routine.focus,
      exercises: routine.exercises,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newRoutineId
  },
})
