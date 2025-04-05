import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePageWrapperComponent } from './game-page-wrapper.component';

describe('GamePageWrapperComponent', () => {
  let component: GamePageWrapperComponent;
  let fixture: ComponentFixture<GamePageWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePageWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePageWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
