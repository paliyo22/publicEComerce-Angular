import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { ProductUpdate } from '../update/update';
import { ProductReviews } from '../reviews/reviews';
import { ProductService } from '../services/product/product-service';
import { AuthService } from '../../account/services/auth/auth-service';
import { AccountProductsService } from '../../account/account-products/account-products-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-details',
  imports: [ProductUpdate, ProductReviews, RouterLink],
  templateUrl: './details.html',
  styleUrl: './details.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetails implements OnInit{
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly accountProductsService = inject(AccountProductsService);
  protected productState = this.productService.state;
  protected authState = this.authService.state;
  protected id = input.required<string>();

  protected editing = signal(false);

  constructor(){
    effect(() => {
      const currentId = this.id().trim();
      if(currentId){
        this.editing.set(false);
        this.productService.getProduct(currentId);
      }else{
        this.router.navigate(['/error']);
      };
    });
  };

  ngOnInit() {
    this.productService.reset();
  };

  onEdit() {
    this.editing.set(!this.editing());
  };

  async onDelete(){
    await this.accountProductsService.deleteProduct(this.id());
  }

  onRetry() {
    if(this.productState().data){
      this.productService.cleanError();
    }else{
      this.productService.getProduct(this.id(), true);
    };
  };
}
