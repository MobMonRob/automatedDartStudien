import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamestateCricketComponent } from './gamestate-cricket.component';

describe('GamestateCricketComponent', () => {
  let component: GamestateCricketComponent;
  let fixture: ComponentFixture<GamestateCricketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamestateCricketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamestateCricketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
