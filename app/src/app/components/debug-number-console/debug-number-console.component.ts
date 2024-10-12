import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GamestateComponent } from '../game-pages/gamestate-x01/gamestate.component';

@Component({
  selector: 'dartapp-debug-number-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './debug-number-console.component.html',
  styleUrl: './debug-number-console.component.scss'
})
export class DebugNumberConsoleComponent {
  fields = [
    { name: '20', value: 20 },
    { name: '19', value: 19 },
    { name: '18', value: 18 },
    { name: '17', value: 17 },
    { name: '16', value: 16 },
    { name: '15', value: 15 },
    { name: '14', value: 14 },
    { name: '13', value: 13 },
    { name: '12', value: 12 },
    { name: '11', value: 11 },
    { name: '10', value: 10 },
    { name: '9', value: 9 },
    { name: '8', value: 8 },
    { name: '7', value: 7 },
    { name: '6', value: 6 },
    { name: '5', value: 5 },
    { name: '4', value: 4 },
    { name: '3', value: 3 },
    { name: '2', value: 2 },
    { name: '1', value: 1 },
    { name: 'Bull', value: 25 }
  ];

  constructor(private gamestateComponent: GamestateComponent) {}

  evaluateInput(field: string, multiplier: number) {
    let score = this.fields.find((f) => f.name === field)?.value || 0;
    let totalScore = score * multiplier;

    if (field === 'Random') {
      score = Math.floor(Math.random() * 20);
      multiplier = Math.floor(Math.random() * 3) + 1;
      totalScore = score * multiplier;
    }

    console.log(this.getDartValueString(score, multiplier));
    this.gamestateComponent.evaluateDebugThrow(totalScore, this.getDartValueString(score, multiplier));
  }

  disableConsole(): boolean {
    return this.gamestateComponent.disableConsoleButtons();
  }

  private getDartValueString(value: number, multiplier: number) {
    switch (multiplier) {
      case 2: {
        return `D${value}`;
      }
      case 3: {
        return `T${value}`;
      }
      default: {
        return `${value}`;
      }
    }
  }
}
