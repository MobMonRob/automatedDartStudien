import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../topbar/topbar.component';
import { DebugNumberConsoleComponent } from '../../debug-number-console/debug-number-console.component';
import { LoadingIndicatorComponent } from '../../loading-indicator/loading-indicator.component';
import { DebugComponent, ThrowEditor } from '../../../model/debug.model';
import { GameType } from '../../../model/api.models';
import { ApiService } from '../../../services/api.service';
import { ComponentUtils } from '../../../utils/utils';
//GamePages
import { GamestateComponent } from '../gamestate-x01/gamestate.component';
import { TestingComponent } from '../testing/testing.component';
import { CalibrationPageComponent } from '../calibration-page/calibration-page.component';

@Component({
  selector: 'dartapp-game-page-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    DebugNumberConsoleComponent,
    LoadingIndicatorComponent,
    GamestateComponent,
    CalibrationPageComponent,
    TestingComponent
  ],
  templateUrl: './game-page-wrapper.component.html',
  styleUrl: './game-page-wrapper.component.scss'
})
export class GamePageWrapperComponent implements DebugComponent, OnInit, ThrowEditor {
  GameType = GameType;
  gameMode: GameType = GameType.LOADING;
  retryCounter = 0;
  MAX_RETRIES = 7;
  LOADING_MSG = "Lade Spiel...";

  requestedGameType: GameType = GameType.LOADING;

  editingMode: boolean = false;
  selectedDartIndex: number | null = null;
  changes: { value: number; valueString: string; position: number[]; replacementIndex: number }[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    const state = window.history.state;
    if (state) {
      this.requestedGameType = state['requestedGameType'];
    }
    this.awaitGameStart();
  }

  awaitGameStart() {
    this.apiService.getCurrentGameState().subscribe(async (game) => {
      console.log(game);
      this.gameMode = game.gameType;
      if (
        this.requestedGameType !== undefined &&
        this.requestedGameType !== this.gameMode &&
        this.retryCounter < this.MAX_RETRIES
      ) {
        this.gameMode = GameType.LOADING;
        this.retryCounter++;
        await ComponentUtils.delay(500);
        this.awaitGameStart();
      } else if (
        this.gameMode !== GameType.LOADING &&
        this.gameMode !== GameType.ERROR &&
        this.gameMode !== GameType.CALIBRATION &&
        game.players.length === 0 
      ) {
        if (this.retryCounter < this.MAX_RETRIES) {
          this.gameMode = GameType.LOADING;
          this.retryCounter++;
          await ComponentUtils.delay(500);
          this.awaitGameStart();
        } else {
          this.gameMode = GameType.ERROR;
          console.log('Error retreiving player data');
        }
      } else if (this.gameMode === GameType.LOADING) {
        await ComponentUtils.delay(500);
        this.awaitGameStart();
      }
    });
  }

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

  selectDart(index: number) {
    this.selectedDartIndex = index;
  }

  toggleEditingMode(reason: number) {
    if (this.editingMode) {
      this.changes.sort((a, b) => a.replacementIndex - b.replacementIndex);
      this.changes.forEach((change) => {
        this.apiService.replaceDebugThrow(change.replacementIndex, change.value, change.valueString, reason, change.position);
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
