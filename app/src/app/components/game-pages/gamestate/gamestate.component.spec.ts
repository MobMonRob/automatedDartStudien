import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameState } from './gamestate.component';

describe('GamestateComponent', () => {
  let component: GameState;
  let fixture: ComponentFixture<GameState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameState]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameState);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
