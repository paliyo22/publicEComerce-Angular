import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal, untracked } from '@angular/core';
import { ProductUpdate } from '../update/update';
import { ProductReviews } from '../reviews/reviews';
import { ProductService } from '../services/product/product-service';
import { AuthService } from '../../account/services/auth/auth-service';
import { AccountProductsService } from '../../account/account-products/account-products-service';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../cart/cart-service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-details',
  imports: [ProductUpdate, ProductReviews, RouterLink, FormsModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetails implements OnInit{
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly accountProductsService = inject(AccountProductsService);
  private readonly alertService = inject(AlertService);
  protected productState = this.productService.state;
  protected authState = this.authService.state;
  protected id = input.required<string>();

  protected editing = signal(false);
  protected processing = signal(false); 
  cartAmount: number = 1;

  constructor(){
    effect(() => {
      const currentId = this.id().trim();
      if(currentId){
        this.editing.set(false);
        untracked(() => this.productService.getProduct(currentId));
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

  async onAddToCart(productId: string, amount: number, title: string){
    if(amount < 1) return; 

    const result = await this.cartService.addToCart(productId, Math.round(amount));
    if(result){
      this.errorManager(`agregar ${title} al carrito.`, result);
    }else{
      this.alertService.setAlert(`${title} agregado.`, 'success');
    };
  };

  onRetry() {
    if(this.productState().data){
      this.productService.cleanError();
    }else{
      this.productService.getProduct(this.id(), true);
    };
  };

  errorManager(action: string, error: string){
    let message: string;
    switch(error){
      case 'TIMEOUT':
        message = 'Error al obtener el resultado. Actualice la pagina e intente nuevamente.';
        break;
      case 'UNAVAILABLE':
        message = 'Actualmente estamos realizando mantenimiento, aguarde unos minutos y vuelva a intentarlo.';
        break;
      case 'INTERNAL_ERROR':
        message = 'Ups! Parece que algo ha fallado, vuelva a intentar. Si el error persiste contacte con soporte.';
        break;
      case 'NOT_FOUND':
        message = 'Ah ocurrido un error grave, recargue la pagina y reintente. Si el error persiste contacte con soporte.';
        break;
      case 'BAD_REQUEST':
        message = 'No se puede realizar esta accion.';
        break;
      case 'PARSE_ERROR':
        message = 'Error al procesar la informacion, contactá a soporte técnico.';
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
