import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchService } from './search-service';
import { CartService } from '../../cart/cart-service';

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
      // alerta de error al intentar agregar el producto al carrito
    }else{
      // alerta de producto "title" agregado
    };
    this.deleteFromSignal(productId);
  };

  onRetry(){
    this.searchService.search(this.search_query());
  };
}