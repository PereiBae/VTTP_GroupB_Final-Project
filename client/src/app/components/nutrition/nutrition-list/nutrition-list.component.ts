import {Component, inject, OnInit} from '@angular/core';
import {NutritionLog} from '../../../models/nutrition-log';
import {NutritionService} from '../../../services/nutrition.service';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {formatDate} from '@angular/common';

@Component({
  selector: 'app-nutrition-list',
  standalone: false,
  templateUrl: './nutrition-list.component.html',
  styleUrl: './nutrition-list.component.css'
})
export class NutritionListComponent implements OnInit {

  nutritionLogs: NutritionLog[] = [];
  loading = false;

  // Default to showing the last 30 days
  startDate: Date = new Date(new Date().setDate(new Date().getDate() - 30));
  endDate: Date = new Date();

  private nutritionService = inject(NutritionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.loadNutritionLogs()
  }

  loadNutritionLogs(): void {
    this.loading = true;

    // Format dates as ISO strings
    const startDateStr = this.formatDateForApi(this.startDate);
    const endDateStr = this.formatDateForApi(this.endDate);

    this.nutritionService.getNutritionLogsInRange(startDateStr, endDateStr).subscribe({
      next: (logs) => {
        this.nutritionLogs = logs.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading nutrition logs', error);
        this.loading = false;
        this.snackBar.open('Error loading nutrition logs', 'Close', { duration: 3000 });
      }
    });
  }

  deleteLog(log: NutritionLog): void {
    if (confirm(`Are you sure you want to delete the nutrition log for ${formatDate(new Date(log.date), 'mediumDate', 'en-US')}?`)) {
      if (log.id) {
        this.nutritionService.deleteNutritionLog(log.id).subscribe({
          next: () => {
            this.snackBar.open('Nutrition log deleted successfully', 'Close', { duration: 3000 });
            this.loadNutritionLogs();
          },
          error: (error) => {
            console.error('Error deleting nutrition log', error);
            this.snackBar.open('Error deleting nutrition log', 'Close', { duration: 3000 });
          }
        });
      }
    }
  }

  // Helper method to get total number of food items in a log
  getTotalFoodItems(log: NutritionLog): number {
    return log.meals.reduce((total, meal) => total + meal.foodItems.length, 0);
  }

  // Helper method to calculate a percentage
  calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Helper method to fix decimal precision issues
  formatDecimal(value: number): number {
    return parseFloat(value.toFixed(1));
  }

  // Helper method to format date for API calls
  private formatDateForApi(date: Date): string {
    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

}
