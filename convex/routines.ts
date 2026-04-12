import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const RoutineTypeValidator = v.union(v.literal('custom'), v.literal('trainer'))

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

// Create a routine
export const createRoutine = mutation({
  args: {
    name: v.string(),
    userId: v.optional(v.id('users')), // null for global/trainer's generic routines
    authorId: v.id('users'),
    type: RoutineTypeValidator,
    dayOfWeek: v.optional(v.union(
      v.literal('mon'), v.literal('tue'), v.literal('wed'),
      v.literal('thu'), v.literal('fri'), v.literal('sat'), v.literal('sun')
    )),
    focus: v.optional(v.string()),
    exercises: v.array(RoutineExerciseValidator),
  },
  handler: async (ctx, args) => {
    const routineId = await ctx.db.insert('routines', {
      name: args.name,
      userId: args.userId,
      authorId: args.authorId,
      type: args.type,
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
    return ctx.db
      .query('routines')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
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
    dayOfWeek: v.optional(v.union(
      v.literal('mon'), v.literal('tue'), v.literal('wed'),
      v.literal('thu'), v.literal('fri'), v.literal('sat'), v.literal('sun')
    )),
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

export const copyRoutineFromTrainer = mutation({
  args: {
    routineId: v.id('routines'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const routine = await ctx.db.get(args.routineId)
    if (!routine) throw new Error('Routine not found')
    
    // We create a new custom routine for the user copying all data
    const newRoutineId = await ctx.db.insert('routines', {
      name: routine.name,
      userId: args.userId,
      authorId: routine.authorId,
      type: 'custom',
      dayOfWeek: routine.dayOfWeek,
      focus: routine.focus,
      exercises: routine.exercises,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newRoutineId
  },
})
