import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamestateTyaComponent } from './gamestate-tya.component';

describe('GamestateTyaComponent', () => {
  let component: GamestateTyaComponent;
  let fixture: ComponentFixture<GamestateTyaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamestateTyaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamestateTyaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
