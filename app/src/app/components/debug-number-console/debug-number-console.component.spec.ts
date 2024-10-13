import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugNumberConsoleComponent } from './debug-number-console.component';

describe('DebugNumberConsoleComponent', () => {
  let component: DebugNumberConsoleComponent;
  let fixture: ComponentFixture<DebugNumberConsoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebugNumberConsoleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebugNumberConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
