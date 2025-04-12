import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../topbar/topbar.component';
import { DebugNumberConsoleComponent } from '../../debug-number-console/debug-number-console.component';
import { LoadingIndicatorComponent } from '../../loading-indicator/loading-indicator.component';
import { CameraDebugComponent, DebugComponent, ThrowEditor } from '../../../model/debug.model';
import { GameType } from '../../../model/api.models';
import { ApiService } from '../../../services/api.service';
import { ComponentUtils } from '../../../utils/utils';
//GamePages
import { GamestateComponent } from '../gamestate-x01/gamestate.component';
import { TestingComponent } from '../testing/testing.component';
import { CalibrationPageComponent } from '../calibration-page/calibration-page.component';
import { CameraPopupComponent } from '../camera-popup/camera-popup.component';
import { firstValueFrom, Subscription } from 'rxjs';
import { REFRESH_GAME_PAGES_DELAY } from '../../../model/game.const';

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
    TestingComponent,
    CameraPopupComponent
  ],
  templateUrl: './game-page-wrapper.component.html',
  styleUrl: './game-page-wrapper.component.scss'
})
export class GamePageWrapperComponent implements DebugComponent, OnInit, ThrowEditor, CameraDebugComponent, OnDestroy {
  GameType = GameType;
  gameMode: GameType = GameType.LOADING;
  retryCounter = 0;
  MAX_RETRIES = 15;
  LOADING_MSG = 'Lade Spiel...';

  requestedGameType: GameType = GameType.LOADING;

  editingMode: boolean = false;
  selectedDartIndex: number | null = null;
  changes: { value: number; valueString: string; position: number[]; replacementIndex: number }[] = [];

  cameraPopupVisible: boolean = false;
  feedSubscription: Subscription | null = null;
  videoSource: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    const state = window.history.state;
    if (state) {
      this.requestedGameType = state['requestedGameType'];
    }
    this.awaitGameStart();
  }

  ngOnDestroy(): void {
    this.videoSource = null;
  }

  async awaitGameStart(): Promise<void> {
    this.retryCounter = 0;
    let invalidStateCounter = 0;
    const MAX_INVALID_STATE_RETRIES = 10;

    while (this.retryCounter < this.MAX_RETRIES) {
      try {
        const game = await firstValueFrom(this.apiService.getCurrentGameState());
        console.log(game);
        if (game.gameType === GameType.LOADING) {
          await ComponentUtils.delay(REFRESH_GAME_PAGES_DELAY);
          this.retryCounter++;
          continue;
        }

        if (game.gameType === GameType.ERROR) {
          console.error('GameType ist ERROR – sofortiger Abbruch.');
          this.gameMode = GameType.ERROR;
          return;
        }

        const isCalibrationGameType = game.gameType === GameType.CALIBRATION;

        const correctGameTypeRequested = this.requestedGameType === undefined || this.requestedGameType === game.gameType;

        if (!isCalibrationGameType && correctGameTypeRequested && game.players.length > 0) {
          this.gameMode = game.gameType;
          console.log('Spielstart erfolgreich erkannt:', game);
          return;
        } else if (isCalibrationGameType && correctGameTypeRequested) {
          this.gameMode = game.gameType;
          console.log('Calibration erfolgreich erkannt:', game);
          return;
        }

        invalidStateCounter++;
        console.warn(`Ungültiger Spielzustand (${invalidStateCounter}/${MAX_INVALID_STATE_RETRIES}):`, game);

        if (invalidStateCounter >= MAX_INVALID_STATE_RETRIES) {
          this.gameMode = GameType.ERROR;
          console.warn('Spiel konnte nach wiederholten ungültigen Zuständen nicht gestartet werden.');
          return;
        }

        this.gameMode = GameType.LOADING;
        await ComponentUtils.delay(REFRESH_GAME_PAGES_DELAY);
      } catch (error) {
        console.error('Fehler beim Laden des Spielzustands:', error);
        this.retryCounter++;
        await ComponentUtils.delay(REFRESH_GAME_PAGES_DELAY);
      }
    }

    console.warn('Maximale Anzahl an Versuchen erreicht. Spielstart fehlgeschlagen.');
    this.gameMode = GameType.ERROR;
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

  toggleCameraPopup(index: number): void {
    this.cameraPopupVisible = !this.cameraPopupVisible;
    this.videoSource = this.apiService.getVideoSource(index);
  }

  closeCameraPopup(): void {
    this.cameraPopupVisible = false;
    this.videoSource = null;
  }
}
