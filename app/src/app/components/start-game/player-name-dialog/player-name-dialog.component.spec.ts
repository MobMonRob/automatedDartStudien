import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerNameDialogComponent } from './player-name-dialog.component';

describe('PlayerNameDialogComponent', () => {
  let component: PlayerNameDialogComponent;
  let fixture: ComponentFixture<PlayerNameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerNameDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
