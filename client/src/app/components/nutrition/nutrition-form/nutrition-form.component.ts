import {Component, inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NutritionService} from '../../../services/nutrition.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FoodItem, Meal, NutritionLog} from '../../../models/nutrition-log';

@Component({
  selector: 'app-nutrition-form',
  standalone: false,
  templateUrl: './nutrition-form.component.html',
  styleUrl: './nutrition-form.component.css'
})
export class NutritionFormComponent implements OnInit{

  nutritionForm!: FormGroup;
  isEdit = false;
  nutritionId?: string;
  loading = false;
  saving = false;

  private fb = inject(FormBuilder);
  private nutritionService = inject(NutritionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.createForm();

    this.nutritionId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.nutritionId;

    if (this.isEdit && this.nutritionId) {
      this.loadNutritionData(this.nutritionId);
    } else {
      // Set default date to today for new entries
      this.nutritionForm.patchValue({
        date: new Date()
      });
    }
  }

  createForm() {
    this.nutritionForm = this.fb.group({
      date: [new Date(), Validators.required],
      totalCalories: [0],
      totalProtein: [0],
      totalCarbs: [0],
      totalFat: [0],
      meals: this.fb.array([])
    });
  }

  get meals(): FormArray {
    return this.nutritionForm.get('meals') as FormArray;
  }

  createMealGroup(meal?: Meal): FormGroup {
    return this.fb.group({
      name: [meal?.name || '', Validators.required],
      time: [meal?.time || '12:00', Validators.required],
      calories: [meal?.calories || 0],
      protein: [meal?.protein || 0],
      carbs: [meal?.carbs || 0],
      fat: [meal?.fat || 0],
      foodItems: this.fb.array(
        meal?.foodItems?.map(food => this.createFoodItemGroup(food)) || []
      )
    });
  }

  createFoodItemGroup(food?: FoodItem): FormGroup {
    return this.fb.group({
      name: [food?.name || '', Validators.required],
      servingSize: [food?.servingSize || 100, Validators.required],
      servingUnit: [food?.servingUnit || 'g', Validators.required],
      calories: [food?.calories || 0],
      protein: [food?.protein || 0],
      carbs: [food?.carbs || 0],
      fat: [food?.fat || 0]
    });
  }

  addMeal(meal?: Meal) {
    this.meals.push(this.createMealGroup(meal));
  }

  getFoodItems(mealIndex: number): FormArray {
    return this.meals.at(mealIndex).get('foodItems') as FormArray;
  }

  addFoodItem(mealIndex: number, food?: FoodItem) {
    const foodItems = this.getFoodItems(mealIndex);
    foodItems.push(this.createFoodItemGroup(food));
  }

  removeMeal(index: number) {
    this.meals.removeAt(index);
    this.updateTotals();
  }

  removeFoodItem(mealIndex: number, foodIndex: number) {
    const foodItems = this.getFoodItems(mealIndex);
    foodItems.removeAt(foodIndex);
    this.updateTotals();
  }

  updateTotals() {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Sum up values from all food items in all meals
    for (let i = 0; i < this.meals.length; i++) {
      const meal = this.meals.at(i);
      const foodItems = this.getFoodItems(i);

      let mealCalories = 0;
      let mealProtein = 0;
      let mealCarbs = 0;
      let mealFat = 0;

      for (let j = 0; j < foodItems.length; j++) {
        const food = foodItems.at(j).value;

        // Get macro values, defaulting to 0 if undefined
        const protein = food.protein || 0;
        const carbs = food.carbs || 0;
        const fat = food.fat || 0;

        // Calculate calories from macros using standard conversion factors
        // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
        const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);

        // Update the calories value in the form
        foodItems.at(j).get('calories')?.setValue(this.formatDecimal(calculatedCalories), { emitEvent: false });

        // Add to meal totals, using formatted values to avoid precision issues
        mealProtein += protein;
        mealCarbs += carbs;
        mealFat += fat;
        mealCalories += calculatedCalories;
      }

      // Format meal totals to fix decimal precision
      mealProtein = this.formatDecimal(mealProtein);
      mealCarbs = this.formatDecimal(mealCarbs);
      mealFat = this.formatDecimal(mealFat);
      mealCalories = this.formatDecimal(mealCalories);

      // Update meal totals
      meal.patchValue({
        calories: mealCalories,
        protein: mealProtein,
        carbs: mealCarbs,
        fat: mealFat
      }, { emitEvent: false });

      // Add to day totals
      totalCalories += mealCalories;
      totalProtein += mealProtein;
      totalCarbs += mealCarbs;
      totalFat += mealFat;
    }

    // Format day totals to fix decimal precision
    totalProtein = this.formatDecimal(totalProtein);
    totalCarbs = this.formatDecimal(totalCarbs);
    totalFat = this.formatDecimal(totalFat);
    totalCalories = this.formatDecimal(totalCalories);

    // Update form totals
    this.nutritionForm.patchValue({
      totalCalories: totalCalories,
      totalProtein: totalProtein,
      totalCarbs: totalCarbs,
      totalFat: totalFat
    }, { emitEvent: false });
  }

  // Helper method to fix decimal precision issues
  formatDecimal(value: number): number {
    return parseFloat(value.toFixed(1));
  }

  loadNutritionData(id: string) {
    this.loading = true;
    this.nutritionService.getNutritionLogById(id).subscribe({
      next: (nutrition) => {
        // Reset meals array
        while (this.meals.length) {
          this.meals.removeAt(0);
        }

        // Set form values
        this.nutritionForm.patchValue({
          date: new Date(nutrition.date),
          totalCalories: nutrition.totalCalories,
          totalProtein: nutrition.totalProtein,
          totalCarbs: nutrition.totalCarbs,
          totalFat: nutrition.totalFat
        });

        // Add meals and food items
        if (nutrition.meals && nutrition.meals.length > 0) {
          nutrition.meals.forEach(meal => {
            this.addMeal(meal);
          });
        } else {
          // Add default meal if none exists
          this.addMeal();
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading nutrition data', error);
        this.loading = false;
        this.snackBar.open('Error loading nutrition data', 'Close', { duration: 3000 });
      }
    });
  }

  saveNutrition() {
    if (this.nutritionForm.invalid) return;

    this.saving = true;
    const formValue = this.nutritionForm.value;

    // Create nutrition log object
    const nutritionLog: NutritionLog = {
      date: formValue.date.toISOString().split('T')[0],
      totalCalories: formValue.totalCalories,
      totalProtein: formValue.totalProtein,
      totalCarbs: formValue.totalCarbs,
      totalFat: formValue.totalFat,
      meals: formValue.meals
    };

    if (this.isEdit && this.nutritionId) {
      this.nutritionService.updateNutritionLog(this.nutritionId, nutritionLog).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Nutrition log updated', 'Close', { duration: 3000 });
          this.router.navigate(['/nutrition']);
        },
        error: (error) => {
          console.error('Error updating nutrition log', error);
          this.saving = false;
          this.snackBar.open('Error updating nutrition log', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.nutritionService.createNutritionLog(nutritionLog).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Nutrition log created', 'Close', { duration: 3000 });
          this.router.navigate(['/nutrition']);
        },
        error: (error) => {
          console.error('Error creating nutrition log', error);
          this.saving = false;
          this.snackBar.open('Error creating nutrition log', 'Close', { duration: 3000 });
        }
      });
    }
  }

}
