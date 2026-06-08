import { TestBed } from '@angular/core/testing';

import { AccountProductsService } from './account-products-service';

describe('AccountProductsService', () => {
  let service: AccountProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountProductsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
