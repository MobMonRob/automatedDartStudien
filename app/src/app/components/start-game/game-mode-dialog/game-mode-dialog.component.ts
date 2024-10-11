import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'dartapp-game-mode-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './game-mode-dialog.component.html',
  styleUrl: './game-mode-dialog.component.scss'
})
export class GameModeDialogComponent {



  gameModes: string[]

  constructor(public dialogRef: MatDialogRef<GameModeDialogComponent>) {
    this.gameModes = ["X01", "Cricket", "Train Your Aim"]
  }

  ngOnInit() {
    this.dialogRef.updateSize('40%', '40%');
  }

  selectMode(mode: string) {
    this.dialogRef.close(mode);
  }
}
