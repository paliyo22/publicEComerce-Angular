import { TestBed } from '@angular/core/testing';

import { BalanceVariationsService } from './balance-variations-service';

describe('BalanceVariationsService', () => {
  let service: BalanceVariationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BalanceVariationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
