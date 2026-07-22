import { inject, Injectable, signal } from '@angular/core';
import { CartSchema, validateCartSchema } from '../../schemas/cart-schemas';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { withAuthRetry } from '../../helpers/withRetry';
import { catchError, firstValueFrom, map, of, tap, timeout } from 'rxjs';
import { AuthService } from '../account/services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private cartSignal = signal({
    data: null as CartSchema | null,
    loading: false,
    error: null as string | null
  });

  public state = this.cartSignal.asReadonly();

  reset(){
    this.cartSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
  };

  getCart(){
    if(this.cartSignal().loading) return;
    
    this.cartSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<CartSchema>(() => 
      this.http.get<CartSchema>(`${this.apiUrl}/cart`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((response) => {
        const aux = validateCartSchema(response);
        if(!aux.success){
          throw new Error('PARSE_ERROR');
        }
        return aux.output;
      }),
      tap((result) => {
        this.cartSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }));
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(err instanceof Error){
            errorMessage = err.message;
          }else{
            errorMessage = 'NETWORK_ERROR'; 
          };
        }else{
          errorMessage = err.error?.message || 'ERROR';
        };

        this.cartSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  async addToCart(productId: string, amount = 1): Promise<string | void>{
    if(amount < 1){
      return 'INVALID_AMOUNT';
    };

    try {
      await firstValueFrom( 
        withAuthRetry<void>(() =>  
          this.http.post<void>(`${this.apiUrl}/cart`, {productId, amount}, { withCredentials: true }),
          this.authService
        ).pipe(timeout(6700))
      );
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        errorMessage = 'NETWORK_ERROR';
      }else{
        errorMessage = err.error?.message || 'ERROR';
      };
      return errorMessage;
    };
  };

  deleteCart(){
    if(this.cartSignal().loading) return;

    this.cartSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<void>(() => 
      this.http.delete<void>(`${this.apiUrl}/cart`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      tap(() => {
        this.reset();
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          errorMessage = 'NETWORK_ERROR';
        }else{
          errorMessage = err.error?.message || 'ERROR';
        };

        this.cartSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  async deleteFromCart(cartProductId: string): Promise<string | void>{
    try {
      await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.delete<void>(`${this.apiUrl}/cart/${cartProductId}`, {withCredentials: true}),
          this.authService
        ).pipe(timeout(6700))
      );

      this.cartSignal.update((state) => ({
        ...state,
        data: {...state.data!, products: state.data!.products.filter((p) => p.cartProductId !== cartProductId)}
      }));
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        errorMessage = 'NETWORK_ERROR';
      }else{
        errorMessage = err.error?.message || 'ERROR';
      };
      return errorMessage;
    };
  };

  async changeProductAmount(cartProductId: string, amount: number): Promise<string | void>{
    try {
      await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.patch<void>(`${this.apiUrl}/cart/${cartProductId}`, {amount}, {withCredentials: true}),
          this.authService
        ).pipe(timeout(6700))
      );

      this.cartSignal.update((state) => ({
        ...state,
        data: { ...state.data!, products: state.data!.products.map((p) => p.cartProductId === cartProductId ? {...p, amount } : p) }
      }));
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        errorMessage = 'NETWORK_ERROR';
      }else{
        errorMessage = err.error?.message || 'ERROR';
      };

      return errorMessage;
    };
  }
}
