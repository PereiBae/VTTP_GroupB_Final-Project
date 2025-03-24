import {Component, inject, OnInit} from '@angular/core';
import {TemplateService} from '../../../services/template.service';
import {WorkoutTemplate} from '../../../models/workout-template';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-template-list',
  standalone: false,
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css'
})
export class TemplateListComponent implements OnInit{

  templates: WorkoutTemplate[] = [];
  loading = false;

  private templateService = inject(TemplateService)
  private snackBar = inject(MatSnackBar);

  ngOnInit(){
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading templates', error);
        this.loading = false;
        this.snackBar.open('Error loading templates', 'Close', { duration: 3000 });
      }
    });
  }
  deleteTemplate(template: WorkoutTemplate): void {
    if (!template.id || !confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    this.templateService.deleteTemplate(template.id).subscribe({
      next: () => {
        this.snackBar.open('Template deleted', 'Close', { duration: 3000 });
        this.loadTemplates(); // Reload templates
      },
      error: (error) => {
        console.error('Error deleting template', error);
        this.snackBar.open('Error deleting template', 'Close', { duration: 3000 });
      }
    });
  }

}
