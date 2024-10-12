import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'dartapp-player-name-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './player-name-dialog.component.html',
  styleUrl: './player-name-dialog.component.scss'
})
export class PlayerNameDialogComponent {
  playerName: string = '';

  constructor(
    public dialogRef: MatDialogRef<PlayerNameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close(this.playerName);
  }
}
