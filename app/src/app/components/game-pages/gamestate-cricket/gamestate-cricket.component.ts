import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { ApiService } from '../../../services/api.service';
import { GameState } from '../../../model/game.model';
import { DebugNumberConsoleComponent } from '../../debug-number-console/debug-number-console.component';
import { TopbarComponent } from '../../topbar/topbar.component';
import { DebugComponent } from '../../../model/debug.model';
import { Player } from '../../../model/player.model';

@Component({
  selector: 'dartapp-gamestate-cricket',
  standalone: true,
  imports: [CommonModule, PlayerCardComponent, DebugNumberConsoleComponent, TopbarComponent],
  templateUrl: './gamestate-cricket.component.html',
  styleUrl: './gamestate-cricket.component.scss'
})
export class GamestateCricketComponent implements OnInit, DebugComponent {
  players: Player[] = [];
  playersCricketSide: Player[] = [];
  gameMode: string = '';
  currentPlayerIndex = 0;
  points: number[] = [];
  darts: number[] = [];
  averages: number[] = [];
  currentDarts: string[] = [];
  gameIsRunning = false;
  bust = { bust: false, origin: '' };
  cricketNumbers = ['15', '16', '17', '18', '19', '20', 'B'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // this.apiService.getInitStateOfCurrentGameX01().subscribe(game => {
    //   this.gameMode = game.gameType;
    //   this.startGame(game);
    // })
  }

  startGame(game: GameState) {
    this.players = game.players;
    this.playersCricketSide = this.insertIntoMiddle(game.players, {
      currentDarts: [],
      id: '',
      name: '',
      currentDartPositions: [[], [], []]
    });
    this.points = game.points;
    this.darts = game.darts;
    this.averages = game.averages;
    this.gameIsRunning = true;
    this.currentPlayerIndex = game.currentPlayerIndex;
  }

  addMissThrow() {
    //this.apiService.evaluateThrow(0,"0", [0,0])
  }

  nextPlayer() {
    // this.apiService.evaluateNextPlayerX01().subscribe(gameState => {
    //   this.reactOnNewGameState(gameState);
    // });
  }

  evaluateDebugThrow(value: number, valueString: string, position: number[]) {
    //this.apiService.evaluateThrow(value,valueString, position)
  }

  disableConsoleButtons(): boolean {
    return this.players[this.currentPlayerIndex].currentDarts.length === 3 || this.bust.bust || !this.gameIsRunning;
  }

  private reactOnNewGameState(gameState: GameState) {
    this.points = gameState.points;
    this.bust = { bust: gameState.bust, origin: gameState.players[this.currentPlayerIndex].name };
    if (this.points.indexOf(0) !== -1) {
      this.gameIsRunning = false;
      this.endGame(this.points.indexOf(0));
    }
    this.currentDarts = gameState.players[this.currentPlayerIndex].currentDarts;
    this.darts = gameState.darts;
    this.averages = gameState.averages;
    this.currentPlayerIndex = gameState.currentPlayerIndex;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private endGame(winnerIndex: number) {
    const playerCards = document.querySelectorAll('.player-card');

    playerCards.forEach((card) => {
      card.classList.remove('winner-card');
    });

    playerCards[winnerIndex * 2].classList.add('winner-card');
  }

  private insertIntoMiddle<T>(array: T[], element: T): T[] {
    const middleIndex = Math.ceil(array.length / 2);

    array.splice(middleIndex, 0, element);

    return array;
  }
}
