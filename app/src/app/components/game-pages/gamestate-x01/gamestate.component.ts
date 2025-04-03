import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { ApiService } from '../../../services/api.service';
import { GameState } from '../../../model/game.model';
import { DebugNumberConsoleComponent } from '../../debug-number-console/debug-number-console.component';
import { TopbarComponent } from '../../topbar/topbar.component';
import { DebugComponent } from '../../../model/debug.model';
import { ScoringZoomViewComponent } from '../../scoring-zoom-view/scoring-zoom-view.component';
import { Player } from '../../../model/player.model';
import { LoadingIndicatorComponent } from '../../loading-indicator/loading-indicator.component';
import { ComponentUtils } from '../../../utils/utils';
import { GameType, Reasons } from '../../../model/api.models';

@Component({
  selector: 'dartapp-gamestate',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerCardComponent, DebugNumberConsoleComponent, TopbarComponent, ScoringZoomViewComponent, LoadingIndicatorComponent],
  templateUrl: './gamestate.component.html',
  styleUrl: './gamestate.component.scss'
})
export class GamestateComponent implements OnInit, DebugComponent {
  @ViewChildren('zoomField') zoomFields!: QueryList<ScoringZoomViewComponent>;
  GameType = GameType;

  players: Player[] = [];
  gameMode: GameType = GameType.LOADING;
  currentPlayerIndex = 0;
  points: number[] = [];
  darts: number[] = [];
  currentDartPositions: number[][] = [];
  averages: number[] = [];
  currentDarts: string[] = [];
  gameIsRunning = false;
  bust = { bust: false, origin: '' };

  customId = 'mainZoomField';

  editingMode: boolean = false;
  selectedDartIndex: number | null = null;
  changes: { value: number; valueString: string; position: number[]; replacementIndex: number }[] = [];
  public reasons = Object.entries(Reasons)
      .filter(([key, value]) => typeof value === 'number') 
      .map(([key, value]) => ({ key, value }));
  selectedReason: Reasons = 0;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.awaitGameStart();
  }

  awaitGameStart() {
    this.apiService.getCurrentGameState().subscribe(async (game) => {
      console.log(game);
      this.gameMode = game.gameType;
      if (this.gameMode === GameType.X01 && game.players.length > 0) {
        this.startGame(game);
      } else if (this.gameMode === GameType.X01 && game.players.length === 0) {
        this.gameMode = GameType.ERROR;
        console.log('Error retreiving player data');
      } else if (this.gameMode === GameType.LOADING) {
        await ComponentUtils.delay(1000);
        this.awaitGameStart();
      } else {
        console.log('Error retreiving game data');
      }
    });
  }

  startGame(game: GameState) {
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
    if (this.gameIsRunning) {
      this.apiService.getCurrentGameState().subscribe(async (gameState) => {
        this.reactOnNewGameState(gameState);
        await ComponentUtils.delay(1000);
        this.watchGame();
      });
    }
  }

  private reactOnNewGameState(gameState: GameState) {
    this.players = gameState.players;
    this.points = gameState.points;
    this.bust = { bust: gameState.bust, origin: gameState.players[this.currentPlayerIndex].name };
    if (this.points.indexOf(0) !== -1) {
      this.gameIsRunning = false;
      this.endGame(this.points.indexOf(0));
    }
    this.currentDarts = gameState.players[this.currentPlayerIndex].currentDarts;
    if (this.currentDartPositions.length < gameState.players[this.currentPlayerIndex].currentDartPositions.length) {
      //Dart was removed TODO
      this.resetZoomAfterDartRemoved(
        gameState.players[this.currentPlayerIndex].currentDartPositions.length - this.currentDartPositions.length
      );
    }
    this.currentDartPositions = gameState.players[this.currentPlayerIndex].currentDartPositions;
    this.triggerZoom(this.currentDarts.length - 1, 2);
    this.darts = gameState.darts;
    this.averages = gameState.averages;
    this.currentPlayerIndex = gameState.currentPlayerIndex;
  }

  private endGame(winnerIndex: number) {
    const playerCards = document.querySelectorAll('.player-card');

    playerCards.forEach((card) => {
      card.classList.remove('winner-card');
    });

    playerCards[winnerIndex * 2].classList.add('winner-card');
  }

  private triggerZoom(index: number, zoomLevel: number): void {
    if (this.zoomFields !== undefined) {
      const allThrown = this.zoomFields
        .toArray()
        .slice(0, index + 1)
        .every((field) => field.getIsThrown());
      if (!allThrown) {
        for (let i = 0; i < index + 1; i++) {
          const zoomField = this.zoomFields.toArray()[i];
          if (this.currentDarts.length > 0 && zoomField) {
            const x = this.currentDartPositions[i][0];
            const y = this.currentDartPositions[i][1];
            this.cdr.detectChanges();
            zoomField.zoomOnField(this.customId + i, x, y, zoomLevel, i !== index);
          }
        }
      }
    }
  }

  private resetZoomAfterDartRemoved(amount: number): void {
    console.log(amount);
  }

  private resetZoom(): void {
    this.zoomFields.toArray().forEach((zoomField, index) => {
      zoomField.resetZoom(this.customId + index);
    });
  }

  disableMissedButtons(): boolean {
    return this.players[this.currentPlayerIndex].currentDarts.length === 3 || this.bust.bust || !this.gameIsRunning;
  }

  //Correction Service
  disableConsoleButtons(): boolean {
    return !this.editingMode;
  }

  evaluateDebugThrow(value: number, valueString: string, position: []): void {
    if (this.editingMode) {
      if (this.selectedDartIndex !== null) {
        const existingIndex = this.changes.findIndex((change) => change.replacementIndex === this.selectedDartIndex);

        if (existingIndex !== -1) {
          this.changes[existingIndex] = { value, valueString, position, replacementIndex: this.selectedDartIndex };
        } else {
          this.changes.push({ value, valueString, position, replacementIndex: this.selectedDartIndex });
        }
      }
    }
  }

  getDartValue(index: number): string | number {
    const change = this.changes.find(change => change.replacementIndex === index);
    return change ? change.valueString || change.value : this.players[this.currentPlayerIndex].currentDarts[index];
  }

  private findHighestReplacementIndex(): number {
    return this.changes.reduce((max, change) => Math.max(max, change.replacementIndex), -1);
  }

  selectDart(index: number) {
    if(this.editingMode &&
      (this.players[this.currentPlayerIndex].currentDarts.length >= index || this.findHighestReplacementIndex() === (index-1))
    ){
      this.selectedDartIndex = index;
    }
  }

  toggleEditingMode() {
    if (this.editingMode) {
      this.changes.sort((a, b) => a.replacementIndex - b.replacementIndex);
      this.changes.forEach((change) => {
        this.apiService.replaceDebugThrow(
          change.replacementIndex,
          change.value,
          change.valueString,
          this.selectedReason,
          change.position
        );
      });
      this.changes.forEach((change) => {
        this.players[this.currentPlayerIndex].currentDarts[change.replacementIndex] = change.valueString;
      this.players[this.currentPlayerIndex].currentDartPositions[change.replacementIndex] = change.position;
      });
      this.disableEditingMode();
    } else {
      this.editingMode = true;
      this.selectedDartIndex = null;
    }
  }

  disableEditingMode() {
    this.editingMode = false;
    this.selectedDartIndex = null;
    this.changes = [];
  }
}
