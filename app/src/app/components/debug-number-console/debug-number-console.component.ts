import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GamestateComponent } from '../game-pages/gamestate-x01/gamestate.component';
import { DebugComponent } from '../../model/debug.model';

@Component({
  selector: 'dartapp-debug-number-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './debug-number-console.component.html',
  styleUrl: './debug-number-console.component.scss'
})
export class DebugNumberConsoleComponent {
  @Input() component!: DebugComponent;

  fields = [
    { name: '20', value: 20, positions: { single: [100, 200], double: [120, 220], triple: [110, 210] } },
    { name: '19', value: 19, positions: { single: [150, 250], double: [170, 270], triple: [160, 260] } },
    { name: '18', value: 18, positions: { single: [200, 300], double: [220, 320], triple: [210, 310] } },
    { name: '17', value: 17, positions: { single: [250, 350], double: [270, 370], triple: [260, 360] } },
    { name: '16', value: 16, positions: { single: [300, 400], double: [320, 420], triple: [310, 410] } },
    { name: '15', value: 15, positions: { single: [350, 450], double: [370, 470], triple: [360, 460] } },
    { name: '14', value: 14, positions: { single: [400, 100], double: [420, 120], triple: [410, 110] } },
    { name: '13', value: 13, positions: { single: [450, 150], double: [470, 170], triple: [460, 160] } },
    { name: '12', value: 12, positions: { single: [50, 250], double: [70, 270], triple: [60, 260] } },
    { name: '11', value: 11, positions: { single: [100, 300], double: [120, 320], triple: [110, 310] } },
    { name: '10', value: 10, positions: { single: [150, 350], double: [170, 370], triple: [160, 360] } },
    { name: '9', value: 9, positions: { single: [200, 400], double: [220, 420], triple: [210, 410] } },
    { name: '8', value: 8, positions: { single: [250, 450], double: [270, 470], triple: [260, 460] } },
    { name: '7', value: 7, positions: { single: [300, 50], double: [320, 70], triple: [310, 60] } },
    { name: '6', value: 6, positions: { single: [350, 100], double: [370, 120], triple: [360, 110] } },
    { name: '5', value: 5, positions: { single: [400, 150], double: [420, 170], triple: [410, 160] } },
    { name: '4', value: 4, positions: { single: [450, 200], double: [470, 220], triple: [460, 210] } },
    { name: '3', value: 3, positions: { single: [50, 300], double: [70, 320], triple: [60, 310] } },
    { name: '2', value: 2, positions: { single: [100, 400], double: [120, 420], triple: [110, 410] } },
    { name: '1', value: 1, positions: { single: [150, 450], double: [170, 470], triple: [160, 460] } },
    { name: 'Bull', value: 25, positions: { single: [250, 250], double: [260, 260] } }
  ];
  

  constructor() {}

  evaluateInput(field: string, multiplier: number) {
    const fieldData = this.fields.find((f) => f.name === field);
    let score = fieldData?.value || 0;
    let totalScore = score * multiplier;

    if (field === 'Random') {
      score = Math.floor(Math.random() * 20);
      multiplier = Math.floor(Math.random() * 3) + 1;
      totalScore = score * multiplier;
    }

    const positionType = multiplier === 1 ? 'single' : multiplier === 2 ? 'double' : 'triple';
    const position = fieldData?.positions?.[positionType] || [0, 0];

    console.log(this.getDartValueString(score, multiplier) + ' thrown at position: ' + position);
    this.component.evaluateDebugThrow(totalScore, this.getDartValueString(score, multiplier), position);
  }

  disableConsole(): boolean {
    return this.component.disableConsoleButtons();
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
