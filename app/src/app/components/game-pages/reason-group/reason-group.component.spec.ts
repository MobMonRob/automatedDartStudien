import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonGroupComponent } from './reason-group.component';

describe('ReasonGroupComponent', () => {
  let component: ReasonGroupComponent;
  let fixture: ComponentFixture<ReasonGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
