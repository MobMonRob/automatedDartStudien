import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrationPageComponent } from './calibration-page.component';

describe('CalibrationPageComponent', () => {
  let component: CalibrationPageComponent;
  let fixture: ComponentFixture<CalibrationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalibrationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalibrationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
