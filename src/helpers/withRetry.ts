import { catchError, Observable, switchMap, throwError } from "rxjs";
import { AuthService } from "../app/account/services/auth/auth-service";

export function withAuthRetry<T>(
  requestFn: () => Observable<T>,
  authService: AuthService
): Observable<T> {
  return requestFn().pipe(
    catchError(err => {
      if (err.status === 401 || err.status === 403) {
        return authService.refresh().pipe(
          switchMap(success => success ? requestFn() : throwError(() => err)),
          catchError(() => throwError(() => err))
        );
      }
      return throwError(() => err);
    })
  );
}