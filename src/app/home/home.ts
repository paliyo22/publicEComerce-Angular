import { ChangeDetectionStrategy, Component, computed, 
  effect, inject, input, signal, untracked} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../product/services/catalog/catalog-service';
import { Featured } from '../product/featured/featured';
import { FeaturedService } from '../product/featured/featured-service';
import { CartService } from '../cart/cart-service';

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
  
  protected catalogState = this.catalogService.state;  
  private readonly limit = 20;
  private readonly cartService = inject(CartService);
  protected p = input<number>();
  protected processing = signal(new Set<string>());
  protected maxPages = computed(() => Math.ceil(this.catalogState().total / this.limit));
 
  constructor(){
    this.catalogService.reset();
    this.featuredService.reset();
    effect(() => {
      const page = this.p() ?? 1;
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
      this.catalogService.getTotalProducts(this.limit);
    };    
  };

  getVisiblePages(): (number | string)[] {
    const current = this.p() ?? 1;
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
      // alerta de error al intentar agregar el producto al carrito
    }else{
      // alerta de producto "title" agregado
    };
    this.deleteFromSignal(productId);
  };

  onRetry(){
    this.catalogService.getTotalProducts(this.limit);
  };
}
