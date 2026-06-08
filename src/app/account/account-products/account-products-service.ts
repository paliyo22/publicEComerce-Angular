import { inject, Injectable, signal } from '@angular/core';
import { PartialProductSchema, ProductSchema, validatePartialProduct } from '../../../schemas/product-schemas';
import { environment } from '../../../environments/environment.development';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, map, of, tap, timeout, TimeoutError } from 'rxjs';
import { EProductStatus } from '../../../enum/product-status';
import { withAuthRetry } from '../../../helpers/withRetry';
import { AuthService } from '../services/auth/auth-service';
import { NewProductSchema, UpdateProductSchema } from '../../../schemas/create-product-schema';
import { ProductService } from '../../product/services/product/product-service';

@Injectable({
  providedIn: 'root',
})
export class AccountProductsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private apiUrl = environment.API_URL;

  private accountSignal = signal({
    data: [] as PartialProductSchema[],
    loading: false,
    error: null as string | null
  });

  public state = this.accountSignal.asReadonly();

  reset(){
    this.accountSignal.set({
      data: [],
      loading: true,
      error: null
    });
  }

  getMyProducts() {
    this.accountSignal.update(() => ({
      data: [],
      loading: true,
      error: null
    }));

    withAuthRetry<PartialProductSchema[]>(() => 
      this.http.get<PartialProductSchema[]>(`${this.apiUrl}/product/me`, { withCredentials: true }),
      this.authService
    ).pipe(
      timeout(6700),
      map((data) => {
        const rejections = new Array<any>(); 
        const products = new Array<PartialProductSchema>(); 
        data.forEach((p) => {
          const result = validatePartialProduct(p);
          if(!result.success){
            rejections.push(p);
          }else{
            products.push(result.output);
          };
        });
        if(rejections.length) 
          console.warn(`[AccountAccountProductService] Error procesing ${rejections.length} partial products:`, rejections);

        return products;
      }),
      tap((result) => {
        this.accountSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }));
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(!(err instanceof TimeoutError)){
            console.error('[AccountProductService]: Conection or network error on "getMyProducts":', err);
          }
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[AccountProductService]: "getMyProducts": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.accountSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  }

  async updateDiscount(productId: string, discount: number): Promise<void | string>{
    try{
      const result = await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.patch<void>(`${this.apiUrl}/product/discount/${productId}`, { discount }, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))  
      );
      
      this.accountSignal.update((state) => ({
        ...state,
        data: state.data.map((p) => p.id === productId ? { ...p, discountPercentage: discount } : p)
      }));
    }catch (err: any){
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[AccountProductService]: Conection or network error on "updateDiscount":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[AccountProductService]: "updateDiscount": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };
      return errorMessage;
    }
  }

  async updatePrice(productId: string, price: number): Promise<void | string>{
    try {
      const result = await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.patch<void>(`${this.apiUrl}/product/price/${productId}`, { price }, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))
      );
      
      this.accountSignal.update((state) => ({
        ...state,
        data: state.data.map((p) => p.id === productId ? { ...p, price } : p)
      }));
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[AccountProductService]: Conection or network error on "updatePrice":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[AccountProductService]: "updatePrice": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };

      return errorMessage;
    };
  }

  async updateStock(productId: string, stock: number): Promise<void | string>{
    try {
      const result = await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.patch<void>(`${this.apiUrl}/product/stock/${productId}`, { stock }, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))
      );
      
      this.accountSignal.update((state) => ({
        ...state,
        data: state.data.map((p) => p.id === productId ? { ...p, stock } : p)
      }));
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[AccountProductService]: Conection or network error on "updateStock":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[AccountProductService]: "updateStock": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };
      return errorMessage;
    };
  }

  async restoreProduct(productId: string): Promise<void | string>{
    try {
      const result = await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.patch<void>(`${this.apiUrl}/product/restore/${productId}`, {}, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))
      );

      this.accountSignal.update((state) => ({
        ...state,
        data: state.data.map((p) => p.id === productId ? { ...p, status: EProductStatus.UNAVAILABLE } : p)
      }));
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[AccountProductService]: Conection or network error on "restoreProduct":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[AccountProductService]: "restoreProduct": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };
      return errorMessage;
    };
  }

  async createProduct(product: NewProductSchema): Promise<{data: string; error: boolean;}>{
    if(this.accountSignal().data.length){
      this.accountSignal.update((state) => ({
        ...state,
        loading: true,
        error: null
      }));
    };

    const result = await this.productService.createProduct(product);

    if(result.error){
      if(this.accountSignal().data.length){
        this.accountSignal.update((state) => ({
          ...state,
          loading: false,
          error: null
        }));
      };
    }else{
      if(this.accountSignal().data.length){
        this.reset();
        this.getMyProducts();  
      };
    };

    return result;
  };

  async updateProduct(update: UpdateProductSchema, productId: string): Promise<void | string>{
    if(this.accountSignal().data.length){
      this.accountSignal.update((state) => ({
        ...state,
        loading: true,
        error: null
      }));
    };

    const result = await this.productService.updateProduct(update, productId);

    if(typeof result === 'string'){
      if(this.accountSignal().data.length){
        this.accountSignal.update((state) => ({
          ...state,
          loading: false,
          error: null
        }));
      };
      return result;
    }else{
      if(this.accountSignal().data.length){
        this.reset();
        this.getMyProducts(); 
      };
    };
  };

  async deleteProduct(productId: string): Promise<string | void>{
    const result = await this.productService.deleteProduct(productId);

    if(result){
      return result;
    };
    
    this.accountSignal.update((state)=> ({
      ...state,
      data: state.data.map((p) => p.id === productId ? { ...p, status: EProductStatus.DELETED } : p)
    }));
  };
}
