import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ScoringZoomViewComponent } from '../scoring-zoom-view/scoring-zoom-view.component';
import { DartEventService } from '../../services/dart-event.service';

@Component({
  selector: 'dartapp-topbar',
  standalone: true,
  imports: [CommonModule, ScoringZoomViewComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  isPopupVisible: boolean = false;
  currentStep = 0; 
  currentHeading = '';
  headingTmpl = 'Kalibrierung Dart ';

  constructor(private router: Router, private dartEventService: DartEventService) {}

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
      this.dartEventService.emitThrowEvent([[127,125]])
      setTimeout(() => {
        this.showNextStep();
      }, 10000); 
    }
  }

  resetCalibration() {
    this.currentStep = 0;
    this.currentHeading = '';
  }
}
