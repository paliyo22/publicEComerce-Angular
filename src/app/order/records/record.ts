import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { RecordService } from './record-service';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../account/services/auth/auth-service';

@Component({
  selector: 'app-record',
  imports: [RouterLink],
  templateUrl: './record.html',
  styleUrl: './record.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Record {
  private readonly recordService = inject(RecordService);
  private readonly authService = inject(AuthService);
  protected readonly shoppingState = this.recordService.shoppingState;
  protected readonly salesState = this.recordService.salesState;
  protected readonly authState = this.authService.state;

  protected show = signal<'shoppings' | 'sales'>('shoppings');

  constructor(){
    effect(() => {
      if(this.show() === 'shoppings'){
        this.recordService.getShoppingList();
      }else{
        this.recordService.getSalesList();
      };
    });
  };

  onChangeTemplate(){
    if(this.show() === 'shoppings'){
      this.show.set('sales');
    }else{
      this.show.set('shoppings');
    };
  };

  onReload(){
    if(this.show() === 'shoppings'){
      this.recordService.getShoppingList(true);
    }else{
      this.recordService.getSalesList(true);
    };
  };
}
