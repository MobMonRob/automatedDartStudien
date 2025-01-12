import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoringZoomViewComponent } from './scoring-zoom-view.component';

describe('ScoringZoomViewComponent', () => {
  let component: ScoringZoomViewComponent;
  let fixture: ComponentFixture<ScoringZoomViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoringZoomViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoringZoomViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
