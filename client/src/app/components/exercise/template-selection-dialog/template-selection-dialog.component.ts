import {Component, Inject, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WorkoutTemplate} from '../../../models/workout-template';
import {TemplateService} from '../../../services/template.service';
import {Router} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Exercise} from '../../../models/exercise';

@Component({
  selector: 'app-template-selection-dialog',
  standalone: false,
  templateUrl: './template-selection-dialog.component.html',
  styleUrl: './template-selection-dialog.component.css'
})
export class TemplateSelectionDialogComponent implements OnInit{

  private templateService = inject(TemplateService)
  private fb = inject(FormBuilder)
  private router = inject(Router)

  protected form!: FormGroup;
  templates:WorkoutTemplate[]=[];
  loading=true;

  constructor(public dialogRef: MatDialogRef<TemplateSelectionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { exercise: Exercise }) {
  }



  ngOnInit(){
    this.form = this.fb.group({
      templateOption: ['existing', Validators.required],
      templateId: [null],
      sets: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      reps: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      weight: [0, [Validators.required, Validators.min(0)]]
    });

    this.loadTemplates();

    // Add validation based on template option
    this.form.get('templateOption')?.valueChanges.subscribe(value => {
      const templateIdControl = this.form.get('templateId');
      if (value === 'existing' && this.templates.length > 0) {
        templateIdControl?.setValidators([Validators.required]);
      } else {
        templateIdControl?.clearValidators();
      }
      templateIdControl?.updateValueAndValidity();
    });
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;

        // Set default template if available
        if (templates.length > 0) {
          this.form.patchValue({ templateId: templates[0].id });
        } else {
          // Default to new template if no templates exist
          this.form.patchValue({ templateOption: 'new' });
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading templates', error);
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  createNewTemplate(): void {
    this.form.patchValue({ templateOption: 'new' });
  }

  isFormValid(): boolean {
    if (this.form.get('templateOption')?.value === 'existing') {
      return this.form.valid && this.templates.length > 0;
    }
    return this.form.valid;
  }

  addToTemplate(): void {
    if (!this.isFormValid()) return;

    const templateOption = this.form.get('templateOption')?.value;
    const templateId = this.form.get('templateId')?.value;

    const exerciseSettings = {
      exerciseId: this.data.exercise.id,
      exerciseName: this.data.exercise.name,
      sets: this.form.get('sets')?.value,
      reps: this.form.get('reps')?.value,
      weight: this.form.get('weight')?.value
    };

    if (templateOption === 'existing') {
      this.dialogRef.close({
        action: 'add-to-existing',
        templateId: templateId,
        exercise: exerciseSettings
      });
    } else {
      this.dialogRef.close({
        action: 'create-new',
        exercise: exerciseSettings
      });
    }
  }

}
