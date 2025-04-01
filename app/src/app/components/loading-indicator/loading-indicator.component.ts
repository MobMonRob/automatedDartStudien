import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dartapp-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-indicator.component.html',
  styleUrl: './loading-indicator.component.scss'
})
export class LoadingIndicatorComponent {
  @Input() loading: boolean = false;
  @Input() error: boolean = false;
  @Input() errorMsg: string = "";

  reloadPage(): void {
    window.location.reload();
  }
}
