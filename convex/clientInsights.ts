import { query } from './_generated/server'
import { v } from 'convex/values'

export const getClientRangeData = query({
  args: {
    userId: v.id('users'),
    rangeStart: v.number(),
    rangeEnd: v.number(),
    previousStart: v.number(),
    previousEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const minStart = Math.min(args.rangeStart, args.previousStart)
    const maxEnd = Math.max(args.rangeEnd, args.previousEnd)

    const [workouts, dietLogs, weightLogs] = await Promise.all([
      ctx.db
        .query('workoutSessions')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .filter((q) =>
          q.and(
            q.gte(q.field('startTime'), minStart),
            q.lte(q.field('startTime'), maxEnd),
          ),
        )
        .collect(),
      ctx.db
        .query('dietLogs')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .filter((q) =>
          q.and(
            q.gte(q.field('createdAt'), minStart),
            q.lte(q.field('createdAt'), maxEnd),
          ),
        )
        .collect(),
      ctx.db
        .query('weightLogs')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .filter((q) =>
          q.and(
            q.gte(q.field('createdAt'), minStart),
            q.lte(q.field('createdAt'), maxEnd),
          ),
        )
        .collect(),
    ])

    const splitByRange = <T extends { createdAt?: number; startTime?: number }>(
      items: T[],
      timestampKey: 'createdAt' | 'startTime',
    ) => {
      const current: T[] = []
      const previous: T[] = []

      for (const item of items) {
        const ts = item[timestampKey] ?? 0
        if (ts >= args.rangeStart && ts <= args.rangeEnd) {
          current.push(item)
        } else if (ts >= args.previousStart && ts <= args.previousEnd) {
          previous.push(item)
        }
      }

      return { current, previous }
    }

    const workoutSplit = splitByRange(workouts, 'startTime')
    const dietSplit = splitByRange(dietLogs, 'createdAt')
    const weightSplit = splitByRange(weightLogs, 'createdAt')

    return {
      current: {
        workouts: workoutSplit.current,
        dietLogs: dietSplit.current,
        weightLogs: weightSplit.current,
      },
      previous: {
        workouts: workoutSplit.previous,
        dietLogs: dietSplit.previous,
        weightLogs: weightSplit.previous,
      },
    }
  },
})
