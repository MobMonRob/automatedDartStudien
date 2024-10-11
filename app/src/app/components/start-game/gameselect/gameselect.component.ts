import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogActions } from '@angular/material/dialog';
import { GameModeDialogComponent } from '../game-mode-dialog/game-mode-dialog.component';
import { GameModeDetailsDialogComponent } from '../game-mode-details-dialog/game-mode-details-dialog.component';
import { PlayerCountDialogComponent } from '../player-count-dialog/player-count-dialog.component';
import { Router } from '@angular/router';



@Component({
  selector: 'dartapp-gameselect',
  standalone: true,
  imports: [MatDialogActions],
  templateUrl: './gameselect.component.html',
  styleUrl: './gameselect.component.scss'
})
export class GameselectComponent {

  constructor(public dialog: MatDialog, private router: Router) {}

  startGameSetup() {
    this.openGameModeDialog();
  }

  openGameModeDialog() {
    const dialogRef = this.dialog.open(GameModeDialogComponent);

    
    dialogRef.afterClosed().subscribe(selectedMode => {
      if (selectedMode) {
        this.openGameModeDetailsDialog(selectedMode);
      }
    });
  }

  openGameModeDetailsDialog(gameMode: string) {
    const dialogRef = this.dialog.open(GameModeDetailsDialogComponent, {
      data: { mode: gameMode }
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
        console.log('Spielmodus:', gameDetails);
        console.log('Spieleranzahl:', players.length);
        //Send Game Details to Backend -> Backend Creates Game and Initializes Game and new Players in DB
        //Returns ID to Game for this field in order to retreive back new information/stats/points etc
        this.router.navigateByUrl('/game');
      }
    });
  }
}