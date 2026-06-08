import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { CheckoutService } from './checkout-service';
import { ProductSchema } from '../../schemas/product-schemas';
import { CartProductSchema, CartSchema } from '../../schemas/cart-schemas';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DraftOrderSchema, UnavailableProductSchema, validateDraftOrderSchema, 
  validateNewDraftOrderSchema } from '../../schemas/checkout-schemas';
import { Router } from '@angular/router';
import { AddressService } from '../account/address/address-service';

interface productSchema {
  title: string;
  price: number;
  amount: number;
  discount: number;
}

@Component({
  selector: 'app-checkout',
  imports: [],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Checkout implements OnInit{
  private readonly checkoutService = inject(CheckoutService);
  private readonly addressService = inject(AddressService);
  private readonly router = inject(Router);
  protected readonly addressState = this.addressService.state;

  product = input<{product: ProductSchema, amount: number}>();
  cart = input<CartSchema>();
  cartProduct = input<CartProductSchema>();
  cancel = output();

  private readonly fb = inject(FormBuilder);
  protected addressForm!: FormGroup;

  protected unavailableProducts = [] as UnavailableProductSchema[];
  protected draftOrder = null as DraftOrderSchema | null;

  protected show = signal<'form' | 'draft' | 'unavailable'>('form');

  protected products = computed<productSchema[]>(() => {
    const prod = this.product();
    const c = this.cart();
    const cp = this.cartProduct();

    if(prod){
      return [{
        title: prod.product.title, price: prod.product.price, 
        amount: prod.amount, discount: prod.product.discountPercentage
      }];
    }else if(cp){
      return [{
        title: cp.title, price: cp.price,
        amount: cp.amount, discount: cp.discount
      }];
    }else if(c){
      return c.products.map((p) => ({
          title: p.title, price: p.price,
          amount: p.amount, discount: p.discount
      }));
    }else{
      return [];
    };
  });

  ngOnInit(): void {
    this.addressService.getAddressList();
    this.addressForm = this.fb.group({
      address: ['', [Validators.required, Validators.maxLength(100)]],
      apartment: ['', Validators.maxLength(10)],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      zip: ['', [Validators.required, Validators.maxLength(10)]],
      country: ['', [Validators.required, Validators.maxLength(100)]]
    });

    const prod = this.product();
    const c = this.cart();
    const cp = this.cartProduct();

    if (prod) {
      this.addressForm.addControl('fromProduct', this.fb.group({
        productId: [prod.product.id],
        amount: [prod.amount]
      }));
    } else if (c) {
      this.addressForm.addControl('fromCart', this.fb.group({
        cartId: [c.id],
      }));
    } else if (cp) {
      this.addressForm.addControl('fromCart', this.fb.group({
        cartProductId: [cp.cartProductId]
      }));
    };
  };

  async onConfirmForm(){
    if(this.addressForm.invalid) return;

    const result = validateNewDraftOrderSchema(this.addressForm.value);

    if(result.success){
      const response = await this.checkoutService.createDraftOrder(result.output);
      if(typeof response === 'string'){
        console.error(response);
        // aca muestro un alerta de error. sin cambiar el template
      }else{
        const draft = validateDraftOrderSchema(response);
        if(!draft.success){
          this.unavailableProducts = response as UnavailableProductSchema[];
          this.show.set('unavailable');
        }else{
          this.draftOrder = draft.output;
          this.show.set('draft');
        }
      }
    }else{
      console.error('error en la validacion de valibot');
    }
  };

  async onConfirm(){
    if(this.draftOrder!.total === 0){
      const result = await this.checkoutService.completeFreeOrder(this.draftOrder!.id);
      if(result){
        console.error(result);
        // aca muestro un alerta de error. sin cambiar el template
      }else{
        this.router.navigate(['/order'], {queryParams: {doi: this.draftOrder!.id }});
      }
    }else{
      const result = await this.checkoutService.createPaymentLink(this.draftOrder!.id);
      if(result){
        console.error(result);
        // aca muestro un alerta de error. sin cambiar el template
      };
    }
  };

  onCancel(){
    if(this.show() === 'draft'){
      this.show.set('form');
    }else{
      if(this.draftOrder){
        this.checkoutService.cancelOrder(this.draftOrder!.id);
      };
      this.cancel.emit();  
    };
  };
}
