import { Injectable } from '@angular/core';
import {DiaryEntry} from '../models/diary-entry';
import {formatDate} from '@angular/common';
import {ExerciseLog} from '../models/exercise-log';

export interface StatsSummary {
  totalWorkouts: number;
  avgWorkoutDuration: number;
  workoutFrequency: number;
  mostCommonMood: string;
  totalExercises: number;
  favoriteExercise: string;
  strongestMuscleGroup: string;
  mostConsistentDay: string;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  /**
   * Calculate summary statistics from diary entries
   */
  calculateSummaryStats(entries: DiaryEntry[], startDate: Date, endDate: Date): StatsSummary {
    // Filter entries with workouts
    const workoutEntries = entries.filter(entry => entry.workoutPerformed && entry.workout);

    // Calculate total workouts
    const totalWorkouts = workoutEntries.length;

    // Calculate average workout duration
    let totalDuration = 0;
    let entriesWithDuration = 0;

    workoutEntries.forEach(entry => {
      if (entry.workout?.startTime && entry.workout?.endTime) {
        const start = new Date(entry.workout.startTime).getTime();
        const end = new Date(entry.workout.endTime).getTime();
        const durationMinutes = (end - start) / (1000 * 60);

        if (durationMinutes > 0 && durationMinutes < 300) { // Sanity check (< 5 hours)
          totalDuration += durationMinutes;
          entriesWithDuration++;
        }
      }
    });

    const avgWorkoutDuration = entriesWithDuration > 0
      ? Math.round(totalDuration / entriesWithDuration)
      : 60; // Default value if no durations

    // Calculate workout frequency (workouts per week)
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
    const weeksInRange = totalDays / 7;
    const workoutFrequency = parseFloat((totalWorkouts / weeksInRange).toFixed(1));

    // Find most common mood
    const moodCount: Record<string, number> = {};

    entries.forEach(entry => {
      if (entry.feeling) {
        moodCount[entry.feeling] = (moodCount[entry.feeling] || 0) + 1;
      }
    });

    const mostCommonMood = Object.entries(moodCount)
      .sort((a, b) => b[1] - a[1])
      .map(([mood]) => this.capitalizeFirstLetter(mood))[0] || 'N/A';

    // Calculate total exercises
    let totalExercises = 0;
    const exerciseCounts: Record<string, number> = {};
    const muscleGroupCounts: Record<string, number> = {};
    const dayOfWeekCounts: Record<string, number> = {};

    workoutEntries.forEach(entry => {
      const exercisesInWorkout = entry.workout?.exercises.length || 0;
      totalExercises += exercisesInWorkout;

      // Count exercise occurrences
      entry.workout?.exercises.forEach(exercise => {
        exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;

        // Count muscle groups
        if (exercise.muscleGroup) {
          muscleGroupCounts[exercise.muscleGroup] = (muscleGroupCounts[exercise.muscleGroup] || 0) + 1;
        }
      });

      // Count day of week
      const date = new Date(entry.date);
      const dayOfWeek = formatDate(date, 'EEEE', 'en-US'); // Full day name
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    // Find favorite exercise
    const favoriteExercise = Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)[0] || 'N/A';

    // Find strongest muscle group
    const strongestMuscleGroup = Object.entries(muscleGroupCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([muscle]) => muscle)[0] || 'N/A';

    // Find most consistent day
    const mostConsistentDay = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([day]) => day)[0] || 'N/A';

    return {
      totalWorkouts,
      avgWorkoutDuration,
      workoutFrequency,
      mostCommonMood,
      totalExercises,
      favoriteExercise,
      strongestMuscleGroup,
      mostConsistentDay
    };
  }

  /**
   * Generate workout frequency chart data
   */
  generateFrequencyChartData(entries: DiaryEntry[], frequencyType: string): ChartData {
    const workoutEntries = entries.filter(entry => entry.workoutPerformed && entry.workout);

    // Group by time period based on frequency type
    const frequencyData: Record<string, number> = {};

    workoutEntries.forEach(entry => {
      const date = new Date(entry.date);
      let key: string;

      switch (frequencyType) {
        case 'daily':
          key = formatDate(date, 'yyyy-MM-dd', 'en-US');
          break;
        case 'weekly':
          // Get the week number and year
          const weekNumber = this.getWeekNumber(date);
          key = `Week ${weekNumber}, ${date.getFullYear()}`;
          break;
        case 'monthly':
          key = formatDate(date, 'MMM yyyy', 'en-US');
          break;
        default:
          key = formatDate(date, 'yyyy-MM-dd', 'en-US');
      }

      frequencyData[key] = (frequencyData[key] || 0) + 1;
    });

    // Sort keys chronologically
    const sortedKeys = Object.keys(frequencyData).sort((a, b) => {
      if (frequencyType === 'weekly') {
        // Extract week number and year for comparison
        const [, weekA, yearA] = a.match(/Week (\d+), (\d+)/) || [];
        const [, weekB, yearB] = b.match(/Week (\d+), (\d+)/) || [];

        if (yearA !== yearB) {
          return parseInt(yearA) - parseInt(yearB);
        }
        return parseInt(weekA) - parseInt(weekB);
      }

      // For daily and monthly, simple string comparison works
      return a.localeCompare(b);
    });

    // Prepare chart data
    return {
      labels: sortedKeys,
      datasets: [{
        label: 'Number of Workouts',
        data: sortedKeys.map(key => frequencyData[key]),
        fill: false,
        borderColor: '#1d8cf8',
        backgroundColor: 'rgba(29, 140, 248, 0.2)',
        tension: 0.4
      }]
    };
  }

  /**
   * Generate exercise distribution chart data
   */
  generateDistributionChartData(entries: DiaryEntry[], distributionType: string): ChartData {
    const workoutEntries = entries.filter(entry => entry.workoutPerformed && entry.workout);

    // Get all exercises
    const allExercises: ExerciseLog[] = [];

    workoutEntries.forEach(entry => {
      if (entry.workout?.exercises) {
        allExercises.push(...entry.workout.exercises);
      }
    });

    // Group by muscle or exercise type
    let distributionData: Record<string, number> = {};

    if (distributionType === 'muscle') {
      // Group by muscle group
      allExercises.forEach(exercise => {
        const muscleGroup = exercise.muscleGroup || 'Other';
        distributionData[muscleGroup] = (distributionData[muscleGroup] || 0) + 1;
      });
    } else {
      // Group by exercise name
      allExercises.forEach(exercise => {
        distributionData[exercise.name] = (distributionData[exercise.name] || 0) + 1;
      });

      // Limit to top 10 exercises if there are too many
      if (Object.keys(distributionData).length > 10) {
        const sortedExercises = Object.entries(distributionData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const otherCount = Object.values(distributionData)
            .reduce((sum, count) => sum + count, 0) -
          sortedExercises.reduce((sum, [, count]) => sum + count, 0);

        distributionData = Object.fromEntries(sortedExercises);

        if (otherCount > 0) {
          distributionData['Other'] = otherCount;
        }
      }
    }

    // Generate colors
    const backgroundColors = [
      '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff',
      '#ff9f40', '#c9cbcf', '#7e57c2', '#26c6da', '#f06292'
    ];

    // Prepare chart data
    const labels = Object.keys(distributionData);
    const data = Object.values(distributionData);

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        hoverBackgroundColor: backgroundColors.slice(0, labels.length).map(color => this.adjustColorBrightness(color, 20))
      }]
    };
  }

  /**
   * Generate progress chart data for a specific exercise
   */
  generateProgressChartData(entries: DiaryEntry[], exerciseName: string): ChartData {
    if (!exerciseName) {
      return { labels: [], datasets: [] };
    }

    const workoutEntries = entries.filter(entry =>
      entry.workoutPerformed &&
      entry.workout &&
      entry.workout.exercises.some(ex => ex.name === exerciseName)
    );

    // Sort entries by date
    workoutEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dates: string[] = [];
    const weights: number[] = [];
    const reps: number[] = [];

    workoutEntries.forEach(entry => {
      // Find the selected exercise in this workout
      const exerciseData = entry.workout?.exercises.find(ex => ex.name === exerciseName);

      if (exerciseData && exerciseData.sets.length > 0) {
        // Calculate average weight and reps across all sets
        let totalWeight = 0;
        let totalReps = 0;
        let completedSets = 0;

        exerciseData.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) {
            totalWeight += set.weight;
            totalReps += set.reps;
            completedSets++;
          }
        });

        if (completedSets > 0) {
          dates.push(formatDate(new Date(entry.date), 'MMM d', 'en-US'));
          weights.push(parseFloat((totalWeight / completedSets).toFixed(1)));
          reps.push(Math.round(totalReps / completedSets));
        }
      }
    });

    // Prepare chart data
    return {
      labels: dates,
      datasets: [
        {
          label: 'Weight (kg)',
          data: weights,
          fill: false,
          borderColor: '#1d8cf8',
          backgroundColor: 'rgba(29, 140, 248, 0.2)',
          yAxisID: 'y',
          tension: 0.4
        },
        {
          label: 'Reps',
          data: reps,
          fill: false,
          borderColor: '#fd5d93',
          backgroundColor: 'rgba(253, 93, 147, 0.2)',
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    };
  }

  /**
   * Generate mood correlation chart data
   */
  generateMoodCorrelationData(entries: DiaryEntry[]): ChartData {
    // Count entries by mood and workout status
    const moodData: Record<string, { workout: number, noWorkout: number }> = {};

    entries.forEach(entry => {
      if (entry.feeling) {
        const mood = this.capitalizeFirstLetter(entry.feeling);

        if (!moodData[mood]) {
          moodData[mood] = { workout: 0, noWorkout: 0 };
        }

        if (entry.workoutPerformed) {
          moodData[mood].workout++;
        } else {
          moodData[mood].noWorkout++;
        }
      }
    });

    // Prepare data arrays
    const moods = Object.keys(moodData);
    const workoutCounts = moods.map(mood => moodData[mood].workout);
    const noWorkoutCounts = moods.map(mood => moodData[mood].noWorkout);

    // Prepare chart data
    return {
      labels: moods,
      datasets: [
        {
          label: 'Workout Days',
          data: workoutCounts,
          backgroundColor: 'rgba(29, 140, 248, 0.7)',
          borderColor: 'rgba(29, 140, 248, 1)',
          borderWidth: 1
        },
        {
          label: 'Rest Days',
          data: noWorkoutCounts,
          backgroundColor: 'rgba(253, 93, 147, 0.7)',
          borderColor: 'rgba(253, 93, 147, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  /**
   * Find top exercises by frequency
   */
  getTopExercises(entries: DiaryEntry[], limit: number = 10): string[] {
    const workoutEntries = entries.filter(entry => entry.workoutPerformed && entry.workout);

    // Count exercise occurrences
    const exerciseCounts: Record<string, number> = {};

    workoutEntries.forEach(entry => {
      entry.workout?.exercises.forEach(exercise => {
        exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;
      });
    });

    // Sort and return top exercises
    return Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  }

  /**
   * Helper method to get week number from date
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Helper method to capitalize first letter
   */
  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Helper to adjust color brightness
   */
  private adjustColorBrightness(hex: string, percent: number): string {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Adjust brightness
    r = Math.min(255, Math.max(0, r + percent));
    g = Math.min(255, Math.max(0, g + percent));
    b = Math.min(255, Math.max(0, b + percent));

    // Convert back to hex
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

}
