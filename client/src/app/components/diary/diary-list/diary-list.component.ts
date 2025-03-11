import {Component, inject, OnInit} from '@angular/core';
import {DiaryEntry} from '../../../models/diary-entry';
import {DiaryService} from '../../../services/diary.service';
import {formatDate} from '@angular/common';

@Component({
  selector: 'app-diary-list',
  standalone: false,
  templateUrl: './diary-list.component.html',
  styleUrl: './diary-list.component.css'
})
export class DiaryListComponent implements OnInit{

  diaryEntries: DiaryEntry[] = [];
  loading = false;

  // Default to showing the last 30 days
  startDate: Date = new Date(new Date().setDate(new Date().getDate() - 30));
  endDate: Date = new Date();

  private diaryService = inject(DiaryService)

  ngOnInit(): void {
    this.loadDiaryEntries();
  }

  loadDiaryEntries(): void {
    this.loading = true;

    // Format dates as ISO strings
    const startDateStr = this.formatDateForApi(this.startDate);
    const endDateStr = this.formatDateForApi(this.endDate);

    this.diaryService.getDiaryEntriesInRange(startDateStr, endDateStr).subscribe({
      next: (entries) => {
        this.diaryEntries = entries.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading diary entries', error);
        this.loading = false;
      }
    });
  }

  getEmotionIcon(feeling: string): string {
    switch (feeling?.toLowerCase()) {
      case 'great':
        return 'sentiment_very_satisfied';
      case 'good':
        return 'sentiment_satisfied';
      case 'okay':
        return 'sentiment_neutral';
      case 'bad':
        return 'sentiment_dissatisfied';
      case 'terrible':
        return 'sentiment_very_dissatisfied';
      default:
        return 'sentiment_neutral';
    }
  }

  private formatDateForApi(date: Date): string {
    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

}
