import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dartapp-player-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss'
})
export class PlayerCardComponent {
  @Input() name!: string;
  @Input() points!: number;
  @Input() darts!: number;
  @Input() average!: number;
  @Input() lastDarts!: number[];
}
