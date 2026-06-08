import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountAdministration } from './account-administration';

describe('AccountAdministration', () => {
  let component: AccountAdministration;
  let fixture: ComponentFixture<AccountAdministration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountAdministration],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountAdministration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
