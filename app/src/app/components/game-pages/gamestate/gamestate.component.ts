import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { ApiService } from '../../../services/api.service';
import { GameState } from '../../../model/game.model';

@Component({
  selector: 'dartapp-gamestate',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PlayerCardComponent],
  templateUrl: './gamestate.component.html',
  styleUrl: './gamestate.component.scss'
})
export class GamestateComponent implements OnInit {
  players: any[] = [];
  gameMode: string = "";
  currentPlayerIndex = 0;
  points: number[] = [];
  darts:  number[] = [];
  averages:  number[] = [];
  currentDarts: Number[] = [];
  gameIsRunning = false;
  gameMessage = "Spiel beginnt in Kürze";

  constructor (private apiService: ApiService) {}

  ngOnInit(){
    this.apiService.getInitStateOfCurrentGame().subscribe(game => {
      this.gameMode = game.gameType;
      this.startGame(game);
    })
  }

  startGame(game: GameState) {
    this.players = game.players;
    this.points = game.points;
    this.darts = game.darts;
    this.averages = game.averages;
    this.gameIsRunning = true;
    this.gameMessage = "Spiel läuft";
    this.currentPlayerIndex = game.currentPlayerIndex;
    //this.watchGame();
  }

  watchGame() {
    if(this.gameIsRunning){
      this.apiService.getCurrentGameState().subscribe(async gameState => {
        this.points = gameState.points;
        if(this.points.indexOf(0) !== -1){
          this.gameMessage = `Spieler ${gameState.players[this.points.indexOf(0)].name} hat das Spiel gewonnen`
          this.gameIsRunning = false;
        } else if (gameState.bust) {
          this.gameMessage = "BUST!"
          this.handleBust();
        }
        this.currentDarts = gameState.currentThrow;
        this.darts = gameState.darts;
        this.averages = gameState.averages;
        this.currentPlayerIndex = gameState.currentPlayerIndex;
        await this.delay(1000);
        //this.watchGame();
      })
    }
  }

  changeGameState(){
    this.gameIsRunning = !this.gameIsRunning;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleBust() {
    const dartFields = document.querySelectorAll('.dart-field');
    dartFields.forEach(field => {
      field.classList.add('blink');
    });
  
    setTimeout(() => {
      dartFields.forEach(field => {
        field.classList.remove('blink');
      });
    }, 3000); 
  }
  
}
