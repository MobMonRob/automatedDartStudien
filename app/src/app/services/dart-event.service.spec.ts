import { TestBed } from '@angular/core/testing';

import { DartEventService } from './dart-event.service';

describe('DartEventService', () => {
  let service: DartEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DartEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
