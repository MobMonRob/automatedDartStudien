import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dartapp-scoring-zoom-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoring-zoom-view.component.html',
  styleUrl: './scoring-zoom-view.component.scss'
})
export class ScoringZoomViewComponent {
  @Input() targetPosition!: { x: number, y: number };
  @Input() customId!: string 
  @Input() isThrown!: boolean

  dartboardImage = 'assets/dartboardPicture.png';

  constructor() {}

  zoomOnField(customId: string, x: number, y: number, zoomlevel: number, keepZoom: boolean): void {
    const zoomField = document.getElementById(customId);
    if (zoomField) {
      const container = zoomField.parentElement; 
      if (container) {
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        let xAdapter = 0;
        let yAdapter = 0;

        //Move the zoomed a bit more to the edge of the board to see the numbers clearly
        if(x < containerWidth / 2) {
          if(y < containerHeight / 2) {
            xAdapter = -15;
            yAdapter = -15;
          } else {
            xAdapter = -15;
            yAdapter = 15;
          }
        } else {
          if(y < containerHeight / 2) {
            xAdapter = 15;
            yAdapter = -15;
          } else {
            xAdapter = 15;
            yAdapter = 15;
          }
        }
        
        if (!keepZoom) {
          zoomField.style.transition = 'transform 0.5s ease-in-out';
        } else {
            zoomField.style.transition = 'none';
        }
        
        requestAnimationFrame(() => {
            zoomField.style.transform = `scale(${zoomlevel})`;
            zoomField.style.transformOrigin = `${x + xAdapter}px ${y + yAdapter}px`;
        });
        }
     }
  }

  resetZoom(customId: string): void {
    const zoomField = document.getElementById(customId);
    if (zoomField) {
      zoomField.style.transition = 'transform 0.5s ease-in-out';
      requestAnimationFrame(() => {
        zoomField.style.transform = 'scale(1)';
      });
    }
  }

  getIsThrown(): boolean {
    return this.isThrown;
  }
}
