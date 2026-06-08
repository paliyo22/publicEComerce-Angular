import { TestBed } from '@angular/core/testing';

import { OrderDetailsService } from './details-service';

describe('DetailsService', () => {
  let service: OrderDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
