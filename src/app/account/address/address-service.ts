import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { timeout, tap, catchError, of, TimeoutError, firstValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { withAuthRetry } from '../../../helpers/withRetry';
import { AddressSchema, validateAddressSchema } from '../../../schemas/account-schemas';
import { AuthService } from '../services/auth/auth-service';
import { NewAddressSchema } from '../../../schemas/create-account-schema';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.API_URL;

  private addressSignal = signal({
    data: null as AddressSchema[] | null,
    loading: false,
    error: null as string | null
  });

  public state = this.addressSignal.asReadonly();

  reset() {
    this.addressSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
  };

  cleanError(){
    this.addressSignal.update((state) => ({
      ...state,
      error: null
    }));
  };

  getAddressList() {
    if(this.addressSignal().loading) return;
    
    this.addressSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    withAuthRetry<AddressSchema[]>(() => 
      this.http.get<AddressSchema[]>(`${this.apiUrl}/address`, {withCredentials: true}),
      this.authService
    ).pipe(
      timeout(6700),
      map((data) => {
        return data.map((a) => {
          const aux = validateAddressSchema(a);
          if(!aux.success){
            throw new Error('PARSE_ERROR');
          }
          return aux.output;
        });
      }),
      tap((result) => {
        this.addressSignal.update(() => ({
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
            errorMessage = 'NETWORK_ERROR'; 
          } 
        }else{
          errorMessage = err.error?.message || 'ERROR';
        };

        this.addressSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };

  async addAddress(address: NewAddressSchema): Promise<boolean>{
    if(this.addressSignal().loading) return false;
    this.addressSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    try{
      const result = await firstValueFrom(
        withAuthRetry<AddressSchema>(() => 
          this.http.post<AddressSchema>(`${this.apiUrl}/address`, address, {withCredentials: true}),
          this.authService
        ).pipe(timeout(6700))
      );

      const aux = validateAddressSchema(result);      
      if(!aux.success){
        throw new Error('PARSE_ERROR');
      }

      this.addressSignal.update((state) => ({
        data: [...state.data!, result],
        loading: false,
        error: null
      }));
      return true;
    }catch (err: any){
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
      this.addressSignal.update((state) => ({
        ...state,
        loading: false,
        error: errorMessage
      }));
      return false;
    }
  };

  async deleteAddress(addressId: string): Promise<string | void>{
    try {
      await firstValueFrom(
        withAuthRetry<void>(() => 
          this.http.delete<void>(`${this.apiUrl}/address/${addressId}`, {withCredentials: true}),
          this.authService
        ).pipe(timeout(6700))
      );

      this.addressSignal.update((state) => ({
        data: state.data!.filter((a) => a.id !== addressId),
        loading: false,
        error: null  
      }));
    } catch (err: any) {
      let errorMessage: string;
      if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
        errorMessage = 'NETWORK_ERROR'; 
      }else{
        errorMessage = err.error?.message || 'ERROR';
      };
      return errorMessage;
    };
  };
}
