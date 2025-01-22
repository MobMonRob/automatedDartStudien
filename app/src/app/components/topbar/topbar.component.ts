import { CommonModule } from '@angular/common';
import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ScoringZoomViewComponent } from '../scoring-zoom-view/scoring-zoom-view.component';

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
  currentHeading = '';
  headingTmpl = 'Kalibrierung Dart ';
  customId = "calibrateField"

  calibrationPositions: number[][] = [
    [100,200], [150,150], [120,100], [200,100]
  ]

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  navHome(){
    this.router.navigateByUrl('/');
  }

  toggleCalibrationPopup(): void {
    this.isPopupVisible = !this.isPopupVisible;
    this.startCalibrationProcess();
  }

  closeCalibrationPopup(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('popup') || target.classList.contains('close-btn')) {
      event.stopPropagation();
      this.isPopupVisible = false;
      this.resetCalibration();
    }
  }

  startCalibrationProcess() {
    this.currentStep = 0;
    this.showNextStep();
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
    this.currentHeading = '';
  }

  triggerZoom() {
    if(this.zoomField){
      this.cdr.detectChanges()
      this.zoomField.zoomOnField(this.customId, this.calibrationPositions[this.currentStep-1][0],  this.calibrationPositions[this.currentStep-1][1], 2)
    }
  }
}
