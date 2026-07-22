import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CartService } from './cart-service';
import { CartProductSchema } from '../../schemas/cart-schemas';
import { Checkout } from '../checkout/checkout';
import { RouterLink } from "@angular/router";
import { AlertService } from '../alert-component/alert-service';

@Component({
  selector: 'app-cart',
  imports: [Checkout, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Cart implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly alertService = inject(AlertService);
  protected readonly state = this.cartService.state;
  
  protected cart = signal(true);
  protected cartProduct = null as CartProductSchema | null;
  protected processing = signal(new Set<string>());
  protected pendingAmounts = signal(new Map<string, number>());

  onAmountInput(id: string, value: string){
    const newAmount = +value;
    this.pendingAmounts.update((map) => {
      const newMap = new Map(map);
      newMap.set(id, newAmount);
      return newMap;
    });
  }

  addToSignal(id: string){
    this.processing.update((set) => new Set(set).add(id));
  }

  deleteFromSignal(id: string){
    this.processing.update((set) => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
  }

  ngOnInit(): void {
    this.cartService.getCart();
  };

  async onDeleteProduct(id: string, title: string){
    this.addToSignal(id);
    const result = await this.cartService.deleteFromCart(id);
    this.deleteFromSignal(id);
    if(result) this.errorManager(`eliminar el producto ${title}.`, result);
  };

  onDeleteCart(){
    this.cartService.deleteCart();
  };

  async onUpdateAmount(id: string, title: string, newAmount: number){
    if(newAmount < 0) return;
    this.addToSignal(id);
    const result = await this.cartService.changeProductAmount(id, newAmount);
    this.deleteFromSignal(id);
    this.pendingAmounts.update((map) => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });
    if(result) this.errorManager(`actualizar el producto ${title}.`, result);
  };

  onRetry(){
    this.cartService.getCart();
  };

  onCheckout(product?: CartProductSchema){
    if(product){
      this.cartProduct = product;
    }
    this.cart.set(false);
  }

  onCancel(){
    this.cart.set(true);
    this.cartProduct = null;
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

