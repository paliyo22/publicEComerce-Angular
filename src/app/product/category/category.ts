import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CategoryService } from './category-service';
import { ECategory } from '../../../enum/category';
import { Router, RouterLink } from '@angular/router';
import { Featured } from "../featured/featured";
import { CartService } from '../../cart/cart-service';
import { AuthService } from '../../account/services/auth/auth-service';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-category',
  imports: [RouterLink, Featured],
  templateUrl: './category.html',
  styleUrl: './category.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Category {
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);
  private readonly alertService = inject(AlertService);
  protected readonly authState = inject(AuthService).state;
  protected readonly categoryState = this.categoryService.state;
  private readonly limit = 4;

  protected p = input<number>();
  protected category = input.required<string>();
  
  protected processing = signal(new Set<string>());
  protected maxPages = computed(() => Math.ceil(this.categoryState().total / this.limit));
  protected currentPage = computed(() => this.p() ? Number(this.p()) : 1);

  constructor(){
    effect(() => {
      const page = this.currentPage();
      const category = this.category();
      if(page < 1){
        this.router.navigate(['/error']);
        return;
      }
      untracked(() => {
        this.getCategoryList(category, page);
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

  getCategoryList(category: string, page: number){
    const result = category as ECategory;
    const offset = (page - 1) * this.limit;
    if(Object.values(ECategory).includes(result)){
      if(this.categoryState().category === result){
        if(!this.categoryState().data.has(page)){
          this.loadPage(result, offset);
        };
      }else {
        this.categoryService.getCategoryTotalProducts(result, this.limit, offset);
      };      
    }else{
      this.router.navigate(['/error']);
    };    
  };

  loadPage(category: ECategory, offset: number){
    this.categoryService.getCategoryProductList(category, this.limit, offset);
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
    const page = this.currentPage();
    this.categoryService.reset();
    this.getCategoryList(this.category(), page);
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
