import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    
    let role = '';
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      role = String(authService.getRoleFromToken(token)).toLowerCase();
    }

    const fallbackRoute = role === 'admin' 
      ? '/admin/dashboard' 
      : role === 'seller' 
        ? '/seller' 
        : '/home';

    return router.parseUrl(fallbackRoute);
  }

  return true;
};