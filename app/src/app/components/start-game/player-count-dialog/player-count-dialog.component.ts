import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { GameModeDialogComponent } from '../game-mode-dialog/game-mode-dialog.component';
import { Player } from '../../../model/player.model';
import { ApiService } from '../../../services/api.service';
import { PlayerNameDialogComponent } from '../player-name-dialog/player-name-dialog.component';
import { v4 as uuidv4 } from 'uuid';

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
    CommonModule,
    MatSelectModule
  ],
  templateUrl: './player-count-dialog.component.html',
  styleUrl: './player-count-dialog.component.scss'
})
export class PlayerCountDialogComponent implements OnInit {
  selectedPlayers: Player[] = [];
  existingPlayers: Player[] = [];

  constructor(
    public dialogRef: MatDialogRef<GameModeDialogComponent>,
    private apiservice: ApiService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.apiservice.getPlayers().subscribe((players) => {
      this.existingPlayers = players;
    });
  }

  changeSelection(selectedIndex: number){
    let selectedPlayer = this.existingPlayers[selectedIndex];

    const playerIndex = this.selectedPlayers.indexOf(selectedPlayer);
    if(playerIndex > -1){
      this.selectedPlayers.splice(playerIndex, 1);
    } else {
      this.selectedPlayers.push(selectedPlayer);
    }
  }

  addPlayer() {
    const dialogRef = this.dialog.open(PlayerNameDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        if (this.existingPlayers.map((player) => player.name).indexOf(result) === -1) {
          let p: Player = {
            currentDarts: [],
            name: result,
            id: uuidv4()
          };
          this.apiservice.addPlayer(p);
        }
      }
    });
  }

  save() {
    this.dialogRef.close(this.selectedPlayers);
  }
}
