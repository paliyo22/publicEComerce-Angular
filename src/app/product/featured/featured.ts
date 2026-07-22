import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FeaturedService } from './featured-service';
import { RouterLink } from "@angular/router";
import { CartService } from '../../cart/cart-service';
import { AuthService } from '../../account/services/auth/auth-service';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-featured',
  imports: [RouterLink],
  templateUrl: './featured.html',
  styleUrl: './featured.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Featured implements OnInit{
  private readonly featuredService = inject(FeaturedService);
  private readonly cartService = inject(CartService);
  private readonly alertService = inject(AlertService);
  protected readonly authState = inject(AuthService).state;
  protected featuredState = this.featuredService.state;
  private limit = 5;

  protected processing = signal(new Set<string>());

  ngOnInit() {
    this.featuredService.getFeaturedList(this.limit);
  };

  addToSignal(id: string){
    this.processing.update((set) => new Set(set).add(id));
  };

  deleteFromSignal(id: string){
    this.processing.update((set) => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
  };

  async onAddToCart(productId: string, title: string){
    this.addToSignal(productId);
    const result = await this.cartService.addToCart(productId, 1);
    if(result){
      this.errorManager(`agregar ${title} al carrito.`, result);
    }else{
      this.alertService.setAlert(`${title} agregado.`, 'success');
    };
    this.deleteFromSignal(productId);
  };

  onRetry(){
    this.featuredService.getFeaturedList(this.limit);
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
