import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isValidUser() ? true : router.createUrlTree(['/login']);
};

export const profileGuard: CanActivateFn = (route, state) => {
  return true;
}

export const tokenGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isValidUser() ? router.createUrlTree(['/home']) : true;
}