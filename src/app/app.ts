import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { AccountService } from './account/services/account/account-service';
import { AuthService } from './account/services/auth/auth-service';
import { AccountProductsService } from './account/account-products/account-products-service';
import { AddressService } from './account/address/address-service';
import { BalanceService } from './balance/services/balance-service';
import { BalanceVariationsService } from './balance/services/balance-variations-service';
import { CartService } from './cart/cart-service';
import { OrderDetailsService } from './order/details/details-service';
import { RecordService } from './order/records/record-service';
import { StoreService } from './account/store/store-service';
import { validateLog } from '../schemas/account-schemas';
import { AccountAdministration } from "./account-administration/account-administration";
import { Nav } from './nav/nav';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkWithHref, AccountAdministration, Nav],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('PublicEcommerce');
  private authService = inject(AuthService);
  protected authState = this.authService.state;
  private router = inject(Router);
  private flag = false;

  // Services to reset
  private accountService = inject(AccountService);
  private accountProductsService = inject(AccountProductsService);
  private addressService = inject(AddressService);
  private storeService = inject(StoreService);
  private balanceService = inject(BalanceService);
  private balanceVariationsService = inject(BalanceVariationsService);
  private cartService = inject(CartService);
  private orderDetailsService = inject(OrderDetailsService);
  private recordService = inject(RecordService);

  constructor() {
    effect(() => {
      const auth = this.authState().data
      if(auth === null && this.flag){
        this.accountService.reset();
        this.accountProductsService.reset();
        this.addressService.reset();
        this.storeService.reset();
        this.balanceService.reset();
        this.balanceVariationsService.reset();
        this.cartService.reset();
        this.orderDetailsService.reset();
        this.recordService.reset();
        this.router.navigate(['/']);
      }else{
        this.flag = true;
      }
    });
  };

  onLogIn(){
    const result = validateLog();

    if(result.success){
      this.authService.logIn(result.output);
    };
  };


}
