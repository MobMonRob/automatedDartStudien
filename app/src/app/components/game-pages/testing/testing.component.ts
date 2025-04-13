import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraDebugComponent, CameraDebugPresenter, ThrowEditor } from '../../../model/debug.model';
import { ApiService } from '../../../services/api.service';
import { Player } from '../../../model/player.model';
import { GameState } from '../../../model/game.model';
import { ComponentUtils } from '../../../utils/utils';
import { GameType, Reasons } from '../../../model/api.models';
import { ReasonGroupComponent } from '../reason-group/reason-group.component';
import { CameraStatusComponent } from '../camera-status/camera-status.component';
import { REFRESH_GAME_PAGES_DELAY } from '../../../model/game.const';

@Component({
  selector: 'dartapp-testing',
  standalone: true,
  imports: [CommonModule, ReasonGroupComponent, CameraStatusComponent],
  templateUrl: './testing.component.html',
  styleUrl: './testing.component.scss'
})
export class TestingComponent implements OnInit, CameraDebugPresenter {
  @Input() wrapperComponent!: ThrowEditor & CameraDebugComponent;
  @Input() editingMode!: boolean;
  @Input() selectedDartIndex!: number | null;
  @Input() changes!: { value: number; valueString: string; position: number[]; replacementIndex: number }[];

  GameType = GameType;
  selectedReason: Reasons = 0;
  gameMode: GameType = GameType.LOADING;
  players: Player[] = [];
  currentPlayerIndex = 0;
  gameIsRunning = true;
  reason = '';
  cameraStatus: boolean[] = [];
  showWarning = false;

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
      }
    });
  }

  startGame(game: GameState) {
    this.players = game.players;
    this.currentPlayerIndex = game.currentPlayerIndex;
    this.gameIsRunning = true;
    this.cameraStatus = game.cameraStatus;
    this.watchGame();
  }

  watchGame() {
    if (this.gameIsRunning) {
      this.apiService.getCurrentGameState().subscribe(async (gameState) => {
        this.reactOnNewGameState(gameState);
        await ComponentUtils.delay(REFRESH_GAME_PAGES_DELAY);
        this.watchGame();
      });
    }
  }

  reactOnNewGameState(gameState: GameState) {
    this.players = gameState.players;
    this.currentPlayerIndex = gameState.currentPlayerIndex;
    this.cameraStatus = gameState.cameraStatus;

    const notAllCamerasReset = this.cameraStatus.some((status) => !status) && !this.cameraStatus.every((status) => !status);

    const darts = this.players[this.currentPlayerIndex].currentDarts;

    if (darts.length === 3 && notAllCamerasReset) {
      setTimeout(() => {
        const stillNotAllReset = this.cameraStatus.some((status) => status) && !this.cameraStatus.every((status) => status);
        const stillThreeDarts = this.players[this.currentPlayerIndex].currentDarts.length === 3;

        if (stillThreeDarts && stillNotAllReset) {
          this.showWarning = true;
        }
      }, REFRESH_GAME_PAGES_DELAY*2);
    } else {
      this.showWarning = false;
    }
  }

  disableEditingMode() {
    this.wrapperComponent.disableEditingMode();
  }

  toggleEditingMode() {
    if (this.editingMode) {
      this.changes.forEach((change) => {
        this.players[this.currentPlayerIndex].currentDarts[change.replacementIndex] = change.valueString;
      });
    }
    this.wrapperComponent.toggleEditingMode(this.selectedReason);
  }

  private findHighestReplacementIndex(): number {
    return this.changes.reduce((max, change) => Math.max(max, change.replacementIndex), -1);
  }

  selectDart(index: number, playerIndex: number) {
    if (
      this.editingMode &&
      playerIndex === this.currentPlayerIndex &&
      (this.players[this.currentPlayerIndex].currentDarts.length >= index || this.findHighestReplacementIndex() >= index - 1)
    ) {
      this.wrapperComponent.selectDart(index);
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

  evaluateCameraStatusClick(index: number): void {
    this.wrapperComponent.toggleCameraPopup(index);
  }
}
