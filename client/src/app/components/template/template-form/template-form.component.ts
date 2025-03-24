import {Component, inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TemplateService} from '../../../services/template.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {WorkoutTemplate} from '../../../models/workout-template';
import {TemplateExercise} from '../../../models/template-exercise';

@Component({
  selector: 'app-template-form',
  standalone: false,
  templateUrl: './template-form.component.html',
  styleUrl: './template-form.component.css'
})
export class TemplateFormComponent implements OnInit{

  templateForm!: FormGroup;
  isEdit = false;
  templateId?: number;
  loading = false;
  saving = false;

  private formBuilder = inject(FormBuilder)
  private templateService = inject(TemplateService)
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private dialog = inject(MatDialog)
  private snackBar = inject(MatSnackBar)

  ngOnInit() {
    this.createForm();

    const id = this.route.snapshot.paramMap.get('id');
    this.templateId = id ? +id : undefined;
    this.isEdit = !!this.templateId;

    if (this.isEdit && this.templateId) {
      this.loadTemplate(this.templateId);
    }else {
      // Check if there's a new exercise from the exercise search
      const newExerciseJson = sessionStorage.getItem('newTemplateExercise');
      if (newExerciseJson) {
        try {
          const newExercise = JSON.parse(newExerciseJson);
          // Add the exercise to the form
          this.addExercise(newExercise);
          // Clear from session storage to avoid duplicate additions
          sessionStorage.removeItem('newTemplateExercise');
        } catch (e) {
          console.error('Error parsing new exercise data', e);
        }
      }
    }
  }

  createForm(): void {
    this.templateForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      exercises: this.formBuilder.array([])
    });
  }

  loadTemplate(id: number): void {
    this.loading = true;
    this.templateService.getTemplateWithExercises(id).subscribe({
      next: (template) => {
        // Reset exercise form array
        while (this.exercises.length) {
          this.exercises.removeAt(0);
        }

        // Patch basic template details
        this.templateForm.patchValue({
          name: template.name,
          description: template.description
        });

        // Add exercises to form array
        if (template.exercises && template.exercises.length > 0) {
          template.exercises.forEach(exercise => {
            this.exercises.push(this.createExerciseFormGroup(exercise));
          });
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading template', error);
        this.loading = false;
        this.snackBar.open('Error loading template', 'Close', { duration: 3000 });
      }
    });
  }

  get exercises(): FormArray {
    return this.templateForm.get('exercises') as FormArray;
  }

  createExerciseFormGroup(exercise?: TemplateExercise): FormGroup {
    return this.formBuilder.group({
      id: [exercise?.id],
      templateId: [exercise?.templateId],
      exerciseId: [exercise?.exerciseId || ''],
      exerciseName: [exercise?.exerciseName || '', Validators.required],
      sets: [exercise?.sets || 3, [Validators.required, Validators.min(1), Validators.max(10)]],
      reps: [exercise?.reps || 10, [Validators.required, Validators.min(1), Validators.max(100)]],
      weight: [exercise?.weight || 0, [Validators.required, Validators.min(0)]]
    });
  }

  addExercise(exercise?: TemplateExercise): void {
    this.exercises.push(this.createExerciseFormGroup(exercise));
  }

  removeExercise(index: number): void {
    this.exercises.removeAt(index);
  }

  openExerciseSearch(): void {
    // For now, just add an empty exercise
    // In a future implementation, this would open a search dialog
    this.addExercise();
  }

  saveTemplate(): void {
    if (this.templateForm.invalid) return;

    this.saving = true;
    const formValue = this.templateForm.value;

    // Create template object
    const template: WorkoutTemplate = {
      id: this.templateId,
      name: formValue.name,
      description: formValue.description
    };

    // Map form exercises to model
    const exercises: TemplateExercise[] = formValue.exercises.map((ex: any) => ({
      id: ex.id,
      templateId: ex.templateId,
      exerciseId: ex.exerciseId || 'custom',
      exerciseName: ex.exerciseName,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight
    }));

    if (this.isEdit && this.templateId) {
      // Update existing template
      this.templateService.updateTemplate(this.templateId, template, exercises).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Template updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/templates']);
        },
        error: (error) => {
          console.error('Error updating template', error);
          this.saving = false;
          this.snackBar.open('Error updating template', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Create new template
      this.templateService.createTemplate(template, exercises).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Template created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/templates']);
        },
        error: (error) => {
          console.error('Error creating template', error);
          this.saving = false;
          this.snackBar.open('Error creating template', 'Close', { duration: 3000 });
        }
      });
    }
  }

}
