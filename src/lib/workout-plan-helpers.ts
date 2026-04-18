import type { Id } from '@convex/_generated/dataModel'

export const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
] as const

export type DayKey = (typeof DAYS_OF_WEEK)[number]['value']

export type RoutineSet = {
  reps?: number
  weight?: number
  restTime?: number
}

export type RoutineExercise = {
  exerciseId?: Id<'exercises'>
  exerciseName: string
  supersetGroupId?: string
  sets: Array<RoutineSet>
}

export type WorkoutDayPlan = {
  day: DayKey
  focus?: string
  exercises: Array<RoutineExercise>
}

export const cloneExercises = (exercises: Array<RoutineExercise>) =>
  exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set })),
  }))

export const normalizeExerciseGroups = (exercises: Array<RoutineExercise>) => {
  const normalized = cloneExercises(exercises)
  let index = 0

  while (index < normalized.length) {
    const groupId = normalized[index].supersetGroupId
    if (!groupId) {
      normalized[index].supersetGroupId = undefined
      index += 1
      continue
    }

    let endIndex = index + 1
    while (
      endIndex < normalized.length &&
      normalized[endIndex].supersetGroupId === groupId
    ) {
      endIndex += 1
    }

    if (endIndex - index < 2) {
      normalized[index].supersetGroupId = undefined
      index = endIndex
      continue
    }

    const normalizedGroupId = crypto.randomUUID()
    for (let current = index; current < endIndex; current += 1) {
      normalized[current].supersetGroupId = normalizedGroupId
    }
    index = endIndex
  }

  return normalized
}

export const splitExerciseGroupAt = (
  exercises: Array<RoutineExercise>,
  exerciseIndex: number,
) => {
  const updated = cloneExercises(exercises)
  const sharedGroupId = updated[exerciseIndex].supersetGroupId
  if (!sharedGroupId) return updated

  let groupStart = exerciseIndex
  while (
    groupStart > 0 &&
    updated[groupStart - 1].supersetGroupId === sharedGroupId
  ) {
    groupStart -= 1
  }

  let groupEnd = exerciseIndex + 1
  while (
    groupEnd < updated.length - 1 &&
    updated[groupEnd + 1].supersetGroupId === sharedGroupId
  ) {
    groupEnd += 1
  }

  const leftSize = exerciseIndex - groupStart + 1
  const rightSize = groupEnd - exerciseIndex
  const leftGroupId = leftSize >= 2 ? crypto.randomUUID() : undefined
  const rightGroupId = rightSize >= 2 ? crypto.randomUUID() : undefined

  for (let current = groupStart; current <= exerciseIndex; current += 1) {
    updated[current].supersetGroupId = leftGroupId
  }
  for (let current = exerciseIndex + 1; current <= groupEnd; current += 1) {
    updated[current].supersetGroupId = rightGroupId
  }

  return updated
}

export const mergeExerciseGroupsAt = (
  exercises: Array<RoutineExercise>,
  exerciseIndex: number,
) => {
  const updated = cloneExercises(exercises)
  const leftGroupId = updated[exerciseIndex].supersetGroupId
  const rightGroupId = updated[exerciseIndex + 1].supersetGroupId
  const mergedGroupId = leftGroupId ?? rightGroupId ?? crypto.randomUUID()

  if (leftGroupId) {
    for (const exercise of updated) {
      if (exercise.supersetGroupId === leftGroupId) {
        exercise.supersetGroupId = mergedGroupId
      }
    }
  }

  if (rightGroupId) {
    for (const exercise of updated) {
      if (exercise.supersetGroupId === rightGroupId) {
        exercise.supersetGroupId = mergedGroupId
      }
    }
  }

  updated[exerciseIndex].supersetGroupId = mergedGroupId
  updated[exerciseIndex + 1].supersetGroupId = mergedGroupId
  return normalizeExerciseGroups(updated)
}

export const hasGroupedNeighbor = (
  exercises: Array<RoutineExercise>,
  exerciseIndex: number,
) =>
  exerciseIndex < exercises.length - 1 &&
  !!exercises[exerciseIndex].supersetGroupId &&
  exercises[exerciseIndex].supersetGroupId ===
    exercises[exerciseIndex + 1]?.supersetGroupId

export const getGroupedExerciseCount = (
  exercises: Array<RoutineExercise>,
  groupId?: string,
) => exercises.filter((exercise) => exercise.supersetGroupId === groupId).length

export const createEmptyWorkoutDayPlans = (activeDays: Array<DayKey>) =>
  activeDays.map((day) => ({
    day,
    focus: '',
    exercises: [],
  }))

export const ensureWorkoutDayPlans = (
  activeDays: Array<DayKey>,
  dayPlans: Array<WorkoutDayPlan>,
) =>
  activeDays.map((day) => {
    const existing = dayPlans.find((entry) => entry.day === day)
    return existing
      ? {
          ...existing,
          exercises: cloneExercises(existing.exercises),
        }
      : {
          day,
          focus: '',
          exercises: [],
        }
  })
