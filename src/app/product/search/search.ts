import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchService } from './search-service';
import { CartService } from '../../cart/cart-service';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-search',
  imports: [RouterLink],
  templateUrl: './search.html',
  styleUrl: './search.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Search {
  private readonly searchService = inject(SearchService);
  private readonly cartService = inject(CartService);
  private readonly alertService = inject(AlertService);
  protected readonly searchState = this.searchService.state;

  protected search_query = input.required<string>();
  protected processing = signal(new Set<string>());

  constructor(){
    effect(() => {
      const contains = this.search_query();
      untracked(() => {
        this.searchService.search(contains);
      });
    });
  };

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
    this.searchService.search(this.search_query());
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