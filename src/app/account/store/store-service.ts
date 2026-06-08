import { inject, Injectable, signal } from '@angular/core';
import { StoreSchema } from '../../../schemas/account-schemas';
import { NewStoreSchema } from '../../../schemas/create-account-schema';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { timeout, tap, catchError, TimeoutError, of, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { withAuthRetry } from '../../../helpers/withRetry';
import { AuthService } from '../services/auth/auth-service';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private storeSignal = signal({
    data: null as StoreSchema[] | null,
    loading: false,
    error: null as string | null
  });

  public state = this.storeSignal.asReadonly();

  reset() {
    this.storeSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
  };

  cleanError(){
    this.storeSignal.update((state) => ({
      ...state,
      error: null
    }));
  };

  getStoreList() {
    if(this.storeSignal().loading) return;
    
    this.storeSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<StoreSchema[]>(() => 
      this.http.get<StoreSchema[]>(`${this.apiUrl}/store`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      tap((result) => {
        this.storeSignal.update(() => ({
          data: result,
          loading: false,
          error: null
        }))
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(!(err instanceof TimeoutError)){
            console.error('[StoreService]: Conection or network error on "getStoreList":', err);
          }
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[StoreService]: "getStoreList": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.storeSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  async addStore(store: NewStoreSchema): Promise<boolean>{
    if(this.storeSignal().loading) return false;

    this.storeSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));
    try {
      const result = await firstValueFrom(
        withAuthRetry<StoreSchema>(() => 
          this.http.post<StoreSchema>(`${this.apiUrl}/store`, store, {withCredentials: true}),
          this.authService
        ).pipe(timeout(6700))
      );

      this.storeSignal.update((state) => ({ // esta funcion se llama con los datos ya cargados.
        data: [...state.data!, result],
        loading: false,
        error: null
      }));
      return true;
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[StoreService]: Conection or network error on "addStore":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[StoreService]: "addStore": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };
      this.storeSignal.update((state) => ({
        ...state,
        loading: false,
        error: errorMessage
      }));
      return false;
    };
  };

  async deleteStore(storeId: string): Promise<void | string>{
    try {
      await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.delete<void>(`${this.apiUrl}/store/${storeId}`, {withCredentials: true}),
          this.authService
        ).pipe(timeout(6700))
      );
      
      this.storeSignal.update((state) => {// esta funcion se llama con los datos ya cargados.
        return{
          data: state.data!.filter((a) => a.id !== storeId),
          loading: false,
          error: null  
        };
      });

    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        if(!(err instanceof TimeoutError)){
          console.error('[StoreService]: Conection or network error on "deleteStore":', err);
        }
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
        console.error(`[StoreService]: "deleteStore": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
      };
      return errorMessage;
    };
  };
}