import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { OrderSchema, validateOrderSchema } from '../../../schemas/order-schemas';
import { withAuthRetry } from '../../../helpers/withRetry';
import { catchError, firstValueFrom, map, of, tap, timeout } from 'rxjs';
import { EStateStatus } from '../../../enum/state-status';
import { AuthService } from '../../account/services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class OrderDetailsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private detailsSignal = signal({
    data: null as OrderSchema | null,
    loading: false,
    error: null as string | null
  });

  public state = this.detailsSignal.asReadonly();

  reset() {
    this.detailsSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
  };

  getOrder(orderId?: string, draftOrderId?: string){
    if(this.detailsSignal().loading) return;
    
    const order = this.detailsSignal().data;
    if(order && orderId && order.id === orderId) return;

    if(orderId && draftOrderId) return;

    let params = new HttpParams();
    if(orderId){
      params = params.set('orderId', orderId!);
    }else{
      params = params.set('draftOrderId', draftOrderId!);
    };

    this.detailsSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<OrderSchema>(() =>
      this.http.get<OrderSchema>(`${this.apiUrl}/order`, { params, withCredentials: true }),
      this.authService
    ).pipe(
      timeout(6700),
      map((data) => {
        const aux = validateOrderSchema(data);
        if(!aux.success){
          throw new Error('PARSE_ERROR');
        } 
        return aux.output;
      }),
      tap((result) => {
        this.detailsSignal.update(() => ({
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

        this.detailsSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  async getOrderStatus(draftOrderId: string){
    if(this.detailsSignal().loading) return;
    this.detailsSignal.update(() => ({
      data: null,
      loading: true,
      error: null
    }));
    try{
      let attempts = 0;
      let result: EStateStatus | string = EStateStatus.Pending;
      while(result === EStateStatus.Pending){
        result = await firstValueFrom(
          withAuthRetry<{status: EStateStatus}>(() => 
            this.http.get<{status: EStateStatus}>(`${this.apiUrl}/checkout/status/${draftOrderId}`, { withCredentials: true }),  
            this.authService
          )
        ).then((response) => {
          if(response.status === EStateStatus.Pending){
            attempts++;
          }
          return response.status; 
        }).catch((err) => {
          if(err instanceof HttpErrorResponse){
            if(err.error.message === 'NOT_FOUND'){
              this.getOrder(undefined, draftOrderId);
              return EStateStatus.Completed; 
            };
          };
          if(attempts > 12){
            throw new Error('RESULT_TIMEOUT');
          }
          attempts++;
          return EStateStatus.Pending;
        });
        if(result === EStateStatus.Pending){
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
      this.reset();
      this.getOrder(undefined, draftOrderId);
    }catch(err: any){
      this.detailsSignal.update(() => ({
        data: null,
        loading: false,
        error: err.message
      }));
    };
  };
}