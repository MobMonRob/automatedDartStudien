import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraStatusComponent } from './camera-status.component';

describe('CameraStatusComponent', () => {
  let component: CameraStatusComponent;
  let fixture: ComponentFixture<CameraStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CameraStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
