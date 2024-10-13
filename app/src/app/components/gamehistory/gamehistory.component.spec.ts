import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamehistoryComponent } from './gamehistory.component';

describe('GamehistoryComponent', () => {
  let component: GamehistoryComponent;
  let fixture: ComponentFixture<GamehistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamehistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamehistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
