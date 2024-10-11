import { Component, Input } from '@angular/core';

@Component({
  selector: 'dartapp-player-card',
  standalone: true,
  imports: [],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss'
})
export class PlayerCardComponent {
  @Input() name!: string;
  @Input() points!: string;
  @Input() darts!: string;
  @Input() average!: string;
}
