import { Component, Inject, ViewEncapsulation } from '@angular/core';
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
  styleUrl: './game-mode-details-dialog.component.scss',
  encapsulation : ViewEncapsulation.None,
})
export class GameModeDetailsDialogComponent {
  points: number[] = [301,501,701,901];
  inVariant: string = "StraightIn";
  outVariant: string = "StraightOut";
  applyPointLimit: boolean = false;
  selectedPoints: number = 0;
  includeBullsEye: boolean = false;
  showAdvanced: boolean = false; 

  constructor(
    public dialogRef: MatDialogRef<GameModeDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  saveDetails() {
    const details = {
      mode: this.data.mode,
      points: this.selectedPoints,
      inVariant: this.inVariant,
      outVariant: this.outVariant,
      includeBullsEye: this.includeBullsEye
    };
    this.dialogRef.close(details);
  }

  toggleAdvancedSettings() {
    this.showAdvanced = !this.showAdvanced; // Wechseln des Sichtzustands
  }
}
