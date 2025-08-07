// src/app/core/guards/login.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const LoginGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitForAuthInit();

  const isAuthenticated = auth.isAuthenticated();

  // ❌ Block access to login if already authenticated
  if (isAuthenticated) {
    const role = auth.getRole();
    if (role === 'admin') {
      await router.navigate(['/admin/dashboard']);
    } else if (role === 'employee') {
      await router.navigate(['/employee/dashboard']);
    } else {
      await router.navigate(['/']);
    }
    return false;
  }

  return true;
};
