import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reasons } from '../../../model/api.models';

@Component({
  selector: 'dartapp-reason-group',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './reason-group.component.html',
  styleUrl: './reason-group.component.scss'
})
export class ReasonGroupComponent {
  @Input() selectedReason!: number;
  @Input() editingMode!: boolean;

  @Output() selectedReasonChange: EventEmitter<number> = new EventEmitter<number>();

  public reasons = Object.entries(Reasons)
    .filter(([_, value]) => typeof value === 'number')
    .map(([key, value]) => ({ key, value }));

  onSelectionChange(value: number) {
    this.selectedReasonChange.emit(value);
  }
}
