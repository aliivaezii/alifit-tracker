import { type ActivityLevel, type Gender, type Goal, type ComputedStats, ACTIVITY_MULTIPLIERS } from '@/types'
import { differenceInYears, parseISO } from 'date-fns'

export function computeAge(dob: string): number {
  return differenceInYears(new Date(), parseISO(dob))
}

export function computeBMR(weight: number, height: number, age: number, gender: Gender): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

export function computeBMI(weight: number, height: number): number {
  const heightM = height / 100
  return weight / (heightM * heightM)
}

export function computeStats(
  weight: number,
  height: number,
  dob: string,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: Goal
): ComputedStats {
  const age = computeAge(dob)
  const bmi = computeBMI(weight, height)
  const bmr = computeBMR(weight, height, age, gender)
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel]

  const goalOffset = goal === 'fat_loss' ? -400 : goal === 'muscle_gain' ? 300 : 0
  const recommendedCalories = tdee + goalOffset

  const proteinTarget = weight * 2
  const fatTarget = weight * 0.8
  const carbTarget = (recommendedCalories - proteinTarget * 4 - fatTarget * 9) / 4

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    recommendedCalories: Math.round(recommendedCalories),
    proteinTarget: Math.round(proteinTarget),
    carbTarget: Math.max(0, Math.round(carbTarget)),
    fatTarget: Math.round(fatTarget),
  }
}

export function computeMacrosFromFood(
  caloriesPer100g: number,
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number,
  quantityG: number
) {
  const ratio = quantityG / 100
  return {
    calories: Math.round(caloriesPer100g * ratio * 10) / 10,
    protein: Math.round(proteinPer100g * ratio * 10) / 10,
    carbs: Math.round(carbsPer100g * ratio * 10) / 10,
    fat: Math.round(fatPer100g * ratio * 10) / 10,
  }
}
