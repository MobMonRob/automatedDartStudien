import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { ApiService } from '../../../services/api.service';
import { DartEventService } from '../../../services/dart-event.service';
import { GameStateX01 } from '../../../model/game.model';
import { DebugNumberConsoleComponent } from "../../debug-number-console/debug-number-console.component";
import { TopbarComponent } from "../../topbar/topbar.component";
import { DebugComponent } from '../../../model/debug.model';
import { ScoringZoomViewComponent } from "../../scoring-zoom-view/scoring-zoom-view.component";


@Component({
  selector: 'dartapp-gamestate',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PlayerCardComponent, DebugNumberConsoleComponent, TopbarComponent, ScoringZoomViewComponent],
  templateUrl: './gamestate.component.html',
  styleUrl: './gamestate.component.scss'
})
export class GamestateComponent implements OnInit, DebugComponent {
  players: any[] = [];
  gameMode: string = "";
  currentPlayerIndex = 0;
  points: number[] = [];
  darts:  number[] = [];
  currentDartPositions: number[][] = [];
  averages:  number[] = [];
  currentDarts: string[] = [];
  gameIsRunning = false;
  bust = {bust: false, origin: ""};

  constructor (private apiService: ApiService, private dartEventService: DartEventService) {}

  ngOnInit(){
    this.apiService.getInitStateOfCurrentGameX01().subscribe(game => {
      this.gameMode = game.gameType;
      this.startGame(game);
    })
  }

  startGame(game: GameStateX01) {
    this.players = game.players;
    this.points = game.points;
    this.darts = game.darts;
    this.averages = game.averages;
    this.gameIsRunning = true;
    this.currentPlayerIndex = game.currentPlayerIndex;
    this.currentDartPositions = game.players[this.currentPlayerIndex].currentDartPositions;
    //this.watchGame();
  }

  watchGame() {
    if(this.gameIsRunning){
      this.apiService.getCurrentGameStateX01().subscribe(async gameState => {
        this.reactOnNewGameState(gameState);
        await this.delay(1000);
        //this.watchGame();
      })
    }
  }

  addMissThrow() {
    this.apiService.evaluateThrow(0,"0", [10,10]).subscribe(gameState => {
      this.reactOnNewGameState(gameState);
    });
  }

  nextPlayer() {
    this.apiService.evaluateNextPlayerX01().subscribe(gameState => {
      this.reactOnNewGameState(gameState, true);
    });
  }

  evaluateDebugThrow(value: number, valueString: string, position: []):void{
    this.apiService.evaluateThrow(value,valueString, position).subscribe(gameState => {
      this.reactOnNewGameState(gameState);
    });
  }

  disableConsoleButtons():boolean {
    return this.players[this.currentPlayerIndex].currentDarts.length === 3 || this.bust.bust || !this.gameIsRunning;
  }

  private reactOnNewGameState(gameState: GameStateX01, calledByNextPlayer: boolean = false){
    this.points = gameState.points;
    this.bust = {bust: gameState.bust, origin: gameState.players[this.currentPlayerIndex].name};
    if(this.points.indexOf(0) !== -1){
      this.gameIsRunning = false;
      this.endGame(this.points.indexOf(0));
    } 
    this.currentDarts = gameState.players[this.currentPlayerIndex].currentDarts;
    this.currentDartPositions = gameState.players[this.currentPlayerIndex].currentDartPositions;
    this.dartEventService.emitThrowEvent( (!calledByNextPlayer) ? this.currentDartPositions : [[],[],[]]);
    this.darts = gameState.darts;
    this.averages = gameState.averages;
    this.currentPlayerIndex = gameState.currentPlayerIndex;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private endGame(winnerIndex: number) {
    const playerCards = document.querySelectorAll('.player-card');

    playerCards.forEach(card => {
      card.classList.remove('winner-card');
    });
  
    playerCards[winnerIndex*2].classList.add('winner-card');
  }
  
}
