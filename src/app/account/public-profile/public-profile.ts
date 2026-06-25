import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { PublicProfileService } from './public-profile-service';
import { RouterLink } from "@angular/router";
import { CartService } from '../../cart/cart-service';

@Component({
  selector: 'app-public-profile',
  imports: [RouterLink],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountPublicProfile {
  private readonly profileSchema = inject(PublicProfileService);
  private readonly cartService = inject(CartService);
  protected profileState = this.profileSchema.state;
  protected processing = signal(new Set<string>());
  protected account = input.required<string>();

  constructor() {
    effect(() => {
      untracked(() => this.profileSchema.getPublicAccountInfo(this.account()));
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
    this.profileSchema.getPublicAccountInfo(this.account());
  }
}
