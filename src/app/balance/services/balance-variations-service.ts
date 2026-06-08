import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { timeout, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { withAuthRetry } from '../../../helpers/withRetry';
import { BalanceVariationSchema } from '../../../schemas/order-schemas';
import { AuthService } from '../../account/services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class BalanceVariationsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private incomeSignal = signal({
    data: null as BalanceVariationSchema | null,
    loading: false,
    error: null as string | null
  });

  private expensesSignal = signal({
    data: null as BalanceVariationSchema | null,
    loading: false,
    error: null as string | null
  });

  public incomeState = this.incomeSignal.asReadonly();
  public expensesState = this.expensesSignal.asReadonly();

  reset(){
    this.incomeSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
    this.expensesSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
  };

  cleanIncomesError(){
    this.incomeSignal.update((state) => ({
      ...state,
      error: null
    }));
  };

  cleanExpensesError(){
    this.expensesSignal.update((state) => ({
      ...state,
      error: null
    }));
  };

  getIncomes(since?: Date, until?: Date){
    const state = this.incomeSignal().data;
    if(!since && until){ 
      this.expensesSignal.update((state) => ({
        ...state,
        error: 'until missing'
      }));
      return;
    };

    if(state && since && until){
      if(since.getTime() === state.since.getTime() && until.getTime() === state.until.getTime()){
        return;
      };
    };

    let params = new HttpParams();
    if (since) {
      params = params.set('since', since.toISOString());
    }
    if (until) {
      params = params.set('until', until.toISOString());
    }

    if(this.incomeSignal().loading) return;
    this.incomeSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<BalanceVariationSchema>(() => 
      this.http.get<BalanceVariationSchema>(`${this.apiUrl}/order/income`, { params, withCredentials: true }),
      this.authService
    ).pipe(
      timeout(6700),
      tap((result) => {
        this.incomeSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }));
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          console.error('[BalanceService] Conection or network error:', err);
          errorMessage = 'NETWORK_ERROR' 
        }else{
          errorMessage = err.error?.message || 'Error on "getIncome"'
        };

        this.incomeSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  getExpenses(since?: Date, until?: Date){
    const state = this.expensesSignal().data;
    if(!since && until){ 
      this.expensesSignal.update((state) => ({
        ...state,
        error: 'until missing'
      }));
      return;
    };

    if(state && since && until){
      if(since.getTime() === state.since.getTime() && until.getTime() === state.until.getTime()){
        return;
      };
    };

    let params = new HttpParams();
    if (since) {
      params = params.set('since', since.toISOString());
    }
    if (until) {
      params = params.set('until', until.toISOString());
    }

    if(this.expensesSignal().loading) return;
    this.expensesSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<BalanceVariationSchema>(() => 
      this.http.get<BalanceVariationSchema>(`${this.apiUrl}/order/expenses`, { params, withCredentials: true }),
      this.authService
    ).pipe(
      timeout(6700),
      tap((result) => {
        this.expensesSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }));
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          console.error('[BalanceService] Conection or network error:', err);
          errorMessage = 'NETWORK_ERROR' 
        }else{
          errorMessage = err.error?.message || 'Error on "getExpenses"'
        };

        this.expensesSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}
