import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, timeout, tap, catchError, of, map, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { withAuthRetry } from '../../../helpers/withRetry';
import { WithdrawalSchema, IncomeSchema, validateWithdrawalSchema, validateIncomeSchema } from '../../../schemas/balance-schema';
import { AuthService } from '../../account/services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private balanceSignal = signal({
    data: { 
      balance: 0,
      date: null as Date | null
    },
    loading: false,
    error: null as string | null
  });

  private withdrawalSignal = signal({
    data: [] as WithdrawalSchema[],
    loading: false,
    error: null as string | null
  });
  private incomeSignal = signal({
    data: [] as IncomeSchema[],
    loading: false,
    error: null as string | null
  });

  public withdrawalState = this.withdrawalSignal.asReadonly();
  public incomeState = this.incomeSignal.asReadonly(); 
  public balanceState = this.balanceSignal.asReadonly();

  private abortPolling = false;

  reset(){
    this.abortPolling = true;
    this.balanceSignal.update(() => ({
      data: {
        balance: 0,
        date: null
      },
      loading: false,
      error: null
    }));

    this.withdrawalSignal.update(() => ({
      data: [],
      loading: false,
      error: null
    }));

    this.incomeSignal.update(() => ({
      data: [],
      loading: false,
      error: null
    }));
  };

  async getBalance(force = false){
    if(!force && this.balanceSignal().data.balance){
      return;
    }
    if(this.balanceSignal().loading === true){
      return;
    }
    this.abortPolling = false;
    this.balanceSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    try {
      while (!this.abortPolling) {
        let success = false;

        try {
          const response = await firstValueFrom(
            withAuthRetry<number>(
              () => this.http.get<number>(`${this.apiUrl}/balance`, { withCredentials: true }),
              this.authService
            ).pipe(timeout(6700))
          );

          this.balanceSignal.update(() => ({
            data: { balance: response, date: new Date() },
            loading: false,
            error: null
          }));
          success = true;

        } catch (err) {
          if (err instanceof HttpErrorResponse && err.error?.message === 'NOT_FOUND') {
            throw new Error('NOT_FOUND');
          }
        }

        if (success) break; 

        await new Promise((r) => setTimeout(r, 10000));
      }
    } catch (err: any) {
      this.balanceSignal.update((state) => ({
        ...state,
        loading: false,
        error: err.message
      }));
    }
  };

  async makeWithdrawal(amount: number): Promise<void | {data: string; error: boolean}>{
    try{
      const result = await firstValueFrom(
        withAuthRetry<void | WithdrawalSchema>(() => 
          this.http.post<void | WithdrawalSchema>(`${this.apiUrl}/balance`, {amount}, {withCredentials: true}),
          this.authService
        )
      );
      if(result){
        this.withdrawalSignal.update((state) => ({
          ...state,
          data: [...state.data, result]
        }));
      };
    }catch(err: any){
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        console.error('[BalanceService]: Conection or network error on "makeWithdrawal":', err);
        errorMessage = 'NETWORK_ERROR';
      }else{
        if(err.error.status === 504){
          return {
            data: err.error.data,
            error: false
          };
        };
        errorMessage = err.error.message || 'ERROR';
        console.error(`[BalanceService]: "makeWithdrawal": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };
      return {
        data: errorMessage,
        error: true
      };
    }
  }

  getWithdrawalList(force = false) {
    if(!force && this.withdrawalSignal().data.length){
      return;
    }
    if(this.withdrawalSignal().loading === true){
      return;
    }
    this.withdrawalSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<WithdrawalSchema[]>(() => 
      this.http.get<WithdrawalSchema[]>(`${this.apiUrl}/balance/withdrawal-list`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((response) => {
        const failures = new Array<any>();
        const withdrawals = new Array<WithdrawalSchema>();
        response.forEach((r) => {
          const result = validateWithdrawalSchema(r);
          if(!result.success){
            failures.push(result.issues);
          }else{
            withdrawals.push(result.output);
          };
        });
        if(failures.length){
          console.error(`[BalanceService]: Validation of response failed on "getWithdrawalList".`, failures);
          throw new Error('ERROR');
        }
        return withdrawals;
      }),
      tap((result) => {
        this.withdrawalSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }))
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(err instanceof Error){ 
            errorMessage = err.message;
          }else{
            if(!(err instanceof TimeoutError)){
              console.error('[BalanceService]: Conection or network error on "getWithdrawalList":', err);
            };
            errorMessage = 'NETWORK_ERROR' 
          };
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[BalanceService]: "getWithdrawalList": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.withdrawalSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  getIncomeList(force = false) {
    if(!force && this.incomeSignal().data.length){
      return;
    }
    if(this.incomeSignal().loading === true){
      return;
    }
    this.incomeSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<IncomeSchema[]>(() => 
      this.http.get<IncomeSchema[]>(`${this.apiUrl}/balance/income-list`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((response) => {
        const failures = new Array<any>();
        const incomes = new Array<IncomeSchema>();
        response.forEach((r) => {
          const result = validateIncomeSchema(r);
          if(!result.success){
            failures.push(result.issues);
          }else{
            incomes.push(result.output);
          };
        });
        if(failures.length){
          console.error(`[BalanceService]: Validation of response failed on "getIncomeList".`, failures);
          throw new Error('ERROR');
        }
        return incomes;
      }),
      tap((result) => {
        this.incomeSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }))
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(err instanceof Error){ 
            errorMessage = err.message;
          }else{
            if(!(err instanceof TimeoutError)){
              console.error('[BalanceService]: Conection or network error on "getIncomeList":', err);
            };
            errorMessage = 'NETWORK_ERROR'; 
          };
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[BalanceService]: "getIncomeList": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
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

  async getResult(token: string): Promise<void | string>{
    let attempts = 0;
    try{
      while(attempts < 50){
        try {
          await firstValueFrom(
            withAuthRetry<void>(() => 
              this.http.get<void>(`${this.apiUrl}/result/${token}`, {withCredentials: true}),
              this.authService
            )
          );
          return;
        } catch (err: any) {
          if(err instanceof HttpErrorResponse){
            if(err.error.status === 500){
              throw new Error('FAILED');
            };
            if(err.error.status === 410){
              throw new Error('ALREADY_RESOLVED');
            };
          }
          attempts++;
        };
        if(attempts === 50){ // luego de 1 minuto y medio(aprox) se cancela 
          throw new Error('FAILED'); //es lo mismo porque el caso failed tambien implica que hay que verificar porque no es 100% seguro que haya fallado, la probabilidad de que haya tenido exito igualmente es infima e inprobable pero no es 0
        }
        await new Promise((r) => setTimeout(r, 2000));
      };
    }catch (err: any){
      return err.message;
    };  
  };
}
