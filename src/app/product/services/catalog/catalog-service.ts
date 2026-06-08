import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { timeout, tap, catchError, of, map, TimeoutError } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { PartialProductSchema, validatePartialProduct } from '../../../../schemas/product-schemas';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  private catalogSignal = signal({
    data: new Map<number, PartialProductSchema[]>(),
    total: 0,
    loading: false,
    error: null as string | null
  });

  public state = this.catalogSignal.asReadonly();

  reset(): void {
    this.catalogSignal.set({
      data: new Map<number, PartialProductSchema[]>(),
      total: 0,
      loading: false,
      error: null
    });
  }

  getTotalProducts(limit?: number){
    if(this.catalogSignal().loading) return;
    this.reset();
    this.catalogSignal.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    this.http.get<number>(`${this.apiUrl}/product/total`)
    .pipe(
      timeout(6700),
      tap((response) => {
          this.catalogSignal.update((state) => ({
            ...state,
            total: response
          }));
          this.getProductList(limit, 0);
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(!(err instanceof TimeoutError)){
            console.error('[CatalogService]: Conection or network error on "getTotalProducts":', err);
          }
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[CatalogService]: "getTotalProducts": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.catalogSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
  
  getProductList(limit?: number, offset?: number){
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (offset) {
      params = params.set('offset', offset.toString());
    }
      
    this.http.get<PartialProductSchema[]>(`${this.apiUrl}/product`, { params })
    .pipe(
      timeout(6700),
      map((data) => {
        const rejections = new Array<any>(); 
        const products = new Array<PartialProductSchema>(); 
        data.forEach((p) => {
          const result = validatePartialProduct(p);
          if(!result.success){
            rejections.push(p);
          }else{
            products.push(result.output);
          };
        });
        if(rejections.length) 
          console.warn(`[CatalogService] Error procesing ${rejections.length} partial products:`, rejections);
        
        return products;
      }),
      tap((response) => {
        this.catalogSignal.update((state) => {
          const newItemsMap = new Map(state.data);
          const page = Math.floor((offset || 0) / (limit || 20)) + 1;

          if(offset === 0) {
            newItemsMap.clear();
          }
          
          newItemsMap.set(page, response);
          return{
            ...state,
            data: newItemsMap,
            loading: false,
            error: null
          }
        });     
      }),
      catchError((err) => {
        let errorMessage: string;
        if (err.status === 0 || !(err instanceof HttpErrorResponse)) {
          if(!(err instanceof TimeoutError)){
            console.error('[CatalogService]: Conection or network error on "getProductList":', err);
          }
          errorMessage = 'NETWORK_ERROR'; 
        }else{
          errorMessage = err.error?.message || 'ERROR';
          console.error(`[CatalogService]: "getProductList": ${errorMessage}`); //ELIMINAR LUEGO DE PRUEBAS
        };

        this.catalogSignal.update((state) => ({
          ...state,
          loading: false,
          error: errorMessage
        }));
        return of (null);
      })
    ).subscribe();
  };
}