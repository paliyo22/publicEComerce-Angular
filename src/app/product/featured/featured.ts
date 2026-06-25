import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FeaturedService } from './featured-service';
import { RouterLink } from "@angular/router";
import { CartService } from '../../cart/cart-service';
import { AuthService } from '../../account/services/auth/auth-service';

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
      // alerta de error al intentar agregar el producto al carrito
    }else{
      // alerta de producto "title" agregado
    };
    this.deleteFromSignal(productId);
  };

  onRetry(){
    this.featuredService.getFeaturedList(this.limit);
  };
}
