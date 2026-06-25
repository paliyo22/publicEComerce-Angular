import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthSchema, LogSchema } from '../../../../schemas/account-schemas';
import { catchError, Observable, of, switchMap, tap, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
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
      tap((result) => {
        this.authSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }));
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          console.error('[AuthService] Conection or network error:', err);
          errorMessage = 'NETWORK_ERROR' 
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
      }),
      catchError((err) => {
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          console.error('[AuthService] Conection or network error:', err);
          // ACA CONFIGURAR UNA ALERTA DEERROR AL INTENTAR CERRAR SESION 
        }else{
          // ACA CONFIGURAR UNA ALERTA DE SESION CERRADA
          console.error(`[AuthService]: "logOut": ${err.error}`); //ELIMINAR LUEGO DE PRUEBAS
          this.reset();
        };
        return of (null);
      })
    ).subscribe();
  };

  refresh(): Observable<boolean>{
    return this.http.post<AuthSchema>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
    .pipe(
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
          console.error('[AuthService] Conection or network error:', err);
          errorMessage = 'NETWORK_ERROR' 
        }else{
          errorMessage = err.error?.message || 'Your session has expired.'
          console.error(`[AuthService]: "refresh": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        // ACA CONFIGURAR UNA ALERTA DE SESION VENCIDA 
        this.reset();
        return of (false);
      })
    );
  };
}
