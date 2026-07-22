import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { timeout, tap, catchError, of, TimeoutError, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { PartialProductSchema, validatePartialProductSchema } from '../../../schemas/product-schemas';

@Injectable({
  providedIn: 'root',
})
export class FeaturedService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  private featuredSignal = signal({
    data: [] as PartialProductSchema[],
    loading: false,
    error: null as string | null
  });

  public state = this.featuredSignal.asReadonly();

  reset(){
    this.featuredSignal.set({
      data: [],
      loading: false,
      error: null
    });
  };

  getFeaturedList(limit?: number){
    if(this.featuredSignal().data.length) return;
    
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    };

    this.featuredSignal.update(() => ({
      data: [],
      loading: true,
      error: null
    }));
  
    this.http.get<PartialProductSchema[]>(`${this.apiUrl}/product/featured`, { params })
    .pipe(
      timeout(6700),
      map((data) => {
        return data.map((p) => {
          const aux = validatePartialProductSchema(p);
          if(!aux.success){
            throw new Error('PARSE_ERROR');
          }
          return aux.output;
        })
      }),
      tap((response) => {
        this.featuredSignal.update((state) => ({
            ...state,
            data: response,
            loading: false
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

        this.featuredSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}
