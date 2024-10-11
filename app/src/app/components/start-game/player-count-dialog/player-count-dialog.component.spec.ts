import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerCountDialogComponent } from './player-count-dialog.component';

describe('PlayerCountDialogComponent', () => {
  let component: PlayerCountDialogComponent;
  let fixture: ComponentFixture<PlayerCountDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerCountDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerCountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
