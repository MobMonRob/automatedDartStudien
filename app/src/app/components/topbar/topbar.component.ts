import { CommonModule } from '@angular/common';
import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ScoringZoomViewComponent } from '../scoring-zoom-view/scoring-zoom-view.component';
import { ApiService } from '../../services/api.service';

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
  currentHeading = 'Kalibriere Die Kameras';
  isCalibrationStarted = false;
  headingTmpl = 'Kalibrierung Dart ';
  customId = "calibrateField"
  errorMsg = "";

  zoomPosition: number[] = [0,0]

  constructor(private router: Router, private cdr: ChangeDetectorRef, private apiService: ApiService) {}

  navHome(){
    this.router.navigateByUrl('/');
  }

  toggleCalibrationPopup(): void {
    this.isPopupVisible = !this.isPopupVisible;
  }

  closeCalibrationPopup(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('popup') || target.classList.contains('close-btn')) {
      event.stopPropagation();
      this.isPopupVisible = false;
      this.resetCalibration();
    }
  }

  showNextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
      this.currentHeading = this.headingTmpl + (this.currentStep);
      this.triggerZoom()
      setTimeout(() => {
        this.showNextStep();
      }, 10000); 
    }
  }

  resetCalibration() {
    this.currentStep = 0;
    this.isCalibrationStarted = false;
  }

  triggerZoom() {
    if(this.zoomField){
      this.cdr.detectChanges()
      this.zoomField.zoomOnField(this.customId, this.zoomPosition[0],  this.zoomPosition[1], 2)
    }
  }

  startCalibration() {
    this.apiService.initCalibration().subscribe(calibration => {
      this.currentStep = 0;
      this.isCalibrationStarted = true;
      this.zoomPosition = calibration.currentZoomPosition;
      this.showNextStep();
    });
  }
}
