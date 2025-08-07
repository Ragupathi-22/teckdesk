// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const RoleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitForAuthInit();

  const expectedRole = route.data['role'];
  const actualRole = auth.getRole();

  if (expectedRole !== actualRole) {
    // Optional: redirect to role-based default page
    await router.navigate(['/login']);
    return false;
  }

  return true;
};
