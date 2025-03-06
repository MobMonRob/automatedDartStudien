import { CommonModule } from '@angular/common';
import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ScoringZoomViewComponent } from '../scoring-zoom-view/scoring-zoom-view.component';
import { ApiService } from '../../services/api.service';
import { Calibration } from '../../model/calibration.models';

@Component({
  selector: 'dartapp-topbar',
  standalone: true,
  imports: [CommonModule, ScoringZoomViewComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @ViewChild("calibrationZoom") zoomField : ScoringZoomViewComponent | undefined
  
  isPopupVisible: boolean = false;
  currentStep = 0; 
  maximumSteps = 0;
  currentHeading = 'Kalibriere Die Kameras';
  isCalibrationStarted = false;
  headingTmpl = 'Kalibrierung Dart ';
  customId = "calibrateField";
  errorMsg = "";
  instruction = "Starte die Kalibrierung";
  isCanceled = false;
  isFinished = false;
  awaitingResult = false;

  zoomPosition: number[] = [0,0]

  constructor(private router: Router, private cdr: ChangeDetectorRef, private apiService: ApiService) {}

  navHome(){
    this.router.navigateByUrl('/');
  }

  restartTracker(){
    //TODO Nils
    //this.apiService.restartTracker().subscribe();
  }

  toggleCalibrationPopup(): void {
    this.isPopupVisible = !this.isPopupVisible;
  }

  closeCalibrationPopup(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('popup') || target.classList.contains('close-btn')) {
      event.stopPropagation();
      this.cancelCalibration();
    }
  }

  triggerZoom() {
    if(this.zoomField){
      this.cdr.detectChanges()
      this.zoomField.zoomOnField(this.customId, this.zoomPosition[0],  this.zoomPosition[1], 2)
    }
  }

  startCalibrationStep() {
    this.apiService.initCalibrationStep().subscribe(calibration => {
      this.currentHeading = this.headingTmpl + (this.currentStep);
      this.isCalibrationStarted = true;
      this.evaluateCalibration(calibration);
      this.triggerZoom()
      //this.awaitCalibrationStepResult();
    });
  }

  awaitCalibrationStepResult() {
    this.apiService.evaluateCalibrationStepResult().subscribe(calibration => {
      if (calibration.isFinished) {
        this.isCalibrationStarted = false;
        this.isPopupVisible = false;
      } else if (calibration.isCanceled) {
        this.errorMsg = calibration.errorMsg;
        this.isCanceled = calibration.isCanceled;
      } else {
        if (this.currentStep < this.maximumSteps) {
          this.startCalibrationStep();
        }
      }
    });
  }

  cancelCalibration() {
    this.apiService.cancelCalibration().subscribe(calibration => {
      this.evaluateCalibration(calibration);
      this.isPopupVisible = false;
      this.isCalibrationStarted = false;
    });
  }

  private evaluateCalibration(calibration: Calibration) {
    this.currentStep = calibration.currentStep;
    this.maximumSteps = calibration.maximumSteps;
    this.zoomPosition = calibration.currentZoomPosition;
    this.errorMsg = calibration.errorMsg;
    this.isCanceled = calibration.isCanceled;
    this.isFinished = calibration.isFinished;
    this.instruction = calibration.instructionMsg;
  }
}
