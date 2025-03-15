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
    { name: '20', value: 20, positions: { single: [125, 50], double: [125, 35], triple: [125, 70] } }, // Accurate
    { name: '19', value: 19, positions: { single: [100, 200], double: [95, 216], triple: [106, 182] } }, // Accurate
    { name: '18', value: 18, positions: { single: [173, 63], double: [179, 52], triple: [157, 81] } }, // Accurate
    { name: '17', value: 17, positions: { single: [148, 197], double: [154, 217], triple: [144, 182] } }, // Accurate
    { name: '16', value: 16, positions: { single: [65, 171], double: [50, 181], triple: [78, 161] } }, // Accurate
    { name: '15', value: 15, positions: { single: [185, 171], double: [200, 181], triple: [173, 161] } }, // Accurate
    { name: '14', value: 14, positions: { single: [55, 105], double: [38, 100], triple: [69, 109] } }, // Accurate
    { name: '13', value: 13, positions: { single: [200, 100], double: [213, 100], triple: [181, 109] } }, // Accurate
    { name: '12', value: 12, positions: { single: [79, 63], double: [71, 52], triple: [90, 81] } }, // Accurate
    { name: '11', value: 11, positions: { single: [52, 127], double: [32, 127], triple: [67, 127] } }, // Accurate
    { name: '10', value: 10, positions: { single: [197, 150], double: [215, 156], triple: [180, 143] } }, // Accurate
    { name: '9', value: 9, positions: { single: [65, 83], double: [50, 73], triple: [78, 93] } }, // Accurate
    { name: '8', value: 8, positions: { single: [50, 150], double: [38, 156], triple: [70, 143] } }, // Accurate
    { name: '7', value: 7, positions: { single: [79, 190], double: [71, 205], triple: [90, 173] } }, // Accurate
    { name: '6', value: 6, positions: { single: [200, 127], double: [218, 127], triple: [182, 127] } }, // Accurate
    { name: '5', value: 5, positions: { single: [100, 50], double: [96, 39], triple: [105, 72] } }, // Accurate
    { name: '4', value: 4, positions: { single: [185, 83], double: [200, 73], triple: [173, 93] } }, // Accurate
    { name: '3', value: 3, positions: { single: [125, 205], double: [125, 221], triple: [125, 185] } }, // Accurate
    { name: '2', value: 2, positions: { single: [170, 190], double: [178, 205], triple: [157, 173] } }, // Accurate
    { name: '1', value: 1, positions: { single: [150, 50], double: [153, 39], triple: [144, 72] } }, // Accurate
    { name: 'Bull', value: 25, positions: { single: [125, 122], double: [125, 127] } } // Accurate
  ];

  constructor() {}

  evaluateInput(field: string, multiplier: number) {
    let fieldData = this.fields.find((f) => f.name === field);
    let score = fieldData?.value || 0;

    if (field === 'Random') {
      const randomIndex = Math.floor(Math.random() * this.fields.length);
      fieldData = this.fields[randomIndex];
      score = fieldData.value;
      multiplier = Math.floor(Math.random() * 3) + 1; 
    }

    const positionType = multiplier === 1 ? 'single' : multiplier === 2 ? 'double' : 'triple';
    const position = fieldData?.positions?.[positionType] || [0, 0];

    console.log(this.getDartValueString(score, multiplier) + ' thrown at position: ' + position);
    this.component.evaluateDebugThrow(score, this.getDartValueString(score, multiplier), position);
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
