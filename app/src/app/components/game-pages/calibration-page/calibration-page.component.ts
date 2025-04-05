import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoringZoomViewComponent } from '../../scoring-zoom-view/scoring-zoom-view.component';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'dartapp-calibration-page',
  standalone: true,
  imports: [CommonModule, ScoringZoomViewComponent],
  templateUrl: './calibration-page.component.html',
  styleUrl: './calibration-page.component.scss'
})
export class CalibrationPageComponent {
  @ViewChild("calibrationZoom") zoomField : ScoringZoomViewComponent | undefined

  currentStep = 0; 
  maximumSteps = 4;
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

  constructor(private cdr: ChangeDetectorRef, private apiService: ApiService) {}

  startCalibrationStep() {
    // this.apiService.initCalibrationStep().subscribe(calibration => {
    //   this.currentHeading = this.headingTmpl + (this.currentStep);
    //   this.isCalibrationStarted = true;
    //   this.evaluateCalibration();
    //   this.triggerZoom()
    //   this.awaitCalibrationStepResult();
    // });
  }

  awaitCalibrationStepResult() {
    // this.apiService.evaluateCalibrationStepResult().subscribe(calibration => {
    //   if (calibration.isFinished) {
    //     this.isCalibrationStarted = false;
    //     this.isPopupVisible = false;
    //   } else if (calibration.isCanceled) {
    //     this.errorMsg = calibration.errorMsg;
    //     this.isCanceled = calibration.isCanceled;
    //   } else {
    //     if (this.currentStep < this.maximumSteps) {
    //       this.startCalibrationStep();
    //     }
    //   }
    // });
  }

  cancelCalibration() {
    this.apiService.cancelCalibration()
    this.isCalibrationStarted = false;
  }

  private evaluateCalibration() {
    
  }

  triggerZoom() {
    if(this.zoomField){
      this.cdr.detectChanges()
      this.zoomField.zoomOnField(this.customId, this.zoomPosition[0],  this.zoomPosition[1], 2, false)
    }
  }
}
