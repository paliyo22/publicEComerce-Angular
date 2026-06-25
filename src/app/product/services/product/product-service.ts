import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { ProductSchema, ReviewSchema, validateProduct } from '../../../../schemas/product-schemas';
import { catchError, firstValueFrom, map, of, tap, timeout, TimeoutError } from 'rxjs';
import { NewProductSchema, UpdateProductSchema } from '../../../../schemas/create-product-schema';
import { withAuthRetry } from '../../../../helpers/withRetry';
import { AuthService } from '../../../account/services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private productSignal = signal({
    data: null as ProductSchema | null,
    id: null as string | null,
    loading: false,
    error: null as string | null
  });

  public state = this.productSignal.asReadonly();

  reset(){
    this.productSignal.update(() => ({
      data: null,
      id: null,
      loading: false,
      error: null
    }));
  };

  cleanError(){
    this.productSignal.update((state) => ({
      ...state,
      error: null
    }));
  };

  getProduct(id: string, force = false) {
    if(this.productSignal().loading){
      return;
    };
    if(this.productSignal().id === id && !force) return;

    this.productSignal.update(() => ({
      data: null,
      id: null,
      loading: true,
      error: null
    }));
  
    this.http.get<ProductSchema>(`${this.apiUrl}/product/${id}`)
    .pipe(
      timeout(6700),
      map((data) => {
        const result = validateProduct(data);
        if(!result.success){
          console.warn(`[ProductService] Error procesing product:`, result);
          throw new Error('PARSE_ERROR');
        }else{
          return result.output;
        };            
      }),
      tap((response) => {
        this.productSignal.update((state) => ({
          ...state,
          data: response,
          loading: false
        }));     
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(err instanceof Error){
            errorMessage = err.message;
          }else{
            if(!(err instanceof TimeoutError)){
              console.error('[ProductService]: Conection or network error on "updateProduct":', err);
            }
            errorMessage = 'NETWORK_ERROR'; 
          }; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[ProductService]: "getProduct": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.productSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));          
        return of (null);
      })
    ).subscribe();
  };

  async createProduct(product: NewProductSchema): Promise<{data: string; error: boolean;}> {
    this.productSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    try {
      const result = await firstValueFrom( 
        withAuthRetry<ProductSchema | string>(() =>  
          this.http.post<ProductSchema | string>(`${this.apiUrl}/product`, product, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))
      );

      if(typeof result === 'string'){
        this.productSignal.update((state) => ({
          ...state,
          loading: false,
          error: null
        }));
        return {
          data: result,
          error: false
        }; 
      }else{
        this.productSignal.update(() => ({
          data: result,
          id: result.id,
          loading: false,
          error: null
        }));
        return {
          data: result.id,
          error: false
        }; 
      };
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[ProductService]: Conection or network error on "addNewProduct":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[ProductService]: "addNewProduct": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };

      this.productSignal.update((state) => ({
        ...state,
        loading: false,
      }));
      return {
        data: errorMessage,
        error: true
      };
    };
  };

  async updateProduct(update: UpdateProductSchema, productId: string): Promise<ProductSchema | string>{
    this.productSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));
    
    try {
      const response = await firstValueFrom(
        withAuthRetry<ProductSchema>(() =>  
          this.http.put<ProductSchema>(`${this.apiUrl}/product/${productId}`, update, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))
      );
      // esta verificacion solo se hace para corroborar que estoy parseando bien los datos que entran del back.
      const result = validateProduct(response);
      if(!result.success){
        console.warn(`[ProductService] Error procesing product:`, result);
        throw new Error('PARSE_ERROR');
      };

      this.productSignal.update(() => ({
        data: result.output,
        id: productId,
        loading: false,
        error: null
      }));
      
      return result.output;
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(err instanceof Error){
          errorMessage = err.message;
        }else{
          if(!(err instanceof TimeoutError)){
            console.error('[ProductService]: Conection or network error on "updateProduct":', err);
          }
          errorMessage = 'NETWORK_ERROR'; 
        };
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[ProductService]: "updateProduct": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };

      this.productSignal.update((state) => ({
        ...state,
        loading: false,
        error: errorMessage
      }));
      return errorMessage;
    }
  };

  async deleteProduct(productId?: string): Promise<string | void> {
    if(!productId){
      productId = this.productSignal().id!;
    };
    
    if(productId === this.productSignal().id){
      this.productSignal.update((state) => ({
        ...state,
        loading: true,
        error: null
      }));
    };

    try {
      await firstValueFrom(
        withAuthRetry<void>(() =>  
          this.http.delete<void>(`${this.apiUrl}/product/${productId}`, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))
      );
      if(productId === this.productSignal().id) this.reset();
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[ProductService]: Conection or network error on "deleteProduct":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[ProductService]: "deleteProduct": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };

      if(productId === this.productSignal().id){
        this.productSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
      };
      return errorMessage;
    };
  };

  addReview(rating: number, comment?: string) {
    if(this.productSignal().loading){
      return;
    };
    this.productSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    const productId = this.productSignal().id;

    withAuthRetry<ReviewSchema | void>(() =>  
      this.http.post<ReviewSchema | void>(`${this.apiUrl}/review`, { productId, rating, comment }, { withCredentials: true }),
      this.authService
    ).pipe(
      timeout(6700),
      tap((result) => {
        if(result){
          this.productSignal.update((state) => ({
            ...state,
            data: {...state.data!, reviews: state.data!.reviews ? [...state.data!.reviews, result] : [result]},
            loading: false
          }));
        };
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(!(err instanceof TimeoutError)){
            console.error('[ProductService]: Conection or network error on "addReview":', err);
          }
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[ProductService]: "addReview": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.productSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  deleteReview(username: string) {
    if(this.productSignal().loading){
      return;
    };
    this.productSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    const productId = this.productSignal().id;

    withAuthRetry<void>(() =>  
      this.http.delete<void>(`${this.apiUrl}/review/${productId}`, { withCredentials: true }),
      this.authService
    ).pipe(
      timeout(6700),
      tap(() => {
        this.productSignal.update((state) => {
          const result = state.data!.reviews.filter((r) => r.username !== username);
          return {
            ...state,
            data: {...state.data!, reviews: result},
            loading: false
          };
        });
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(!(err instanceof TimeoutError)){
            console.error('[ProductService]: Conection or network error on "deleteReview":', err);
          }
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[ProductService]: "deleteReview": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.productSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}