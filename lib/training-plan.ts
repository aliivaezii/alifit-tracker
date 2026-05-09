export interface Exercise {
  name: string
  muscleGroup: string
  sets: number
  repsRange: string
  progressionRule: 'compound' | 'isolation'
  coachingNote: string
}

export interface TrainingDay {
  dayNumber: number
  name: string
  focus: string
  isRest: boolean
  exercises: Exercise[]
}

export const TRAINING_PLAN: TrainingDay[] = [
  {
    dayNumber: 1,
    name: 'Push -- Chest Focus',
    focus: 'Chest, Shoulders, Triceps',
    isRest: false,
    exercises: [
      { name: 'Barbell Bench Press', muscleGroup: 'Chest', sets: 4, repsRange: '6-8', progressionRule: 'compound', coachingNote: '+2.5kg/week when top of rep range hit' },
      { name: 'Incline DB Chest Press', muscleGroup: 'Chest', sets: 3, repsRange: '8-10', progressionRule: 'isolation', coachingNote: 'Control the eccentric, feel the stretch at bottom' },
      { name: 'High-to-Low Cable Fly', muscleGroup: 'Chest', sets: 3, repsRange: '12-15', progressionRule: 'isolation', coachingNote: 'Squeeze at peak contraction, slow negatives' },
      { name: 'DB Overhead Press', muscleGroup: 'Shoulders', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Full ROM, neutral grip helps shoulder health' },
    ],
  },
  {
    dayNumber: 2,
    name: 'Pull -- Back + Biceps',
    focus: 'Back, Biceps, Rear Delts',
    isRest: false,
    exercises: [
      { name: 'Chest Supported Machine Row', muscleGroup: 'Back', sets: 4, repsRange: '8-10', progressionRule: 'compound', coachingNote: 'Chest on pad eliminates lower back fatigue' },
      { name: 'Lat Pull-Down', muscleGroup: 'Back', sets: 3, repsRange: '8-10', progressionRule: 'compound', coachingNote: 'Triple combo: wide, neutral, underhand -- pick one per session' },
      { name: 'Seated Cable Row', muscleGroup: 'Back', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Drive elbows back, retract scapula at top' },
      { name: 'Face Pulls', muscleGroup: 'Rear Delts', sets: 4, repsRange: '15-20', progressionRule: 'isolation', coachingNote: 'High rep, low weight -- external rotation priority' },
      { name: 'DB Hammer Curls', muscleGroup: 'Biceps', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Neutral grip hits brachialis for arm thickness' },
    ],
  },
  {
    dayNumber: 3,
    name: 'Legs -- Quad + Posterior Chain',
    focus: 'Quads, Hamstrings, Glutes',
    isRest: false,
    exercises: [
      { name: 'Barbell Back Squat', muscleGroup: 'Quads', sets: 4, repsRange: '6-8', progressionRule: 'compound', coachingNote: 'Start 60-70kg. Form first, load second' },
      { name: 'Leg Press (Wide Stance)', muscleGroup: 'Quads', sets: 3, repsRange: '10-12', progressionRule: 'compound', coachingNote: 'Wide stance biases glutes and inner quads' },
      { name: 'Romanian DB Deadlift', muscleGroup: 'Hamstrings', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Hip hinge not squat -- feel hamstring stretch' },
      { name: 'Leg Extension (Front)', muscleGroup: 'Quads', sets: 3, repsRange: '12-15', progressionRule: 'isolation', coachingNote: 'Pause 1s at top for VMO activation' },
      { name: 'Leg Curl (Hamstring)', muscleGroup: 'Hamstrings', sets: 3, repsRange: '12-15', progressionRule: 'isolation', coachingNote: 'Slow eccentric, 3 seconds down' },
    ],
  },
  {
    dayNumber: 4,
    name: 'Rest / Active Recovery',
    focus: 'Recovery',
    isRest: true,
    exercises: [],
  },
  {
    dayNumber: 5,
    name: 'Arms -- Triceps + Biceps',
    focus: 'Triceps, Biceps',
    isRest: false,
    exercises: [
      { name: 'Close Grip Bench Press', muscleGroup: 'Triceps', sets: 4, repsRange: '8-10', progressionRule: 'compound', coachingNote: 'Elbows tucked 45°, long head stretch' },
      { name: 'Overhead Cable Extension', muscleGroup: 'Triceps', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Arms overhead maximally stretches long head' },
      { name: 'Skull Crushers (EZ bar)', muscleGroup: 'Triceps', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Lower to forehead, lock out at top' },
      { name: 'Standing Barbell Curl', muscleGroup: 'Biceps', sets: 3, repsRange: '8-10', progressionRule: 'compound', coachingNote: 'No body english -- strict form' },
      { name: 'Incline DB Curl', muscleGroup: 'Biceps', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Full stretch at bottom is the money position' },
      { name: 'Concentration Curl', muscleGroup: 'Biceps', sets: 3, repsRange: '10-12', progressionRule: 'isolation', coachingNote: 'Finish the session, peak contraction focus' },
    ],
  },
  {
    dayNumber: 6,
    name: 'Shoulders + Traps',
    focus: 'Shoulders, Traps',
    isRest: false,
    exercises: [
      { name: 'Shoulder Machine Press', muscleGroup: 'Shoulders', sets: 3, repsRange: '10-12', progressionRule: 'compound', coachingNote: 'Machine stabilises shoulder for more load focus' },
      { name: 'Lateral Raises (Machine)', muscleGroup: 'Shoulders', sets: 3, repsRange: '15-20', progressionRule: 'isolation', coachingNote: 'Machine keeps constant tension through ROM' },
      { name: 'Lateral Raises (DB Seated)', muscleGroup: 'Shoulders', sets: 3, repsRange: '12-15', progressionRule: 'isolation', coachingNote: 'Slight forward lean, lead with elbows' },
      { name: 'Cable Lateral Raises', muscleGroup: 'Shoulders', sets: 3, repsRange: '15-20', progressionRule: 'isolation', coachingNote: 'Cables provide tension at bottom unlike DBs' },
      { name: 'Face Pulls', muscleGroup: 'Rear Delts', sets: 3, repsRange: '20', progressionRule: 'isolation', coachingNote: 'Rear delt health -- do not skip' },
      { name: 'DB Shrugs', muscleGroup: 'Traps', sets: 3, repsRange: '12-15', progressionRule: 'isolation', coachingNote: 'Full ROM, hold at top 1s' },
    ],
  },
]

export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Chest: '#10b981',
  Back: '#3b82f6',
  Shoulders: '#8b5cf6',
  Biceps: '#f59e0b',
  Triceps: '#ef4444',
  Quads: '#06b6d4',
  Hamstrings: '#84cc16',
  Glutes: '#f97316',
  'Rear Delts': '#ec4899',
  Traps: '#a78bfa',
}

export const VOLUME_TARGETS: Record<string, { min: number; max: number }> = {
  Chest: { min: 10, max: 14 },
  Back: { min: 12, max: 16 },
  Shoulders: { min: 10, max: 14 },
  Biceps: { min: 8, max: 12 },
  Triceps: { min: 8, max: 12 },
  Quads: { min: 10, max: 14 },
  Hamstrings: { min: 8, max: 12 },
  Glutes: { min: 6, max: 10 },
  Traps: { min: 4, max: 8 },
}
