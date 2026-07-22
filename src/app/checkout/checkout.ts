import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { CheckoutService } from './checkout-service';
import { ProductSchema } from '../../schemas/product-schemas';
import { CartProductSchema, CartSchema } from '../../schemas/cart-schemas';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DraftOrderSchema, UnavailableProductSchema, validateNewDraftOrderSchema } from '../../schemas/checkout-schemas';
import { Router } from '@angular/router';
import { AddressService } from '../account/address/address-service';
import { AddressSchema } from '../../schemas/account-schemas';
import { AlertService } from '../alert-component/alert-service';

interface productSchema {
  title: string;
  price: number;
  amount: number;
  discount: number;
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Checkout implements OnInit, OnDestroy{
  private readonly checkoutService = inject(CheckoutService);
  private readonly addressService = inject(AddressService);
  private readonly alertService = inject(AlertService);
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

  protected loading = signal(false);

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

  protected readonly totalAmount = computed(() =>
    this.products().reduce((acc, p) => acc + p.price * (1 - p.discount / 100) * p.amount, 0)
  );

  protected readonly totalUnits = computed(() =>
    this.products().reduce((acc, p) => acc + p.amount, 0)
  );

  onSelectAddress(address: AddressSchema){
    this.addressForm.patchValue({
      address: address.address,
      apartment: address.apartment ?? '',
      city: address.city,
      zip: address.zip,
      country: address.country
    });
  }

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
      this.loading.set(true);
      const response = await this.checkoutService.createDraftOrder(result.output);
      if(!response.success && response.error){
        this.errorManager('procesar la compra.', response.error);
      }else if(!response.success){
        this.unavailableProducts = response.data as UnavailableProductSchema[];
        this.show.set('unavailable');
      }else{
        this.draftOrder = response.data as DraftOrderSchema;
        this.show.set('draft');
      }
    }else{
      this.alertService.setAlert('Error al procesar la informacion, contactá a soporte técnico.', 'error');
    }
    this.loading.set(false);
  };

  async onConfirm(){
    this.loading.set(true);
    if(this.draftOrder!.total === 0){
      const result = await this.checkoutService.completeFreeOrder(this.draftOrder!.id);
      if(result){
        this.errorManager('completar la compra.', result);
        this.loading.set(false);
      }else{
        this.router.navigate(['/order'], {queryParams: {doi: this.draftOrder!.id }});
      }
    }else{
      /* -------------------- METODO REAL ------------------------
        const result = await this.checkoutService.createPaymentLink(this.draftOrder!.id);
          if(result.success){
          this.draftOrder = null;
          window.location.href = result.data;
        }
      */
      // ---------------------------- TESTEO ---------------------------------
      const result = await this.checkoutService.completeTestOrder(this.draftOrder!.id);
      if(result.success){
        this.draftOrder = null;
        this.router.navigate(['/order'], {queryParams: {doi: result.data }});
      }
      // ---------------------------------------------------------------------
      else{
        this.errorManager('completar la compra.', result.data);
        this.loading.set(false);
      };
    }
  };

  onCancel(){
    this.loading.set(true);
    if(this.show() === 'draft'){
      this.show.set('form');
      this.loading.set(false);
    }else{
      this.cancel.emit();  
    };
  };

  ngOnDestroy(): void {
    if(this.draftOrder){
      this.checkoutService.cancelOrder(this.draftOrder!.id);
    };
  }

  errorManager(action: string, error: string){
    let message: string;
    switch(error){
      case 'TIMEOUT':
        message = 'Error al obtener el resultado. Actualice la pagina.';
        break;
      case 'UNAVAILABLE':
        message = 'Actualmente estamos realizando mantenimiento, aguarde unos minutos y vuelva a intentarlo.';
        break;
      case 'INTERNAL_ERROR':
        message = 'Ups! Parece que algo ha fallado, vuelva a intntar. Si el error persiste contacte con soporte.';
        break;
      case 'NOT_FOUND':
        message = 'Ah ocurrido un error irrecuperable, recargue la pagina y reintente. Si el error se repite contacte con soporte.';
        break;
      case 'NETWORK_ERROR':
        message = 'Error de coneccion. Checke su conneccion a internet y reintente.';
        break;
      default:
        message = 'Error al ' + action;
        break;
    };
    this.alertService.setAlert(message, 'error');
  }
}
