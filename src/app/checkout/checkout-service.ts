import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { DraftOrderSchema, NewDraftOrderSchema, UnavailableProductSchema } from '../../schemas/checkout-schemas';
import { withAuthRetry } from '../../helpers/withRetry';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { AuthService } from '../account/services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  async createDraftOrder(data: NewDraftOrderSchema): Promise<DraftOrderSchema | UnavailableProductSchema[] | string> {
    try {
      return firstValueFrom(
        withAuthRetry<DraftOrderSchema | UnavailableProductSchema[]>(() => 
          this.http.post<DraftOrderSchema | UnavailableProductSchema[]>(`${this.apiUrl}/checkout`, data, {withCredentials: true}),
          this.authService  
        ).pipe(timeout(6200))
      );
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        console.error('[CheckoutService] Conection or network error:', err);
        errorMessage = 'NETWORK_ERROR' 
      }else{
        errorMessage = err.error?.message || 'ERROR'
      };

      return errorMessage;
    }
  };

  async completeFreeOrder(draftOrderId: string): Promise<string | void>{
    try {
      return firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.post<void>(`${this.apiUrl}/checkout/order/${draftOrderId}`, {}, {withCredentials: true}),
          this.authService
        )
      );
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        console.error('[CheckoutService] Conection or network error:', err);
        errorMessage = 'NETWORK_ERROR' 
      }else{
        errorMessage = err.error?.message || 'ERROR'
      };

      return errorMessage;
    }  
  };

  async createPaymentLink(draftOrderId: string): Promise<string | void> {
    try {
      const result = await firstValueFrom(
        withAuthRetry<string>(() => 
          this.http.post<string>(`${this.apiUrl}/checkout/${draftOrderId}`, {}, {withCredentials: true}),
          this.authService
        )
      );
      window.location.href = result;
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        console.error('[CheckoutService] Conection or network error:', err);
        errorMessage = 'NETWORK_ERROR' 
      }else{
        errorMessage = err.error?.message || 'ERROR'
      };

      return errorMessage;
    }
  };

  cancelOrder(draftOrderId: string){
    withAuthRetry<void>(() => 
      this.http.delete<void>(`${this.apiUrl}/checkout/${draftOrderId}`, {withCredentials: true}),
      this.authService        
    ).pipe(
      catchError(() => {
        return of (null);
      })
    ).subscribe();
  };
}
