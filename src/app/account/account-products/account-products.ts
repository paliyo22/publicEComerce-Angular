import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AccountProductsService } from './account-products-service';
import { RouterLink } from '@angular/router';
import { EProductStatus } from '../../../enum/product-status';

@Component({
  selector: 'app-account-products',
  imports: [RouterLink],
  templateUrl: './account-products.html',
  styleUrl: './account-products.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountProducts implements OnInit{
  private readonly accountProductService = inject(AccountProductsService);
  protected productListState = this.accountProductService.state; 

  protected productStatus = EProductStatus;
  protected processing = signal(new Set<string>());
  
  ngOnInit(): void {
    this.accountProductService.getMyProducts();
  }

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

  async onUpdateDiscount(productId: string, discount: number){
    this.addToSignal(productId);
    const result = await this.accountProductService.updateDiscount(productId, discount);
    this.deleteFromSignal(productId);
    if(result) this.errorManager('actualizar el descuento.', result);
  }

  async onUpdatePrice(productId: string, price: number){
    this.addToSignal(productId);
    const result = await this.accountProductService.updatePrice(productId, price);
    this.deleteFromSignal(productId);
    if(result) this.errorManager('actualizar el precio.', result);
  }

  async onUpdateStock(productId: string, stock: number){
    const aux = Math.floor(stock);
    if(stock < 0) return;
    this.addToSignal(productId);
    const result = await this.accountProductService.updateStock(productId, aux);
    this.deleteFromSignal(productId);
    if(result) this.errorManager('actualizar el stock.', result);
  }

  async onRestoreProduct(productId: string){
    this.addToSignal(productId);
    const result = await this.accountProductService.restoreProduct(productId);
    this.deleteFromSignal(productId);
    if(result) this.errorManager('restaurar el producto.', result);
  }

  async onDeleteProduct(productId: string){
    this.addToSignal(productId);
    const result = await this.accountProductService.deleteProduct(productId);
    this.deleteFromSignal(productId);
    if(result) this.errorManager('eliminar el producto.', result);
  }

  onRetry(){
    this.accountProductService.getMyProducts();
  }

  errorManager(action: string, error: string){
    let message: string;
    switch(error){
      case 'TIMEOUT':
        message = 'Error al obtener el resultado. Actualice la pagina.';
        break;
      case 'UNAVAILABLE':
        message = 'Actualmente estamos realizando mantenimiento, aguarde unos minutos y vuelva a intentarlo.';
        break;
      case 'INTERNAL_ERROR':
        message = 'Ups! Parece que algo ha fallado, vuelva a intentar. Si el error persiste contacte con soporte.';
        break;
      case 'NOT_FOUND':
        message = 'Ah ocurrido un error grave, recargue la pagina y reintente. Si el error se repite contacte con soporte.';
        break;
      case 'BAD_REQUEST':
        message = 'No se puede realizar esta accion.';
        break;
      case 'BANNED':
        message = 'Este producto se encuentra baneado por incumplir con nuestros terminos y condiciones de servicio. Contacte con soporte si desea elevar un reclamo.';
        break;
      case 'DELETED':
        message = 'Este producto se encuentra eliminado, actualice su estado antes de efectuar modificaciones.';
        break;
      case 'NETWORK_ERROR':
        message = 'Error de coneccion. Checke su conneccion a internet y reintente.';
        break;
      default:
        message = 'Error al ' + action;
        break;
    };
    // alerta de error con el contenido de "message"
  }
}
