import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, tap, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { PartialProductSchema, validatePartialProductSchema } from '../../../schemas/product-schemas';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  private searchSignal = signal({
    data: null as {products: PartialProductSchema[], accounts: string[]} | null,
    search: null as string | null,
    loading: false,
    error: null as string | null
  });

  public state = this.searchSignal.asReadonly();

  reset(): void {
    this.searchSignal.set({
      data: null,
      search: null,
      loading: false,
      error: null
    });
  };

  search(contains: string){
    const normalized = contains.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
    if(!normalized || normalized.length < 3){
      this.searchSignal.update(() => ({
        data: null,
        search: normalized,
        loading: false,
        error: null
      }));
      return;
    };

    if(this.searchSignal().search === normalized) return;
    const params = new HttpParams().set('contain', normalized);

    if(this.searchSignal().loading) return;
    this.searchSignal.update(() => ({
      data: null,
      search: null,
      loading: true,
      error: null
    }));

    this.http.get<{ products: PartialProductSchema[], accounts: string[] }>(`${this.apiUrl}/search`, { params })
    .pipe(
      timeout(6700),
      map((data) => {
        const products = data.products.map((p) => {
          const aux = validatePartialProductSchema(p);
          if(!aux.success){
            throw new Error('PARSE_ERROR');
          }
          return aux.output;
        });

        return { products, accounts: data.accounts };
      }),
      tap((response) => {
        if(!response.accounts.length && !response.products.length){
          this.searchSignal.update((state) => ({
            ...state,
            search: normalized,
            data: null,
            loading: false
          }));
        }else{
          this.searchSignal.update((state) => ({
            ...state,
            search: normalized,
            data: response,
            loading: false
          }));  
        };
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

        this.searchSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}