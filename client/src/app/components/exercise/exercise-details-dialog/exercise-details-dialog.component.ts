import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Exercise} from '../../../models/exercise';

@Component({
  selector: 'app-exercise-details-dialog',
  standalone: false,
  templateUrl: './exercise-details-dialog.component.html',
  styleUrl: './exercise-details-dialog.component.css'
})
export class ExerciseDetailsDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ExerciseDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { exercise: Exercise }
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  addToTemplate(): void {
    this.dialogRef.close(this.data.exercise);
  }

}
