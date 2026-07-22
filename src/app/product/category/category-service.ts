import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { timeout, tap, catchError, of, map } from 'rxjs';
import { ECategory } from '../../../enum/category';
import { environment } from '../../../environments/environment.development';
import { PartialProductSchema, validatePartialProductSchema } from '../../../schemas/product-schemas';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  private categorySignal = signal({
    data: new Map<number, PartialProductSchema[]>(),
    category: null as ECategory | null,
    total: 0,
    loading: false,
    error: null as string | null
  });

  public state = this.categorySignal.asReadonly();

  reset(): void {
    this.categorySignal.set({
      data: new Map<number, PartialProductSchema[]>(),
      category: null,
      total: 0,
      loading: false,
      error: null
    });
  }

  getCategoryTotalProducts(category: ECategory, limit: number, offset = 0): void {
    if(this.categorySignal().loading) return;
    const params = new HttpParams().set('category', category);
    this.categorySignal.update(() => ({
      data: new Map<number, PartialProductSchema[]>(),
      category: category,
      total: 0,
      loading: true,
      error: null
    }));

    this.http.get<number>(`${this.apiUrl}/product/total`, { params })
    .pipe(
      timeout(6700),
      tap((response) => {
        this.categorySignal.update((state) => ({
          ...state,
          total: response,
        }));
        this.getCategoryProductList(category, limit, offset);
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
        };

        this.categorySignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
  
  getCategoryProductList(category: ECategory, limit?: number, offset?: number): void {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    };
    if (offset !== undefined) {
      params = params.set('offset', offset.toString());
    };
  
    this.http.get<PartialProductSchema[]>(`${this.apiUrl}/product/category/${category}`, { params })
    .pipe(
      timeout(6700),
      map((data) => {
        return data.map((p) => {
          const aux = validatePartialProductSchema(p);
          if(!aux.success){
            throw new Error('PARSE_ERROR');
          };
          return aux.output;
        });
      }),
      tap((response) => {
        this.categorySignal.update((state) => {
          const newItemsMap = new Map(state.data);
          const page = Math.floor((offset || 0) / (limit || 20)) + 1;

          if(offset === 0) {
            newItemsMap.clear();
          }
          
          newItemsMap.set(page, response);
          return{
            ...state,
            loading: false,
            data: newItemsMap
          }
        });     
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

        this.categorySignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}
