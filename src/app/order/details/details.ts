import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { OrderDetailsService } from './details-service';
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-details',
  imports: [RouterLink, CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetails {
  private readonly detailsService = inject(OrderDetailsService);
  private router = inject(Router);
  protected state = this.detailsService.state;
  
  oi = input<string>(); // orderId
  doi = input<string>(); // draftOrderId

  constructor(){
    effect(() => {
      const orderId = this.oi();
      const draftOrderId = this.doi();
      if((orderId && draftOrderId) || (!orderId && !draftOrderId)){
        this.router.navigate(['/error']);
      }else if(orderId){
        untracked(() => this.detailsService.getOrder(orderId!));
      }else{
        untracked(() => this.detailsService.getOrderStatus(draftOrderId!));
      }  
    })
  };

  onReload(){
    if(this.oi()){
      this.detailsService.getOrder(this.oi()!);
    }else{
      this.detailsService.getOrder(undefined, this.doi()!);
    };
  };
}