import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dartapp-camera-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camera-popup.component.html',
  styleUrls: ['./camera-popup.component.scss']
})
export class CameraPopupComponent {
  @Input() visible: boolean = false; 
  @Input() videoSource: string | null = null;
  @Output() close = new EventEmitter<void>();

  constructor() {}

  closePopup(): void {
    this.close.emit();
  }
}
