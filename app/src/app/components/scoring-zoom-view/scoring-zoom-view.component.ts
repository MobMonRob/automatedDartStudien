import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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

  constructor(private dartEventService: DartEventService) {}

  ngOnInit(): void {
    this.dartFields = new Array(this.availableDarts).fill([]);
    this.throwDartEventSub = this.dartEventService.throwEvent$.subscribe((event) => {
      this.dartFields = event.currentDartPositions
      if(JSON.stringify(this.dartFields) === JSON.stringify([[], [], []])) { this.currentPlayerIndex = 0; } else { this.currentPlayerIndex++; }
      this.onDartHit();
    })
  }

  ngOnDestroy(): void {
    this.throwDartEventSub?.unsubscribe();
  }

  onDartHit(): void {
    console.log(this.dartFields)
    console.log(this.currentPlayerIndex)
    const canvas = document.getElementById('canvas' + (this.currentPlayerIndex-1)) as HTMLCanvasElement;
    console.log(canvas)
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      console.log('drawing')
      console.log(ctx)
      this.drawPoint(ctx, 140, 140);
    }
  }

  private drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  isCurrentFieldThrown(index: number): boolean {
    return this.dartFields[index].length > 0;
  }
}
