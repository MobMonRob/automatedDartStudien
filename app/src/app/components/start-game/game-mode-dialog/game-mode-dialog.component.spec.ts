import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameModeDialogComponent } from './game-mode-dialog.component';

describe('GameModeDialogComponent', () => {
  let component: GameModeDialogComponent;
  let fixture: ComponentFixture<GameModeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameModeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameModeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
