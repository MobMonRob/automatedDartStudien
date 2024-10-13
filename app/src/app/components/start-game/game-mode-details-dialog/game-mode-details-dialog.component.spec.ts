import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameModeDetailsDialogComponent } from './game-mode-details-dialog.component';

describe('GameModeDetailsDialogComponent', () => {
  let component: GameModeDetailsDialogComponent;
  let fixture: ComponentFixture<GameModeDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameModeDetailsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameModeDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
