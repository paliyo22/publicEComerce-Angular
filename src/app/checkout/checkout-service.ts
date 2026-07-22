import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { DraftOrderSchema, NewDraftOrderSchema, UnavailableProductSchema, validateDraftOrderSchema, validateUnavailableProductSchema } from '../../schemas/checkout-schemas';
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

  async createDraftOrder(data: NewDraftOrderSchema): Promise<{ success: boolean, data?: DraftOrderSchema | UnavailableProductSchema[], error?: string}> {
    try {
      const result = await firstValueFrom(
        withAuthRetry<DraftOrderSchema | UnavailableProductSchema[]>(() => 
          this.http.post<DraftOrderSchema | UnavailableProductSchema[]>(`${this.apiUrl}/checkout`, data, {withCredentials: true}),
          this.authService  
        ).pipe(timeout(6700))
      );

      if(Array.isArray(result)){
        const unavailableArray = result.map((u) => {
          const aux = validateUnavailableProductSchema(u);
          if(!aux.success){
            throw new Error('PARSE_ERROR');
          }
          return aux.output;
        });         
        return { success: false, data: unavailableArray };
      }

      const response = validateDraftOrderSchema(result);
      if(!response.success){
        throw new Error('PARSE_ERROR');
      }
      return { success: true, data: response.output }
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(err instanceof Error){
          errorMessage = err.message;
        }else{
          errorMessage = 'NETWORK_ERROR'; 
        };
      }else{
        errorMessage = err.error?.message || 'ERROR'
      };

      return { success: false, error: errorMessage };
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
        errorMessage = 'NETWORK_ERROR' 
      }else{
        errorMessage = err.error?.message || 'ERROR'
      };

      return errorMessage;
    }  
  };

  async createPaymentLink(draftOrderId: string): Promise<{success: boolean, data: string}> {
    try {
      const result = await firstValueFrom(
        withAuthRetry<{link: string}>(() => 
          this.http.post<{link: string}>(`${this.apiUrl}/checkout/${draftOrderId}`, {}, {withCredentials: true}),
          this.authService
        )
      );
      return{success: true, data: result.link};
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        errorMessage = 'NETWORK_ERROR' 
      }else{
        errorMessage = err.error?.message || 'ERROR'
      };

      return {success: false, data: errorMessage};
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

  //---------------------- TEST ---------------------------------------
  async completeTestOrder(draftOrderId: string): Promise<{success: boolean, data: string}>{
    try {
      await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.post<void>(`${this.apiUrl}/checkout/test/purchase/${draftOrderId}`, {}, {withCredentials: true}),
          this.authService
        )
      );

      return {success: true, data: draftOrderId}
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        errorMessage = 'NETWORK_ERROR' 
      }else{
        errorMessage = err.error?.message || 'ERROR'
      };

      return {success: false, data: errorMessage};
    }  
  };
}
