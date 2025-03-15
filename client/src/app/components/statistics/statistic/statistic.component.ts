import {Component, inject, OnInit} from '@angular/core';
import {DiaryEntry} from '../../../models/diary-entry';
import {DiaryService} from '../../../services/diary.service';
import {formatDate} from '@angular/common';
import {StatisticsService} from '../../../services/statistics.service';

@Component({
  selector: 'app-statistic',
  standalone: false,
  templateUrl: './statistic.component.html',
  styleUrl: './statistic.component.css'
})
export class StatisticComponent implements OnInit{

  // Date filters
  startDate: Date = new Date(new Date().setMonth(new Date().getMonth() - 3)); // Last 3 months by default
  endDate: Date = new Date();

  // Loading state
  loading = false;
  hasData = false;

  // Summary statistics
  totalWorkouts = 0;
  avgWorkoutDuration = 0;
  workoutFrequency = 0;
  mostCommonMood = '';

  // Chart configuration
  frequencyType = 'weekly';
  distributionType = 'muscle';
  selectedExercise = '';
  topExercises: string[] = [];

  // Chart data
  workoutFrequencyData: any;
  exerciseDistributionData: any;
  progressData: any;
  moodCorrelationData: any;

  // Chart options
  chartOptions: any;
  pieChartOptions: any;
  progressChartOptions: any;
  barChartOptions: any;

  // Raw data
  diaryEntries: DiaryEntry[] = [];

  private diaryService = inject(DiaryService);
  private statisticsService = inject(StatisticsService)

  ngOnInit(): void {
    this.initChartOptions();
    this.loadStatistics();
  }

  // Initialize default chart options
  initChartOptions(): void {
    // Common options for dark theme
    const darkTheme = {
      color: '#ffffff',
      gridColor: 'rgba(255, 255, 255, 0.1)',
      axisColor: 'rgba(255, 255, 255, 0.5)',
    };

    // Base options for all charts
    const baseOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: darkTheme.color
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: darkTheme.color,
          bodyColor: darkTheme.color,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: {
            color: darkTheme.axisColor
          },
          grid: {
            color: darkTheme.gridColor
          }
        },
        y: {
          ticks: {
            color: darkTheme.axisColor
          },
          grid: {
            color: darkTheme.gridColor
          }
        }
      }
    };

    // Line chart options
    this.chartOptions = {
      ...baseOptions
    };

    // Pie chart options
    this.pieChartOptions = {
      ...baseOptions,
      cutout: '30%'
    };

    // Progress chart options
    this.progressChartOptions = {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: 'Weight (kg)',
            color: darkTheme.axisColor
          }
        }
      }
    };

    // Bar chart options
    this.barChartOptions = {
      ...baseOptions,
      indexAxis: 'y'
    };
  }

  // Load statistics based on date range
  loadStatistics(): void {
    this.loading = true;

    const startDateStr = this.formatDateForApi(this.startDate);
    const endDateStr = this.formatDateForApi(this.endDate);

    this.diaryService.getDiaryEntriesInRange(startDateStr, endDateStr).subscribe({
      next: (entries) => {
        this.diaryEntries = entries;
        this.hasData = entries.length > 0 && entries.some(e => e.workoutPerformed);

        if (this.hasData) {
          // Use statistics service to calculate summary
          const summary = this.statisticsService.calculateSummaryStats(entries, this.startDate, this.endDate);
          this.totalWorkouts = summary.totalWorkouts;
          this.avgWorkoutDuration = summary.avgWorkoutDuration;
          this.workoutFrequency = summary.workoutFrequency;
          this.mostCommonMood = summary.mostCommonMood;

          // Get top exercises
          this.topExercises = this.statisticsService.getTopExercises(entries);
          if (this.topExercises.length > 0 && !this.selectedExercise) {
            this.selectedExercise = this.topExercises[0];
          }

          // Prepare chart data using service
          this.prepareChartData(entries);
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading diary entries for statistics', error);
        this.loading = false;
      }
    });
  }

  // Set date range from quick filters
  setDateRange(range: string): void {
    this.endDate = new Date(); // Today

    switch (range) {
      case 'week':
        this.startDate = new Date(new Date().setDate(this.endDate.getDate() - 7));
        break;
      case 'month':
        this.startDate = new Date(new Date().setMonth(this.endDate.getMonth() - 1));
        break;
      case 'quarter':
        this.startDate = new Date(new Date().setMonth(this.endDate.getMonth() - 3));
        break;
      case 'year':
        this.startDate = new Date(new Date().setFullYear(this.endDate.getFullYear() - 1));
        break;
    }

    this.loadStatistics();
  }

  // Set frequency type for chart
  setFrequencyType(type: string): void {
    this.frequencyType = type;
    this.prepareFrequencyChart(this.diaryEntries);
  }

  // Set distribution type for chart
  setDistributionType(type: string): void {
    this.distributionType = type;
    this.prepareDistributionChart(this.diaryEntries);
  }

  // Update progress chart for selected exercise
  updateProgressChart(): void {
    this.prepareProgressChart(this.diaryEntries);
  }

  // Prepare all chart data
  private prepareChartData(entries: DiaryEntry[]): void {
    this.prepareFrequencyChart(entries);
    this.prepareDistributionChart(entries);
    this.prepareProgressChart(entries);
    this.prepareMoodCorrelationChart(entries);
  }

  // Prepare workout frequency chart data
  private prepareFrequencyChart(entries: DiaryEntry[]): void {
    this.workoutFrequencyData = this.statisticsService.generateFrequencyChartData(entries, this.frequencyType);
  }

  // Prepare exercise distribution chart data
  private prepareDistributionChart(entries: DiaryEntry[]): void {
    this.exerciseDistributionData = this.statisticsService.generateDistributionChartData(entries, this.distributionType);
  }

  // Prepare progress chart data for selected exercise
  private prepareProgressChart(entries: DiaryEntry[]): void {
    if (!this.selectedExercise) {
      return;
    }

    this.progressData = this.statisticsService.generateProgressChartData(entries, this.selectedExercise);

    // Update chart options for dual axes
    this.progressChartOptions = {
      ...this.progressChartOptions,
      scales: {
        ...this.progressChartOptions.scales,
        y: {
          ...this.progressChartOptions.scales.y,
          position: 'left',
          title: {
            display: true,
            text: 'Weight (kg)',
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        y1: {
          position: 'right',
          grid: {
            drawOnChartArea: false,
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)'
          },
          title: {
            display: true,
            text: 'Reps',
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }
      }
    };
  }

  // Prepare mood correlation chart data
  private prepareMoodCorrelationChart(entries: DiaryEntry[]): void {
    this.moodCorrelationData = this.statisticsService.generateMoodCorrelationData(entries);
  }

  // Helper method to format date for API
  private formatDateForApi(date: Date): string {
    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

}
