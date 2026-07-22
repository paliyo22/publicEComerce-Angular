import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { AuthService } from '../auth/auth-service';
import { AccountSchema, AuthSchema, validateAccountSchema, validateAuth } from '../../../../schemas/account-schemas';
import { withAuthRetry } from '../../../../helpers/withRetry';
import { catchError, firstValueFrom, map, of, tap, timeout } from 'rxjs';
import { NewBusinessSchema, NewUserSchema, UpdateBusinessSchema, UpdateUserSchema } from '../../../../schemas/create-account-schema';
import { AlertService } from '../../../alert-component/alert-service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly alertService = inject(AlertService);
  private apiUrl = environment.API_URL;

  private accountSignal = signal({
    data: null as AccountSchema | null,
    loading: false,
    error: null as string | null
  });

  public state = this.accountSignal.asReadonly();

  reset(){
    this.accountSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }))
  };

  cleanError(){
    this.accountSignal.update((state) => ({
      ...state,
      error: null
    }));
  };

  getAccountInfo(force = false){
    if(!force && this.accountSignal().data) return;

    this.accountSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<AccountSchema>(() => 
      this.http.get<AccountSchema>(`${this.apiUrl}/account`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((response) => {
        const result = validateAccountSchema(response);
        if(!result.success){
          throw new Error('PARSE_ERROR');
        };
        return result.output;
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
          if(err instanceof Error){
            errorMessage = err.message;
          }else{
            errorMessage = 'NETWORK_ERROR';
          };
        }else{
          errorMessage = err.error?.message || 'ERROR';
        };

        this.accountSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  async createAccount(account: NewBusinessSchema | NewUserSchema): Promise<string | void>{
    try {
      const result = await firstValueFrom(
        this.http.post<AuthSchema | void>(`${this.apiUrl}/account`, account, {withCredentials: true}).pipe(timeout(6700))
      );

      if(result){
        const auth = validateAuth(result);
        if(!auth.success){
          throw new Error('PARSE_ERROR');
        }else{
          this.authService.log(auth.output);
        }
      };
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(err instanceof Error){
          errorMessage = err.message;
        }else{
          errorMessage = 'NETWORK_ERROR' 
        };
      }else{
        errorMessage = err.error?.message || 'ERROR';
      };
      return errorMessage;
    };
  };

  updateAccount(account: UpdateBusinessSchema | UpdateUserSchema) {
    if(this.accountSignal().loading) return;
    this.accountSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));
    withAuthRetry<AccountSchema | void>(() => 
      this.http.put<AccountSchema | void>(`${this.apiUrl}/account`, account, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((response) => {
        if(response){
          const result = validateAccountSchema(response);
          if(!result.success){
            throw new Error('PARSE_ERROR');
          }else{
            return result.output;
          };
        }else {
          return;
        };
      }),
      tap((result) => {
        if(result){
          this.accountSignal.update(() => ({
            data: result,
            loading: false,
            error: null
          }));
        }else{
          this.getAccountInfo(true);
        };
        this.alertService.setAlert('Exito.', 'success');
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(err instanceof Error){
            errorMessage = err.message;
          }else{
            errorMessage = 'NETWORK_ERROR' 
          };
        }else{
          errorMessage = err.error?.message || 'ERROR';
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

  changePassword(oldPassword: string, newPassword: string) {
    if(this.accountSignal().loading) return;
    const passwords = {oldPassword, newPassword}
    this.accountSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<void>(() => 
      this.http.patch<void>(`${this.apiUrl}/account/password`, passwords, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      tap(() => {
        this.accountSignal.update((state) => ({
          ...state,
          loading: false
        }));
        this.alertService.setAlert('Exito.', 'success');
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
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

  changeCbu(password: string, newCBU: string) {
    if(this.accountSignal().loading) return;
    this.accountSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<void>(() => 
      this.http.patch<void>(`${this.apiUrl}/account/cbu`, {password, newCBU}, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      tap(() => {
        this.accountSignal.update((state) => ({
          ...state,
          loading: false
        }));
        this.alertService.setAlert('Exito.', 'success');
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
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

  deleteAccount(password: string) {
    if(this.accountSignal().loading) return;
    this.accountSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<void>(() => 
      this.http.delete<void>(`${this.apiUrl}/account`, {withCredentials: true, body: {password}}),
      this.authService
    ).pipe(
      timeout(6700),
      tap(() => {
        this.reset();
        this.authService.reset();
        this.alertService.setAlert('Exito.', 'success');
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
        };

        this.accountSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}
