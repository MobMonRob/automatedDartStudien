import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogActions } from '@angular/material/dialog';
import { GameModeDialogComponent } from '../game-mode-dialog/game-mode-dialog.component';
import { GameModeDetailsDialogComponent } from '../game-mode-details-dialog/game-mode-details-dialog.component';
import { PlayerCountDialogComponent } from '../player-count-dialog/player-count-dialog.component';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { GameStateX01 } from '../../../model/game.model';
import { Player} from '../../../model/player.model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'dartapp-gameselect',
  standalone: true,
  imports: [MatDialogActions],
  templateUrl: './gameselect.component.html',
  styleUrl: './gameselect.component.scss'
})
export class GameselectComponent {

  constructor(public dialog: MatDialog, private router: Router, private apiservice: ApiService) {}

  startGameSetup() {
    this.openGameModeDialog();
  }

  openGameModeDialog() {
    const dialogRef = this.dialog.open(GameModeDialogComponent, {
      width: '600px', 
      height: '400px',
    });
    
    dialogRef.afterClosed().subscribe(selectedMode => {
      if (selectedMode) {
        this.openGameModeDetailsDialog(selectedMode);
      }
    });
  }

  openGameModeDetailsDialog(gameMode: string) {
    const dialogRef = this.dialog.open(GameModeDetailsDialogComponent, {
      data: { mode: gameMode },
      width: '500px', 
    });

    dialogRef.afterClosed().subscribe(details => {
      if (details) {
        this.openPlayerCountDialog(details);
      }
    });
  }

  openPlayerCountDialog(gameDetails: any) {
    const dialogRef = this.dialog.open(PlayerCountDialogComponent, {
      data: { details: gameDetails }
    });

    dialogRef.afterClosed().subscribe(players => {
      if (players) {
        console.log(players)
        //Send Game Details to Backend -> Backend Creates Game and Initializes Game and new Players in DB

        let activePlayers: Player[] = [];
        players.forEach((player: any) => {
          activePlayers.push({
            currentDarts: [],
            name: player.name,
            id: uuidv4()
          });
        });

        if(gameDetails.mode === "X01"){
          let game: GameStateX01 = {
            gameType: gameDetails.mode,
            currentPlayerIndex: 0,
            players: activePlayers,
            points: new Array(activePlayers.length).fill(gameDetails.points),
            averages: new Array(activePlayers.length).fill(0),
            bust: false,
            darts: new Array(activePlayers.length).fill(0),
            includeBulls: gameDetails.includeBullsEye,
            inVariant: gameDetails.inVariant,
            outVariant: gameDetails.outVariant
          }
          this.apiservice.initX01Game(game);
          this.router.navigateByUrl('/game/x01');
        } else if (gameDetails.mode === "Cricket"){
          // Cricket
          this.router.navigateByUrl('/game/cricket');
        } else if (gameDetails.mode === "Train Your Aim"){
          // Train Your Aim
        }
      }
    });
  }
}