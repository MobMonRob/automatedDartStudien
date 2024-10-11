import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameselectComponent } from './gameselect.component';

describe('GameselectComponent', () => {
  let component: GameselectComponent;
  let fixture: ComponentFixture<GameselectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameselectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameselectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
