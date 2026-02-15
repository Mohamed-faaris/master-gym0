import { mutation } from './_generated/server'

// Seed script to populate the database with sample data
export const seedDatabase = mutation({
  handler: async (ctx) => {
    const now = Date.now()

    // Create admin user
    const adminId = await ctx.db.insert('users', {
      name: 'Admin User',
      phoneNumber: '1000000000',
      email: 'admin@gym.com',
      pin: '1234',
      role: 'admin',
      goal: 'generalFitness',
      createdAt: now,
      updatedAt: now,
    })

    // Create trainer user
    const trainerId = await ctx.db.insert('users', {
      name: 'Arjun Murthy',
      phoneNumber: '1111111111',
      email: 'trainer@gym.com',
      pin: '1234',
      role: 'trainer',
      goal: 'generalFitness',
      createdAt: now,
      updatedAt: now,
    })

    // Create trainer user meta
    await ctx.db.insert('userMeta', {
      userId: trainerId,
      age: 30,
      gender: 'Male',
      height: 180,
      focusArea: 'Strength Training',
      progressPercent: 85,
      accentColor: '#3b82f6',
      currentWeight: 80,
      targetWeight: 80,
      createdAt: now,
      updatedAt: now,
    })

    // Create client users
    const client1Id = await ctx.db.insert('users', {
      name: 'Priya Selvaraj',
      phoneNumber: '2222222222',
      email: 'priya@example.com',
      pin: '1234',
      role: 'trainerManagedCustomer',
      goal: 'weightLoss',
      trainerId: trainerId,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('userMeta', {
      userId: client1Id,
      age: 28,
      gender: 'Female',
      height: 165,
      focusArea: 'Weight Loss',
      progressPercent: 45,
      readinessNote: 'Ready to train hard!',
      accentColor: '#ec4899',
      currentWeight: 72,
      targetWeight: 65,
      emergencyContactName: 'Rajesh Selvaraj',
      emergencyContactPhone: '9999999991',
      createdAt: now,
      updatedAt: now,
    })

    const client2Id = await ctx.db.insert('users', {
      name: 'Vikram Krishnan',
      phoneNumber: '3333333333',
      email: 'vikram@example.com',
      pin: '1234',
      role: 'trainerManagedCustomer',
      goal: 'muscleGain',
      trainerId: trainerId,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('userMeta', {
      userId: client2Id,
      age: 25,
      gender: 'Male',
      height: 175,
      focusArea: 'Muscle Building',
      progressPercent: 60,
      readinessNote: 'Feeling strong!',
      accentColor: '#10b981',
      currentWeight: 75,
      targetWeight: 85,
      emergencyContactName: 'Deepa Krishnan',
      emergencyContactPhone: '9999999992',
      createdAt: now,
      updatedAt: now,
    })

    const client3Id = await ctx.db.insert('users', {
      name: 'Anjali Iyer',
      phoneNumber: '4444444444',
      email: 'anjali@example.com',
      pin: '1234',
      role: 'selfManagedCustomer',
      goal: 'endurance',
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('userMeta', {
      userId: client3Id,
      age: 32,
      gender: 'Female',
      height: 170,
      focusArea: 'Cardio & Endurance',
      progressPercent: 70,
      accentColor: '#f59e0b',
      currentWeight: 68,
      targetWeight: 62,
      emergencyContactName: 'Karthik Iyer',
      emergencyContactPhone: '9999999993',
      createdAt: now,
      updatedAt: now,
    })

    // Create training plans
    const strengthPlanId = await ctx.db.insert('trainingPlans', {
      name: 'Beginner Strength Training',
      description:
        'A comprehensive 8-week strength training program for beginners',
      durationWeeks: 8,
      isCopy: false,
      isAssigned: false,
      days: [
        {
          day: 'mon',
          exercises: [
            {
              exerciseName: 'Barbell Bench Press',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 60 },
                { reps: 8, weight: 70 },
                { reps: 6, weight: 80 },
              ],
            },
            {
              exerciseName: 'Barbell Squat',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 80 },
                { reps: 8, weight: 90 },
                { reps: 6, weight: 100 },
              ],
            },
            {
              exerciseName: 'Lat Pulldown',
              noOfSets: 3,
              sets: [
                { reps: 12, weight: 50 },
                { reps: 10, weight: 55 },
                { reps: 8, weight: 60 },
              ],
            },
          ],
        },
        {
          day: 'tue',
          exercises: [
            {
              exerciseName: 'Incline Dumbbell Press',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 25 },
                { reps: 8, weight: 30 },
                { reps: 6, weight: 35 },
              ],
            },
            {
              exerciseName: 'Dumbbell Rows',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 30 },
                { reps: 8, weight: 35 },
                { reps: 6, weight: 40 },
              ],
            },
            {
              exerciseName: 'Leg Curls',
              noOfSets: 3,
              sets: [
                { reps: 12, weight: 40 },
                { reps: 10, weight: 50 },
                { reps: 8, weight: 60 },
              ],
            },
          ],
        },
        {
          day: 'wed',
          exercises: [
            {
              exerciseName: 'Deadlift',
              noOfSets: 3,
              sets: [
                { reps: 8, weight: 100 },
                { reps: 6, weight: 110 },
                { reps: 4, weight: 120 },
              ],
            },
            {
              exerciseName: 'Barbell Overhead Press',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 40 },
                { reps: 8, weight: 45 },
                { reps: 6, weight: 50 },
              ],
            },
            {
              exerciseName: 'Bent-Over Barbell Row',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 60 },
                { reps: 8, weight: 70 },
                { reps: 6, weight: 75 },
              ],
            },
          ],
        },
        {
          day: 'thu',
          exercises: [
            {
              exerciseName: 'Leg Press',
              noOfSets: 4,
              sets: [
                { reps: 12, weight: 150 },
                { reps: 10, weight: 170 },
                { reps: 8, weight: 190 },
                { reps: 6, weight: 200 },
              ],
            },
            {
              exerciseName: 'Cable Flyes',
              noOfSets: 3,
              sets: [
                { reps: 12, weight: 25 },
                { reps: 10, weight: 30 },
                { reps: 8, weight: 35 },
              ],
            },
            {
              exerciseName: 'Barbell Curls',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 30 },
                { reps: 8, weight: 35 },
                { reps: 6, weight: 40 },
              ],
            },
          ],
        },
        {
          day: 'fri',
          exercises: [
            {
              exerciseName: 'Leg Press',
              noOfSets: 4,
              sets: [
                { reps: 12, weight: 150 },
                { reps: 10, weight: 170 },
                { reps: 8, weight: 190 },
                { reps: 6, weight: 200 },
              ],
            },
            {
              exerciseName: 'Incline Dumbbell Press',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 25 },
                { reps: 8, weight: 30 },
                { reps: 6, weight: 35 },
              ],
            },
            {
              exerciseName: 'Cable Triceps Pushdown',
              noOfSets: 3,
              sets: [
                { reps: 12, weight: 30 },
                { reps: 10, weight: 35 },
                { reps: 8, weight: 40 },
              ],
            },
          ],
        },
        {
          day: 'sat',
          exercises: [
            {
              exerciseName: 'Smith Machine Squat',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 90 },
                { reps: 8, weight: 100 },
                { reps: 6, weight: 110 },
              ],
            },
            {
              exerciseName: 'Dumbbell Press',
              noOfSets: 3,
              sets: [
                { reps: 10, weight: 30 },
                { reps: 8, weight: 35 },
                { reps: 6, weight: 40 },
              ],
            },
            {
              exerciseName: 'Machine Chest Press',
              noOfSets: 3,
              sets: [
                { reps: 12, weight: 60 },
                { reps: 10, weight: 70 },
                { reps: 8, weight: 80 },
              ],
            },
          ],
        },
        {
          day: 'sun',
          exercises: [
            {
              exerciseName: 'Light Cardio - Treadmill',
              noOfSets: 1,
              sets: [
                { notes: '30 minutes at moderate pace' },
              ],
            },
            {
              exerciseName: 'Stretching & Flexibility',
              noOfSets: 1,
              sets: [
                { notes: '20 minutes full body stretch' },
              ],
            },
          ],
        },
      ],
      createdBy: trainerId,
      createdAt: now,
      updatedAt: now,
    })

    const cardioEndurancePlanId = await ctx.db.insert('trainingPlans', {
      name: 'Cardio & Endurance Builder',
      description: '6-week cardio and endurance focused training program',
      durationWeeks: 6,
      isCopy: false,
      isAssigned: false,
      days: [
        {
          day: 'mon',
          exercises: [
            {
              exerciseName: 'Treadmill Running',
              noOfSets: 1,
              sets: [{ notes: '30 minutes steady state' }],
            },
            {
              exerciseName: 'Burpees',
              noOfSets: 3,
              sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }],
            },
          ],
        },
        {
          day: 'tue',
          exercises: [
            {
              exerciseName: 'Walking Lunges',
              noOfSets: 4,
              sets: [
                { reps: 20, notes: 'Each leg' },
                { reps: 20, notes: 'Each leg' },
                { reps: 20, notes: 'Each leg' },
                { reps: 20, notes: 'Each leg' },
              ],
            },
            {
              exerciseName: 'Plank',
              noOfSets: 3,
              sets: [
                { notes: '30 seconds' },
                { notes: '45 seconds' },
                { notes: '60 seconds' },
              ],
            },
          ],
        },
        {
          day: 'wed',
          exercises: [
            {
              exerciseName: 'Cycling',
              noOfSets: 1,
              sets: [{ notes: '40 minutes moderate intensity' }],
            },
            {
              exerciseName: 'Jump Rope',
              noOfSets: 3,
              sets: [{ notes: '2 minutes' }, { notes: '2 minutes' }, { notes: '2 minutes' }],
            },
          ],
        },
        {
          day: 'thu',
          exercises: [
            {
              exerciseName: 'Bulgarian Split Squat',
              noOfSets: 3,
              sets: [
                { reps: 12, weight: 20, notes: 'Each leg' },
                { reps: 10, weight: 25, notes: 'Each leg' },
                { reps: 8, weight: 30, notes: 'Each leg' },
              ],
            },
            {
              exerciseName: 'Russian Twist',
              noOfSets: 3,
              sets: [
                { reps: 30, weight: 10 },
                { reps: 30, weight: 12 },
                { reps: 30, weight: 15 },
              ],
            },
          ],
        },
        {
          day: 'fri',
          exercises: [
            {
              exerciseName: 'Stair Climber',
              noOfSets: 1,
              sets: [{ notes: '20 minutes' }],
            },
            {
              exerciseName: 'Mountain Climbers',
              noOfSets: 3,
              sets: [{ reps: 20 }, { reps: 20 }, { reps: 20 }],
            },
          ],
        },
        {
          day: 'sat',
          exercises: [
            {
              exerciseName: 'Push-Ups',
              noOfSets: 4,
              sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }, { reps: 8 }],
            },
            {
              exerciseName: 'Hanging Leg Raises',
              noOfSets: 3,
              sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }],
            },
          ],
        },
        {
          day: 'sun',
          exercises: [
            {
              exerciseName: 'Long Steady Run',
              noOfSets: 1,
              sets: [{ notes: '45-60 minutes easy pace' }],
            },
            {
              exerciseName: 'Yoga & Recovery',
              noOfSets: 1,
              sets: [{ notes: '20 minutes' }],
            },
          ],
        },
      ],
      createdBy: trainerId,
      createdAt: now,
      updatedAt: now,
    })

    // Assign training plans to clients
    await ctx.db.patch(client1Id, {
      trainingPlanId: strengthPlanId,
      updatedAt: now,
    })

    await ctx.db.patch(client2Id, {
      trainingPlanId: strengthPlanId,
      updatedAt: now,
    })

    // Note: client3 is selfManagedCustomer and does not get an assigned training plan
    // Self-managed customers manage their own training independently

    // Create diet plans
    const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

    const weightLossMeals = [
      {
        mealType: 'breakfast',
        title: 'Oatmeal with Berries',
        description: '1 cup oatmeal, mixed berries, almond milk, chia seeds',
        calories: 350,
      },
      {
        mealType: 'middaySnack',
        title: 'Grilled Chicken Salad',
        description:
          'Grilled chicken breast, mixed greens, olive oil dressing',
        calories: 450,
      },
      {
        mealType: 'preWorkout',
        title: 'Greek Yogurt & Nuts',
        description: '1 cup Greek yogurt, handful of almonds',
        calories: 200,
      },
      {
        mealType: 'middaySnack',
        title: 'Baked Salmon with Veggies',
        description: 'Salmon fillet, roasted vegetables, quinoa',
        calories: 550,
      },
      {
        mealType: 'postWorkout',
        title: 'Protein Shake',
        description: 'Whey protein, banana, almond butter',
        calories: 250,
      },
    ]

    const weightLossMealTemplate = allDays.flatMap((day) =>
      weightLossMeals.map((meal) => ({ day, ...meal })),
    )

    const muscleGainMeals = [
      {
        mealType: 'breakfast',
        title: 'Protein Pancakes',
        description: '4 egg whites, oats, banana, peanut butter',
        calories: 550,
      },
      {
        mealType: 'middaySnack',
        title: 'Beef & Rice Bowl',
        description: 'Lean beef, brown rice, broccoli, avocado',
        calories: 750,
      },
      {
        mealType: 'preWorkout',
        title: 'Chicken Wrap',
        description: 'Whole wheat wrap, grilled chicken, hummus',
        calories: 400,
      },
      {
        mealType: 'middaySnack',
        title: 'Steak with Sweet Potato',
        description: 'Ribeye steak, sweet potato, asparagus',
        calories: 800,
      },
      {
        mealType: 'postWorkout',
        title: 'Mass Gainer Shake',
        description: 'Whey protein, oats, banana, whole milk, peanut butter',
        calories: 500,
      },
    ]

    const muscleGainMealTemplate = allDays.flatMap((day) =>
      muscleGainMeals.map((meal) => ({ day, ...meal })),
    )

    const weightLossDietId = await ctx.db.insert('dietPlans', {
      name: 'Weight Loss Meal Plan',
      description: 'Balanced calorie-deficit meal plan for healthy weight loss',
      goal: 'Weight Loss',
      durationWeeks: 8,
      activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      dailyCalorieTarget: 1800,
      hydrationTarget: '3 liters',
      coachNote:
        'Stay consistent with meals and hydration. Avoid processed foods.',
      mealTemplate: weightLossMealTemplate,
      createdBy: trainerId,
      createdAt: now,
      updatedAt: now,
    })

    const muscleGainDietId = await ctx.db.insert('dietPlans', {
      name: 'Muscle Building Meal Plan',
      description: 'High-protein, calorie-surplus plan for muscle growth',
      goal: 'Muscle Gain',
      durationWeeks: 12,
      activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      dailyCalorieTarget: 3000,
      hydrationTarget: '4 liters',
      coachNote:
        'Focus on protein intake (2g per kg body weight). Eat every 3-4 hours.',
      mealTemplate: muscleGainMealTemplate,
      createdBy: trainerId,
      createdAt: now,
      updatedAt: now,
    })

    // Create diet logs - comprehensive for multiple days and users
    // Client 1 (Priya Selvaraj) - Today's meals
    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'breakfast',
      title: 'Oatmeal with Berries',
      description: 'Oats, blueberries, almond milk, chia seeds',
      calories: 350,
      createdAt: now - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'middaySnack',
      title: 'Grilled Chicken Salad',
      description: 'Grilled chicken, mixed greens, olive oil dressing',
      calories: 450,
      createdAt: now - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'preWorkout',
      title: 'Greek Yogurt & Nuts',
      description: 'Greek yogurt with honey and almonds',
      calories: 200,
      createdAt: now - 4 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'postWorkout',
      title: 'Protein Shake',
      description: 'Whey protein, banana, almond butter',
      calories: 280,
      createdAt: now - 3 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'middaySnack',
      title: 'Baked Salmon with Veggies',
      description: 'Salmon fillet, roasted vegetables, quinoa',
      calories: 520,
      createdAt: now - 1 * 60 * 60 * 1000,
    })

    // Yesterday's meals for client1
    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'breakfast',
      title: 'Scrambled Eggs',
      description: '3 eggs, whole wheat toast, avocado',
      calories: 420,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'middaySnack',
      title: 'Turkey Sandwich',
      description: 'Whole grain bread, turkey, lettuce, tomato',
      calories: 410,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'preWorkout',
      title: 'Apple & Almond Butter',
      description: 'Red apple with almond butter',
      calories: 200,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'middaySnack',
      title: 'Grilled Chicken Breast',
      description: 'Chicken breast, sweet potato, steamed broccoli',
      calories: 480,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
    })

    // 2 days ago for client1
    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'breakfast',
      title: 'Protein Pancakes',
      description: 'Oat flour pancakes with maple syrup',
      calories: 380,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'middaySnack',
      title: 'Tuna Salad',
      description: 'Canned tuna, lettuce, tomato, olive oil',
      calories: 320,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'middaySnack',
      title: 'Grilled Steak',
      description: 'Lean steak, sweet potato, green beans',
      calories: 620,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client1Id,
      mealType: 'preWorkout',
      title: 'Protein Bar',
      description: 'High protein granola bar',
      calories: 220,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000,
    })

    // Client 2 (Vikram Krishnan) - Today's meals
    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'breakfast',
      title: 'Protein Pancakes',
      description: 'Eggs, oats, banana, peanut butter',
      calories: 550,
      createdAt: now - 3 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'middaySnack',
      title: 'Beef & Rice Bowl',
      description: 'Lean ground beef, brown rice, broccoli, avocado',
      calories: 750,
      createdAt: now - 7 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'preWorkout',
      title: 'Protein Bar',
      description: 'Quest protein bar',
      calories: 200,
      createdAt: now - 5 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'postWorkout',
      title: 'Mass Gainer Shake',
      description: 'Whey protein, oats, banana, milk, peanut butter',
      calories: 650,
      createdAt: now - 1 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'middaySnack',
      title: 'Grilled Salmon',
      description: 'Salmon, jasmine rice, mixed vegetables',
      calories: 720,
      createdAt: now - 8 * 60 * 60 * 1000,
    })

    // Yesterday's meals for client2
    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'breakfast',
      title: 'Egg White Omelette',
      description: '6 egg whites, cheese, spinach, mushrooms',
      calories: 480,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'middaySnack',
      title: 'Chicken & Pasta',
      description: 'Grilled chicken, whole wheat pasta, tomato sauce',
      calories: 680,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'preWorkout',
      title: 'Mixed Nuts',
      description: 'Almonds, cashews, walnuts',
      calories: 320,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'middaySnack',
      title: 'Grilled Steak & Potatoes',
      description: 'Ribeye steak, sweet potato, asparagus',
      calories: 820,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
    })

    // 2 days ago for client2
    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'breakfast',
      title: 'Pancakes with Protein',
      description: 'Whole wheat pancakes with maple syrup and protein powder',
      calories: 500,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'middaySnack',
      title: 'Mutton Biryani',
      description: 'Spiced biryani with basmati rice and yogurt',
      calories: 780,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'preWorkout',
      title: 'Protein Shake',
      description: 'Whey protein, banana, milk',
      calories: 280,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client2Id,
      mealType: 'middaySnack',
      title: 'Tandoori Chicken',
      description: 'Tandoori chicken, naan, raita',
      calories: 700,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
    })

    // Client 3 (Anjali Iyer) - Today's meals
    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'breakfast',
      title: 'Dosa with Sambar',
      description: 'Crispy dosa with sambar and coconut chutney',
      calories: 320,
      createdAt: now - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'middaySnack',
      title: 'Idli with Sambar',
      description: 'Steamed idli, sambar, and coconut chutney',
      calories: 280,
      createdAt: now - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'preWorkout',
      title: 'Fruit Smoothie',
      description: 'Banana, mango, and yogurt smoothie',
      calories: 180,
      createdAt: now - 4 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'middaySnack',
      title: 'Vegetable Stir-fry',
      description: 'Mixed vegetables with brown rice',
      calories: 350,
      createdAt: now - 12 * 60 * 60 * 1000,
    })

    // Yesterday's meals for client3
    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'breakfast',
      title: 'Poha with Peanuts',
      description: 'Flattened rice with peanuts and vegetables',
      calories: 280,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'middaySnack',
      title: 'Chapati with Curry',
      description: 'Whole wheat chapati with chickpea curry',
      calories: 400,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'preWorkout',
      title: 'Coconut Water',
      description: 'Fresh coconut water',
      calories: 45,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'middaySnack',
      title: 'Rice & Lentil Curry',
      description: 'Basmati rice with aromatic lentil curry',
      calories: 380,
      createdAt: now - 1 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
    })

    // 2 days ago for client3
    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'breakfast',
      title: 'Upma',
      description: 'Semolina upma with vegetables',
      calories: 300,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'middaySnack',
      title: 'Pulao',
      description: 'Vegetable pulao with yogurt',
      calories: 420,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'preWorkout',
      title: 'Banana',
      description: 'Fresh banana',
      calories: 89,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000,
    })

    await ctx.db.insert('dietLogs', {
      userId: client3Id,
      mealType: 'middaySnack',
      title: 'Sambar Rice',
      description: 'Rice with sambar and papadům',
      calories: 350,
      createdAt: now - 2 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
    })



    // Create weight logs
    // Client 1 (Priya Selvaraj) - Weight loss journey
    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 72.5,
      createdAt: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 72.2,
      createdAt: now - 28 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 71.8,
      createdAt: now - 23 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 71.5,
      createdAt: now - 21 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 71.2,
      createdAt: now - 16 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 70.9,
      createdAt: now - 14 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 70.5,
      createdAt: now - 9 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 70.2,
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 70.0,
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client1Id,
      weight: 69.8,
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    })

    // Client 2 (Vikram Krishnan) - Muscle gain journey
    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 75.0,
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 76.2,
      createdAt: now - 28 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 77.0,
      createdAt: now - 23 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 77.8,
      createdAt: now - 21 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 79.2,
      createdAt: now - 16 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 80.0,
      createdAt: now - 14 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 80.5,
      createdAt: now - 9 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 81.8,
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 82.5,
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client2Id,
      weight: 83.0,
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    })

    // Client 3 (Anjali Iyer) - Endurance training
    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 68.5,
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 68.2,
      createdAt: now - 28 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 68.0,
      createdAt: now - 23 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 67.8,
      createdAt: now - 21 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 67.5,
      createdAt: now - 16 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 67.2,
      createdAt: now - 14 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 66.8,
      createdAt: now - 9 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 66.5,
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 66.2,
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert('weightLogs', {
      userId: client3Id,
      weight: 65.9,
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    })

    return {
      success: true,
      message: 'Database seeded successfully',
      created: {
        users: 4,
        userMeta: 4,
        trainingPlans: 2,
        dietPlans: 2,
        dietLogs: 40,
        weightLogs: 30,
      },
    }
  },
})

// Clear all data from the database (use with caution!)
export const clearDatabase = mutation({
  handler: async (ctx) => {
    // Delete all records from each table
    const tables = [
      'users',
      'userMeta',
      'workoutSessions',
      'dietLogs',
      'weightLogs',
      'trainingPlans',
      'dietPlans',
    ] as const

    let totalDeleted = 0

    for (const table of tables) {
      const records = await ctx.db.query(table).collect()
      for (const record of records) {
        await ctx.db.delete(record._id)
        totalDeleted++
      }
    }

    return {
      success: true,
      message: 'Database cleared successfully',
      deletedRecords: totalDeleted,
    }
  },
})
