// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';

export const AuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Ensure Firebase auth is initialized
  await auth.waitForAuthInit();

  const isAuthenticated = auth.isAuthenticated();

  // ✅ Only redirect if NOT authenticated
  if (!isAuthenticated) {
    await router.navigate(['/login']);
    return false;
  }

  return true;
};
