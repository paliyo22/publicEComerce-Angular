import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { timeout, tap, catchError, of, TimeoutError, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { withAuthRetry } from '../../../helpers/withRetry';
import { PartialOrderSchema, SalesSchema, validatePartialOrderSchema, validateSalesSchema } from '../../../schemas/order-schemas';
import { AuthService } from '../../account/services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class RecordService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private salesSignal = signal({
    data: [] as SalesSchema[],
    loading: false,
    error: null as string | null
  });

  private shoppingSignal = signal({
    data: [] as PartialOrderSchema[],
    loading: false,
    error: null as string | null
  });
  
  public shoppingState = this.shoppingSignal.asReadonly();
  public salesState = this.salesSignal.asReadonly();
  
  reset() {
    this.shoppingSignal.update(() => ({
      data: [],
      loading: false,
      error: null
    }));
    this.salesSignal.update(() => ({
      data: [],
      loading: false,
      error: null
    }));
  };

  getSalesList(force = false){
    if(this.salesSignal().loading) return;
    if(!force && this.salesSignal().data.length) return;

    this.salesSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<SalesSchema[]>(() =>
      this.http.get<SalesSchema[]>(`${this.apiUrl}/order/sales-list`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((data) => {
        return data.map((s) => {
          const aux = validateSalesSchema(s);
          if(!aux.success){
            throw new Error('PARSE_ERROR');
          };
          return aux.output;
        });
      }),
      tap((result) => {
        this.salesSignal.update(() => ({
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

        this.salesSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
  
  getShoppingList(force = false){
    if(this.shoppingSignal().loading) return;
    if(!force && this.shoppingSignal().data.length) return;

    this.shoppingSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<PartialOrderSchema[]>(() =>
      this.http.get<PartialOrderSchema[]>(`${this.apiUrl}/order/shopping-list`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((data) => {
        return data.map((p) => {
          const aux = validatePartialOrderSchema(p);
          if(!aux.success){
            throw new Error('PARSE_ERROR');
          };
          return aux.output;
        });
      }),
      tap((result) => {
        this.shoppingSignal.update(() => ({
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

        this.shoppingSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}
