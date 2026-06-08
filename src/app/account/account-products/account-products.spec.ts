import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountProducts } from './account-products';

describe('AccountProducts', () => {
  let component: AccountProducts;
  let fixture: ComponentFixture<AccountProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
