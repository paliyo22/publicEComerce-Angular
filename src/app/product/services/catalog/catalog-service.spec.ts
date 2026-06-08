import { TestBed } from '@angular/core/testing';
import { CatalogService } from './catalog-service'

describe('ProductCatalogService', () => {
  let service: CatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
