import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoringZoomViewComponent } from '../../scoring-zoom-view/scoring-zoom-view.component';
import { ApiService } from '../../../services/api.service';
import { CalibrationState, CameraState, GameType } from '../../../model/api.models';
import { LoadingIndicatorComponent } from '../../loading-indicator/loading-indicator.component';
import { CalibrationModel, CameraModel } from '../../../model/calibration.model';
import { ComponentUtils } from '../../../utils/utils';
import { Router } from '@angular/router';

@Component({
  selector: 'dartapp-calibration-page',
  standalone: true,
  imports: [CommonModule, ScoringZoomViewComponent, LoadingIndicatorComponent],
  templateUrl: './calibration-page.component.html',
  styleUrl: './calibration-page.component.scss'
})
export class CalibrationPageComponent implements OnInit {
  @ViewChild('calibrationZoom') zoomField: ScoringZoomViewComponent | undefined;
  gameMode: GameType = GameType.LOADING;
  CalibrationState = CalibrationState;
  CameraState = CameraState;
  loading: boolean = true;
  LOADING_MSG: string = 'Eingabe wird verarbeitet...';
  INSTRUCTIONS = [
    'Entferne alle Darts von der Dartscheibe!',
    'Platziere den Dart an der gezeigten Position auf der Dartscheibe und bestätige durch den Knopf unten drunter! Achte darauf, dass du den Dart in der jeweils gezeigten Ecke bündig platzierst.',
    '',
    '',
    'Es ist ein Fehler aufgetreten. Bitte entferne alle Darts von der Dartscheibe und führe den Schritt nochmal durch, sobald die Auforderung erscheint.',
    'Bitte warte, bis die Kalibrierung gestartet ist.'
  ];

  currentPosition: number[] = [];
  calibrationState: CalibrationState = CalibrationState.WAITING_FOR_USER_CONFIRMATION;
  cameras: CameraModel[] = [];
  currentStep = 0;
  maximumSteps = 4;

  currentHeading = 'Kalibriere Die Kameras';
  headingTmpl = 'Kalibrierung Dart - ';
  customId = 'calibrateField';
  instructionIndex = 2;

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.awaitCalibrationStart();
  }

  awaitCalibrationStart() {
    this.apiService.getCurrentGameState().subscribe((game) => {
      this.gameMode = game.gameType;
      if (this.gameMode === GameType.CALIBRATION) {
        this.startCalibaration();
      }
    });
  }

  startCalibaration() {
    this.apiService.getCurrentCalibrationState().subscribe((calibration) => {
      this.reactOnNewCalibrationState(calibration);
      this.watchCalibration();
    });
  }

  watchCalibration() {
    if (this.calibrationState !== CalibrationState.FINISHED) {
      this.apiService.getCurrentCalibrationState().subscribe(async (calibration) => {
        this.reactOnNewCalibrationState(calibration);
        await ComponentUtils.delay(750);
        this.watchCalibration();
      });
    }
  }

  reactOnNewCalibrationState(calibration: CalibrationModel) {
    this.currentPosition = calibration.currentPosition;
    this.calibrationState = calibration.calibrationState;
    this.cameras = calibration.cameras;
    this.currentStep = calibration.calibrationIndex;
    this.maximumSteps = calibration.calibrationCount;

    if(this.errorInCameraDetection(this.cameras) && this.calibrationState === CalibrationState.WAITING_FOR_EMPTY_BOARD) {
      this.instructionIndex = 4;
    } else {
      this.instructionIndex = Math.min(this.calibrationState, 4);
    }

    this.currentHeading =
      this.calibrationState === CalibrationState.FINISHED
        ? 'Kalibrierung abgeschlossen'
        : this.currentStep > 0
          ? this.headingTmpl + this.currentStep
          : 'Kalibriere Die Kameras';
      
    if(this.calibrationState === CalibrationState.WAITING_FOR_USER_CONFIRMATION && this.currentPosition.length > 0) {
      this.triggerZoom();
    } else if(this.calibrationState === CalibrationState.WAITING_FOR_EMPTY_BOARD) {
      this.triggerZoom(1);
    }
  }

  confirmDartPlacement() {
    if (this.calibrationState === CalibrationState.WAITING_FOR_USER_CONFIRMATION) {
      this.apiService.confirmDartPlacement();
    } else {
      this.router.navigateByUrl('/')
    }
  }

  cancelCalibration() {
    this.apiService.cancelCalibration();
  }

  restartCalibration() {
    this.apiService.startCalibration();
  }

  triggerZoom(scale: number = 2) {
    if (this.zoomField) {
      this.cdr.detectChanges();
      this.zoomField.zoomOnField(this.customId, this.currentPosition[0], this.currentPosition[1], scale, false);
    }
  }

  getCameraStateString(state: CameraState): string {
    switch (state) {
      case CameraState.NO_DARTS:
        return 'Keine Darts erkannt';
      case CameraState.TOO_MANY_DARTS:
        return 'Fehler - Zu viele Darts erkannt';
      case CameraState.CONFIRMING_POSITION:
        return 'Darts erkannt - Position wird bestätigt';
      case CameraState.CONFIRMED_POSITION:
        return 'Erfolg - Position bestätigt';
      default:
        return 'Unbekannter Zustand';
    }
  }

  getEvaluationStyle(evaluation: number | undefined) {
    if (evaluation == null || evaluation === undefined || evaluation <= 0) {
      return { backgroundColor: 'black', color: 'white' };
    }
  
    const green = { r: 40, g: 167, b: 69 }; 
    const yellow = { r: 226, g: 209, b: 54 };
    const red = { r: 244, g: 67, b: 54 };  
  
    let r, g, b;
  
    if (evaluation < 0.5) {
      r = Math.round(red.r + (yellow.r - red.r) * (evaluation * 2) * 1.5);
      g = Math.round(red.g + (yellow.g - red.g) * (evaluation * 2) * 1.1);
      b = Math.round(red.b + (yellow.b - red.b) * (evaluation * 2) * 1.1); 
    } else {
      r = Math.round(yellow.r + (green.r - yellow.r) * ((evaluation - 0.5) * 2) * 1.1); 
      g = Math.round(yellow.g + (green.g - yellow.g) * ((evaluation - 0.5) * 2) * 1.5); 
      b = Math.round(yellow.b + (green.b - yellow.b) * ((evaluation - 0.5) * 2) * 1.1); 
    }
  
    const backgroundColor = `rgb(${r}, ${g}, ${b})`;
  
    return {
      backgroundColor: backgroundColor,
      color: 'white',
    };
  }

  errorInCameraDetection(camera: CameraModel[]): boolean {
    for (let i = 0; i < camera.length; i++) {
      if (camera[i].state === CameraState.TOO_MANY_DARTS) {
        return true;
      }
    }
    return false
  }
}
