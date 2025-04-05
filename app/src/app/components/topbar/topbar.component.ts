import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ScoringZoomViewComponent } from '../scoring-zoom-view/scoring-zoom-view.component';
import { ApiService } from '../../services/api.service';
import { GameType } from '../../model/api.models';

@Component({
  selector: 'dartapp-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  navHome() {
    this.router.navigateByUrl('/');
  }

  restartTracker() {
    this.apiService.restartTracker();
  }

  startCalibration(): void {
    this.apiService.startCalibration();
    this.router.navigateByUrl('/game', {
      state: { requestedGameType: GameType.CALIBRATION }
    });
    history.replaceState({ ...history.state, requestedGameType: GameType.CALIBRATION }, '');
  }
}
