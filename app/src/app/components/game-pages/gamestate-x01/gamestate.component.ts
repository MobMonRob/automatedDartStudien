import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { ApiService } from '../../../services/api.service';
import { GameStateX01 } from '../../../model/game.model';
import { DebugNumberConsoleComponent } from "../../debug-number-console/debug-number-console.component";
import { TopbarComponent } from "../../topbar/topbar.component";
import { DebugComponent } from '../../../model/debug.model';
import { ScoringZoomViewComponent } from "../../scoring-zoom-view/scoring-zoom-view.component";
import { Player } from '../../../model/player.model';


@Component({
  selector: 'dartapp-gamestate',
  standalone: true,
  imports: [CommonModule, PlayerCardComponent, DebugNumberConsoleComponent, TopbarComponent, ScoringZoomViewComponent],
  templateUrl: './gamestate.component.html',
  styleUrl: './gamestate.component.scss'
})
export class GamestateComponent implements OnInit, DebugComponent {
  @ViewChildren('zoomField') zoomFields!: QueryList<ScoringZoomViewComponent>;

  players: Player[] = [];
  gameMode: string = "";
  currentPlayerIndex = 0;
  points: number[] = [];
  darts:  number[] = [];
  currentDartPositions: number[][] = [];
  averages:  number[] = [];
  currentDarts: string[] = [];
  gameIsRunning = false;
  bust = {bust: false, origin: ""};

  customId = "mainZoomField"

  constructor (private apiService: ApiService, private cdr: ChangeDetectorRef) {}

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
    this.watchGame();
  }

  watchGame() {
    if(this.gameIsRunning){
      this.apiService.getCurrentGameStateX01().subscribe(async gameState => {
        this.reactOnNewGameState(gameState);
        await this.delay(1000);
        this.watchGame();
      })
    }
  }

  addMissThrow() {
    this.apiService.handleMiss();
  }

  revertLastThrow() {
    this.apiService.handleUndo();
  }

  evaluateDebugThrow(value: number, valueString: string, position: []):void{
    this.apiService.evaluateThrow(value, valueString, position)
  }

  disableConsoleButtons():boolean {
    return this.players[this.currentPlayerIndex].currentDarts.length === 3 || this.bust.bust || !this.gameIsRunning;
  }

  private reactOnNewGameState(gameState: GameStateX01){
    this.players = gameState.players
    this.points = gameState.points;
    this.bust = {bust: gameState.bust, origin: gameState.players[this.currentPlayerIndex].name};
    if(this.points.indexOf(0) !== -1){
      this.gameIsRunning = false;
      this.endGame(this.points.indexOf(0));
    } 
    this.currentDarts = gameState.players[this.currentPlayerIndex].currentDarts;
    if (this.currentDartPositions.length < gameState.players[this.currentPlayerIndex].currentDartPositions.length) {
      //Dart was removed
      this.resetZoomAfterDartRemoved(gameState.players[this.currentPlayerIndex].currentDartPositions.length - this.currentDartPositions.length);
    }
    this.currentDartPositions = gameState.players[this.currentPlayerIndex].currentDartPositions;
    this.triggerZoom(this.currentDarts.length-1, 2)
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

  private triggerZoom(index: number, zoomLevel: number): void {
    if(this.zoomFields !== undefined) {
      const allThrown = this.zoomFields.toArray().slice(0, index + 1).every(field => field.getIsThrown());
      if(!allThrown){
        for(let i = 0; i < index+1; i++){
          const zoomField = this.zoomFields.toArray()[i];
          if (this.currentDarts.length > 0 && zoomField) {
            const x = this.currentDartPositions[index][0]
            const y = this.currentDartPositions[index][1]
            this.cdr.detectChanges()
            zoomField.zoomOnField(this.customId+i, x, y, zoomLevel, i!==index);
          }
        }
      }
    }
  }

  private resetZoomAfterDartRemoved(amount: number): void {
    console.log(amount)
  }

  private resetZoom(): void {
    this.zoomFields.toArray().forEach((zoomField, index) => {
      zoomField.resetZoom(this.customId + index);
    });
  }
}
