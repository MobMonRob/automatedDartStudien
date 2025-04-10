import { TestBed } from '@angular/core/testing';

import { DartPositionService } from './dart-position.service';

describe('DartPositionService', () => {
  let service: DartPositionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DartPositionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
