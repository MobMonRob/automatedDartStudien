import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CameraDebugPresenter } from '../../../model/debug.model';

@Component({
  selector: 'dartapp-camera-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camera-status.component.html',
  styleUrl: './camera-status.component.scss'
})
export class CameraStatusComponent {
  @Input() cameraStatus: boolean[] = [];
  @Input() displayComponent!: CameraDebugPresenter;

  handleCameraStatusClick(index: number) {
    this.displayComponent.evaluateCameraStatusClick(index);
  }
}
