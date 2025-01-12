import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DartEventService } from '../../services/dart-event.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'dartapp-scoring-zoom-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoring-zoom-view.component.html',
  styleUrl: './scoring-zoom-view.component.scss'
})
export class ScoringZoomViewComponent implements OnInit, OnDestroy {
  @Input() availableDarts!: number;

  private throwDartEventSub: Subscription | undefined;

  dartboardImage = 'assets/dartboardPicture.png';
  dartFields: number[][] = [];
  currentPlayerIndex = 0;
  calledAfterPlayerChange = false;

  constructor(private dartEventService: DartEventService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.dartFields = new Array(this.availableDarts).fill([]);
    this.throwDartEventSub = this.dartEventService.throwEvent$.subscribe((event) => {
      this.dartFields = event.currentDartPositions
      if(JSON.stringify(this.dartFields) === JSON.stringify([[], [], []])) { this.currentPlayerIndex = 0; this.calledAfterPlayerChange = true} else { this.currentPlayerIndex++; }
      this.onDartHit();
      this.calledAfterPlayerChange = false
    })
  }

  ngOnDestroy(): void {
    this.throwDartEventSub?.unsubscribe();
  }

  onDartHit(): void {
    const zoomLevel = 2;

    if(!this.calledAfterPlayerChange) {
      this.cdr.detectChanges();
      this.zoomOnField(this.currentPlayerIndex-1, this.dartFields[this.currentPlayerIndex-1][0], this.dartFields[this.currentPlayerIndex-1][1], zoomLevel);
    }
  }

  private zoomOnField(index: number, x: number, y: number, zoomlevel: number): void {
    const zoomField = document.getElementById('zoomfield' + index);
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
  
        zoomField.style.transition = 'transform 0.5s ease-in-out';
        requestAnimationFrame(() => {
          zoomField.style.transform = `scale(${zoomlevel})`;
          zoomField.style.transformOrigin = `${x + xAdapter}px ${y + yAdapter}px`;
        });
      }
     }
  }

  isCurrentFieldThrown(index: number): boolean {
    return this.dartFields[index].length > 0;
  }
}
