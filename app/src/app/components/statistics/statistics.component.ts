import { Component, Input } from '@angular/core';

@Component({
  selector: 'dartapp-statistics',
  standalone: true,
  imports: [],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent {
  @Input() scores: number[] = [];

  getHighestScore(): number {
    return Math.max(...this.scores);
  }

  getTotalPoints(): number {
    return this.scores.reduce((a, b) => a + b, 0);
  }
}