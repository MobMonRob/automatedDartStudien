import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'dartapp-game-mode-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    MatRadioModule
  ],
  templateUrl: './game-mode-details-dialog.component.html',
  styleUrl: './game-mode-details-dialog.component.scss'
})
export class GameModeDetailsDialogComponent {
  points: number[] = [301,501,701,901];
  doubleOut: boolean = false;
  includeBullsEye: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<GameModeDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  saveDetails() {
    const details = {
      mode: this.data.mode,
      points: this.points,
      doubleOut: this.doubleOut,
      includeBullsEye: this.includeBullsEye
    };
    this.dialogRef.close(details);
  }
}
