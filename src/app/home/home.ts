import { ChangeDetectionStrategy, Component, computed, 
  effect, inject, input, signal, untracked} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../product/services/catalog/catalog-service';
import { Featured } from '../product/featured/featured';
import { FeaturedService } from '../product/featured/featured-service';
import { CartService } from '../cart/cart-service';
import { AuthService } from '../account/services/auth/auth-service';
import { AlertService } from '../alert-component/alert-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Featured],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly featuredService = inject(FeaturedService);
  private readonly alertService = inject(AlertService);
  protected readonly authState = inject(AuthService).state;
  
  protected catalogState = this.catalogService.state;  
  private readonly limit = 20;
  private readonly cartService = inject(CartService);
  protected p = input<number>();
  protected processing = signal(new Set<string>());
  protected maxPages = computed(() => Math.ceil(this.catalogState().total / this.limit));
  protected currentPage = computed(() => this.p() ? Number(this.p()) : 1);
 
  constructor(){
    this.catalogService.reset();
    this.featuredService.reset();
    effect(() => {
      const page = this.currentPage();
      if(page < 1){
        this.router.navigate(['/']);
        return;
      };
      untracked(() => {
        this.getCatalogList(page);
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
  
  getCatalogList(page: number): void {
    const offset = (page - 1) * this.limit; 
    if(this.catalogState().data.size){
      if(!this.catalogState().data.has(page)){
        this.catalogService.getProductList(this.limit, offset);  
      };
    }else{
      this.catalogService.getTotalProducts(this.limit, offset);
    };    
  };

  getVisiblePages(): (number | string)[] {
    const current = this.currentPage();
    const total = this.maxPages();
    const pages: (number | string)[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 5) {
        for (let i = 1; i <= 6; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 5; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 5; i <= current + 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
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
    this.catalogService.getTotalProducts(this.limit);
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
