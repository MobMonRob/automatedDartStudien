import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamestateComponent } from './gamestate.component';

describe('GamestateComponent', () => {
  let component: GamestateComponent;
  let fixture: ComponentFixture<GamestateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamestateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamestateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
