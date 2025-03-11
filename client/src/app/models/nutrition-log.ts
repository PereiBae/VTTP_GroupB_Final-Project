export interface FoodItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  name: string;
  time: string; // ISO format time string
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodItems: FoodItem[];
}

export interface NutritionLog {
  id?: string;
  userId?: string;
  date: string; // ISO format date string
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
}
