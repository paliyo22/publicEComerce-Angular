import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthSchema, LogSchema, validateAuth } from '../../../../schemas/account-schemas';
import { catchError, map, Observable, of, switchMap, tap, timeout } from 'rxjs';
import { AlertService } from '../../../alert-component/alert-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private apiUrl = environment.API_URL;

  private authSignal = signal({
    data: null as AuthSchema | null,
    loading: false,
    error: null as string | null
  });

  public state = this.authSignal.asReadonly();

  reset(){
    this.authSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
  };

  log(data: AuthSchema){ 
    this.authSignal.update(() => ({
      data: data,
      loading: false,
      error: null
    }));
    this.alertService.setAlert(`Bienvenido ${this.authSignal().data!.username}`, 'info');
  };

  logIn(data: LogSchema){
    if(this.authSignal().loading) return;
    this.authSignal.update(() => ({
      data: null,
      loading: true,
      error: null
    }));

    this.http.post<AuthSchema>(`${this.apiUrl}/auth/login`, data, {withCredentials: true})
    .pipe(
      timeout(6700),
      map((response) => {
        const auth = validateAuth(response);
        if(!auth.success){
          throw new Error('PARSE_ERROR');
        }else {
          return auth.output;
        };
      }),
      tap((result) => {
        this.authSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }));
        this.alertService.setAlert(`Bienvenido ${this.authSignal().data!.username}`, 'info');
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
          errorMessage = err.error?.message || 'Error on "logIn"'
        };

        this.authSignal.update(() => ({
          data: null,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  logOut(){
    if(this.authSignal().loading) return;
    this.authSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
    .pipe(
      timeout(6700),
      tap(() => {
        this.reset();
        this.alertService.setAlert(`Hasta la proxima.`, 'success');
      }),
      catchError((err) => {
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          this.alertService.setAlert(`Error de coneccion al intentar cerrar sesion. Recargue la pagina e intente nuevamente.`, 'error');
        }else{
          this.alertService.setAlert(`Hasta la proxima.`, 'success');
          this.reset();
        };
        return of (null);
      })
    ).subscribe();
  };

  refresh(): Observable<boolean>{
    return this.http.post<AuthSchema>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
    .pipe(
      map((response) => {
        const auth = validateAuth(response);
        if(!auth.success){
          throw new Error('PARSE_ERROR');
        }else {
          return auth.output;
        };
      }),
      tap((result) => {
        this.authSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }));
      }),
      switchMap(() => of(true)),
      catchError((err) => {
        if(err.status !== 500){
          this.reset();
        };
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(err instanceof Error){
            errorMessage = err.message;
          }else{
            errorMessage = 'NETWORK_ERROR';
          };
        }else{
          errorMessage = err.error?.message || 'Your session has expired.';
        };
        this.alertService.setAlert(`La session ha expirado.`, 'info');
        this.reset();
        return of (false);
      })
    );
  };
}
