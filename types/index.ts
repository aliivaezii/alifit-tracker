export type Goal = 'fat_loss' | 'recomposition' | 'muscle_gain'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
export type Gender = 'male' | 'female'
export type MealType = 'pre_workout' | 'post_workout' | 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'evening'

export interface Profile {
  id: string
  user_id: string
  name: string
  dob: string
  gender: Gender
  weight_kg: number
  height_cm: number
  goal: Goal
  activity_level: ActivityLevel
  goal_weight_kg: number | null
  created_at: string
  updated_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  date: string
  weight_kg: number
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  day_number: number
  notes: string | null
  is_deload: boolean
  completed_at: string | null
  exercise_logs?: ExerciseLog[]
}

export interface ExerciseLog {
  id: string
  session_id: string
  exercise_name: string
  muscle_group: string
  set_number: number
  weight_kg: number
  reps: number
  completed: boolean
}

export interface Food {
  id: string
  user_id: string | null
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  is_default: boolean
}

export interface MealLog {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  created_at: string
  meal_items?: MealItem[]
}

export interface MealItem {
  id: string
  meal_log_id: string
  food_id: string
  quantity_g: number
  calories: number
  protein: number
  carbs: number
  fat: number
  food?: Food
}

export interface ComputedStats {
  bmi: number
  bmr: number
  tdee: number
  recommendedCalories: number
  proteinTarget: number
  carbTarget: number
  fatTarget: number
}

export interface DailyNutritionTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
}

export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: 'Fat Loss',
  recomposition: 'Body Recomposition',
  muscle_gain: 'Muscle Gain',
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
  evening: 'Evening Snack',
}
