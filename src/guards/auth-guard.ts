import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../app/account/services/auth/auth-service';
import { inject } from '@angular/core';

export const authGuard = (requireAuth = true): CanActivateFn => {
  return () => {
    const authService = inject(AuthService)
    const router = inject(Router)
    const logged = authService.state().data

    if (requireAuth) {
      if (!logged) {
        router.navigate(["/"])
        return false
      }
    } else {
      if (logged) {
        router.navigate(["/"]) 
        return false
      }
    }
    return true
  }
};
