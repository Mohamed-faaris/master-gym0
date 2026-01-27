// Mock data for the fitness app

export interface Exercise {
  name: string
  sets: number
  reps: number
  weight: number
  notes?: string
}

export interface WorkoutDay {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  name: string
  exercises: Exercise[]
  duration: number // in minutes
  caloriesBurned: number
}

export interface TrainingPlan {
  id: string
  name: string
  description: string
  weeks: WorkoutDay[]
}

export const TRAINING_PLAN: TrainingPlan = {
  id: '1',
  name: '6-Week Strength Training',
  description: 'Beginner to intermediate strength training program',
  weeks: [
    {
      day: 'mon',
      name: 'Leg Day 1',
      duration: 60,
      caloriesBurned: 350,
      exercises: [
        {
          name: 'Squats',
          sets: 4,
          reps: 10,
          weight: 135,
          notes: 'Warm up properly',
        },
        { name: 'Leg Press', sets: 3, reps: 12, weight: 200 },
        { name: 'Lunges', sets: 3, reps: 10, weight: 30 },
        { name: 'Leg Curls', sets: 3, reps: 12, weight: 70 },
        { name: 'Calf Raises', sets: 4, reps: 15, weight: 100 },
      ],
    },
    {
      day: 'tue',
      name: 'Rest Day',
      duration: 0,
      caloriesBurned: 0,
      exercises: [],
    },
    {
      day: 'wed',
      name: 'Chest & Triceps',
      duration: 55,
      caloriesBurned: 320,
      exercises: [
        {
          name: 'Bench Press',
          sets: 4,
          reps: 10,
          weight: 155,
          notes: 'Focus on form',
        },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 12, weight: 50 },
        { name: 'Chest Flyes', sets: 3, reps: 12, weight: 30 },
        {
          name: 'Tricep Dips',
          sets: 3,
          reps: 10,
          weight: 0,
          notes: 'Bodyweight',
        },
        { name: 'Tricep Pushdowns', sets: 3, reps: 12, weight: 50 },
      ],
    },
    {
      day: 'thu',
      name: 'Back & Biceps',
      duration: 60,
      caloriesBurned: 340,
      exercises: [
        {
          name: 'Deadlifts',
          sets: 4,
          reps: 8,
          weight: 185,
          notes: 'Keep back straight',
        },
        {
          name: 'Pull-ups',
          sets: 3,
          reps: 8,
          weight: 0,
          notes: 'Assisted if needed',
        },
        { name: 'Barbell Rows', sets: 3, reps: 10, weight: 115 },
        { name: 'Lat Pulldowns', sets: 3, reps: 12, weight: 120 },
        { name: 'Bicep Curls', sets: 3, reps: 12, weight: 35 },
        { name: 'Hammer Curls', sets: 3, reps: 12, weight: 30 },
      ],
    },
    {
      day: 'fri',
      name: 'Shoulder Day 1',
      duration: 50,
      caloriesBurned: 300,
      exercises: [
        { name: 'Overhead Press', sets: 4, reps: 10, weight: 95 },
        { name: 'Lateral Raises', sets: 3, reps: 15, weight: 20 },
        { name: 'Front Raises', sets: 3, reps: 15, weight: 20 },
        { name: 'Rear Delt Flyes', sets: 3, reps: 15, weight: 15 },
        { name: 'Shrugs', sets: 3, reps: 15, weight: 60 },
      ],
    },
    {
      day: 'sat',
      name: 'Leg Day 2',
      duration: 55,
      caloriesBurned: 360,
      exercises: [
        { name: 'Romanian Deadlifts', sets: 4, reps: 10, weight: 135 },
        { name: 'Bulgarian Split Squats', sets: 3, reps: 10, weight: 40 },
        { name: 'Leg Extensions', sets: 3, reps: 12, weight: 90 },
        { name: 'Seated Leg Curls', sets: 3, reps: 12, weight: 80 },
        { name: 'Hip Thrusts', sets: 3, reps: 12, weight: 155 },
      ],
    },
    {
      day: 'sun',
      name: 'Active Recovery',
      duration: 30,
      caloriesBurned: 150,
      exercises: [
        {
          name: 'Light Cardio',
          sets: 1,
          reps: 30,
          weight: 0,
          notes: '30 min walk or bike',
        },
        {
          name: 'Stretching',
          sets: 1,
          reps: 15,
          weight: 0,
          notes: 'Full body stretch',
        },
      ],
    },
  ],
}

export interface WorkoutLog {
  id: string
  startTime: Date
  endTime: Date | null
  status: 'ongoing' | 'completed' | 'cancelled'
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'balance'
  duration: number
  caloriesBurned: number
}

export interface DietLog {
  id: string
  createdAt: Date
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  description: string
  calories: number
}

export interface WeightLog {
  id: string
  createdAt: Date
  weight: number
}

// Mock workout logs
export const MOCK_WORKOUT_LOGS: WorkoutLog[] = [
  {
    id: '1',
    startTime: new Date(2026, 0, 27, 9, 0),
    endTime: new Date(2026, 0, 27, 10, 0),
    status: 'completed',
    workoutType: 'strength',
    duration: 60,
    caloriesBurned: 350,
  },
  {
    id: '2',
    startTime: new Date(2026, 0, 25, 10, 0),
    endTime: new Date(2026, 0, 25, 11, 0),
    status: 'completed',
    workoutType: 'strength',
    duration: 60,
    caloriesBurned: 340,
  },
  {
    id: '3',
    startTime: new Date(2026, 0, 24, 8, 0),
    endTime: new Date(2026, 0, 24, 9, 0),
    status: 'completed',
    workoutType: 'strength',
    duration: 55,
    caloriesBurned: 320,
  },
  {
    id: '4',
    startTime: new Date(2026, 0, 22, 9, 0),
    endTime: new Date(2026, 0, 22, 10, 0),
    status: 'completed',
    workoutType: 'strength',
    duration: 60,
    caloriesBurned: 350,
  },
  {
    id: '5',
    startTime: new Date(2026, 0, 21, 7, 0),
    endTime: new Date(2026, 0, 21, 7, 30),
    status: 'completed',
    workoutType: 'cardio',
    duration: 30,
    caloriesBurned: 200,
  },
]

// Mock diet logs
export const MOCK_DIET_LOGS: DietLog[] = [
  {
    id: '1',
    createdAt: new Date(2026, 0, 28, 8, 0),
    mealType: 'breakfast',
    description: 'Oatmeal with berries and protein shake',
    calories: 450,
  },
  {
    id: '2',
    createdAt: new Date(2026, 0, 28, 12, 30),
    mealType: 'lunch',
    description: 'Grilled chicken salad with quinoa',
    calories: 550,
  },
  {
    id: '3',
    createdAt: new Date(2026, 0, 28, 15, 0),
    mealType: 'snack',
    description: 'Apple and almond butter',
    calories: 200,
  },
  {
    id: '4',
    createdAt: new Date(2026, 0, 27, 8, 30),
    mealType: 'breakfast',
    description: 'Eggs, toast, and avocado',
    calories: 500,
  },
  {
    id: '5',
    createdAt: new Date(2026, 0, 27, 13, 0),
    mealType: 'lunch',
    description: 'Turkey wrap with vegetables',
    calories: 480,
  },
  {
    id: '6',
    createdAt: new Date(2026, 0, 27, 19, 0),
    mealType: 'dinner',
    description: 'Salmon with roasted vegetables',
    calories: 650,
  },
]

// Mock weight logs
export const MOCK_WEIGHT_LOGS: WeightLog[] = [
  { id: '1', createdAt: new Date(2026, 0, 28), weight: 180.5 },
  { id: '2', createdAt: new Date(2026, 0, 21), weight: 181.2 },
  { id: '3', createdAt: new Date(2026, 0, 14), weight: 182.0 },
  { id: '4', createdAt: new Date(2026, 0, 7), weight: 182.8 },
  { id: '5', createdAt: new Date(2025, 11, 31), weight: 183.5 },
  { id: '6', createdAt: new Date(2025, 11, 24), weight: 184.0 },
]

// Today's stats (for dashboard)
export const TODAY_STATS = {
  caloriesBurned: 350,
  workoutTime: 60,
  goals: {
    calories: { current: 350, target: 500 },
    workoutTime: { current: 60, target: 90 },
    steps: { current: 8500, target: 10000 },
  },
}
