import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dartapp-scoring-zoom-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoring-zoom-view.component.html',
  styleUrl: './scoring-zoom-view.component.scss'
})
export class ScoringZoomViewComponent implements OnInit, OnDestroy, OnChanges {
  @Input() targetPosition!: { x: number, y: number };

  dartboardImage = 'assets/dartboardPicture.png';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // this.dartFields = new Array(this.availableDarts).fill([]);
    // this.throwDartEventSub = this.dartEventService.throwEvent$.subscribe((event) => {
    //   this.dartFields = event.currentDartPositions
    //   if(JSON.stringify(this.dartFields) === JSON.stringify([[], [], []])) { this.currentPlayerIndex = 0; this.calledAfterPlayerChange = true} else { this.currentPlayerIndex++; }
    //   this.onDartHit();
    //   this.calledAfterPlayerChange = false
    // })
  }

  ngOnDestroy(): void {
    this.targetPosition = { x: 0, y: 0 };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['targetPosition']) {
      const currentPosition = changes['targetPosition'].currentValue;
      if (currentPosition) {
        //this.zoomOnField(currentPosition);
      }
    }
  }

  onDartHit(): void {
    const zoomLevel = 2;

    // if(!this.calledAfterPlayerChange) {
    //   this.cdr.detectChanges();
    //   this.zoomOnField(this.currentPlayerIndex-1, this.dartFields[this.currentPlayerIndex-1][0], this.dartFields[this.currentPlayerIndex-1][1], zoomLevel);
    // }
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

  isCurrentFieldThrown(): boolean {
    return this.targetPosition.x !== 0 || this.targetPosition.y !== 0;
  }
}
