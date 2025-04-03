import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopbarComponent } from '../../topbar/topbar.component';
import { DebugComponent } from '../../../model/debug.model';
import { DebugNumberConsoleComponent } from '../../debug-number-console/debug-number-console.component';
import { LoadingIndicatorComponent } from '../../loading-indicator/loading-indicator.component';
import { ApiService } from '../../../services/api.service';
import { Player } from '../../../model/player.model';
import { GameState } from '../../../model/game.model';
import { ComponentUtils } from '../../../utils/utils';
import { GameType, Reasons } from '../../../model/api.models';

@Component({
  selector: 'dartapp-testing',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent, DebugNumberConsoleComponent, LoadingIndicatorComponent],
  templateUrl: './testing.component.html',
  styleUrl: './testing.component.scss'
})
export class TestingComponent implements OnInit, DebugComponent {
  GameType = GameType;
  reasonsEnum = Reasons;
  public reasons = Object.entries(Reasons)
    .filter(([key, value]) => typeof value === 'number') 
    .map(([key, value]) => ({ key, value }));
  selectedReason: Reasons = 0;
  gameMode: GameType = GameType.LOADING;
  players: Player[] = [];
  currentPlayerIndex = 0;
  gameIsRunning = true;
  reason = '';

  editingMode: boolean = false;
  selectedDartIndex: number | null = null;
  changes: { value: number; valueString: string; position: number[]; replacementIndex: number }[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.awaitGameStart();
  }

  awaitGameStart() {
    this.apiService.getCurrentGameState().subscribe(async (game) => {
      this.gameMode = game.gameType;
      console.log(this.gameMode);
      if (this.gameMode === GameType.TESTING && game.players.length > 0) {
        this.startGame(game);
      } else if (this.gameMode === GameType.TESTING && game.players.length === 0) {
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
    this.currentPlayerIndex = game.currentPlayerIndex;
    this.gameIsRunning = true;
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

  reactOnNewGameState(gameState: GameState) {
    this.players = gameState.players;
    this.currentPlayerIndex = gameState.currentPlayerIndex;
  }

  disableEditingMode() {
    this.editingMode = false;
    this.selectedDartIndex = null;
    this.changes = [];
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
      });
      this.disableEditingMode();
    } else {
      this.editingMode = true;
      this.selectedDartIndex = null;
    }
  }

  private findHighestReplacementIndex(): number {
    return this.changes.reduce((max, change) => Math.max(max, change.replacementIndex), -1);
  }

  selectDart(index: number, playerIndex: number) {
    if (
      this.editingMode &&
      playerIndex === this.currentPlayerIndex &&
      (this.players[this.currentPlayerIndex].currentDarts.length >= index || this.findHighestReplacementIndex() >= (index)-1)
    ) {
      this.selectedDartIndex = index;
    }
  }

  getUpdatedDartValue(playerIndex: number, dartIndex: number, defaultValue: string): string {
    if (playerIndex !== this.currentPlayerIndex) {
      return defaultValue;
    } else {
      const change = this.changes.find((change) => change.replacementIndex === dartIndex);
      return change ? change.valueString : defaultValue;
    }
  }

  evaluateDebugThrow(value: number, valueString: string, position: number[]): void {
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

  disableConsoleButtons(): boolean {
    return !this.editingMode;
  }

  onEnumOptionChange(event: any) {
    this.reason = event.target.value;
  }

  //TODO Utils Out Source + Wrapper for GameStates
}
