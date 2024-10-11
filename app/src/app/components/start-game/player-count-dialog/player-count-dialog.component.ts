import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon'; // Importiere das MatIconModule
import { GameModeDialogComponent } from '../game-mode-dialog/game-mode-dialog.component';


@Component({
  selector: 'dartapp-player-count-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './player-count-dialog.component.html',
  styleUrl: './player-count-dialog.component.scss'
})
export class PlayerCountDialogComponent {
  players: { name: string }[] = [{ name: '' }]; // Eine Liste, um Spieler zu speichern

  constructor(public dialogRef: MatDialogRef<GameModeDialogComponent>){}

  // Methode, um einen weiteren Spieler hinzuzufügen
  addPlayer() {
    this.players.push({ name: '' });
  }

  // Methode, um einen Spieler zu entfernen
  removePlayer(index: number) {
    if (this.players.length > 1) {
      this.players.splice(index, 1);
    }
  }

  // Methode, um das Ergebnis zu speichern
  save() {
    this.dialogRef.close(this.players);
    console.log(this.players); // Hier könntest du den Spielernamen speichern oder verarbeiten
  }
}