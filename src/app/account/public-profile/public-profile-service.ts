import { inject, Injectable, signal } from '@angular/core';
import { PublicAccountSchema, validatePublicAccountSchema } from '../../../schemas/account-schemas';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { catchError, map, of, tap, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  private profileSignal = signal({
    data: null as PublicAccountSchema | null,
    loading: false,
    error: null as string | null
  });

  public state = this.profileSignal.asReadonly();

  reset() {
    this.profileSignal.update(() => ({
      data: null,
      loading: false,
      error: null
    }));
  };

  getPublicAccountInfo(username: string): void{
    if(this.profileSignal().loading) return;

    this.profileSignal.update(() => ({
      data: null,
      loading: true,
      error: null
    }));
  
    this.http.get<PublicAccountSchema>(`${this.apiUrl}/account/${username}`)
    .pipe(
      timeout(6700),
      map((response) => {
        const aux = validatePublicAccountSchema(response);
        if(!aux.success){
          throw new Error('PARSE_ERROR');
        }
        return aux.output;
      }),
      tap((response) => {
        this.profileSignal.update(() => ({
          data: response,
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

        this.profileSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };  
}
