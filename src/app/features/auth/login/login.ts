import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { collection, getDocs } from 'firebase/firestore';
import { AuthService } from '../../../core/auth/auth.service';
import { db } from '../../../firebase.config';
import { LoadingService } from '../../../shared/service/loading.service';
import { ToastService } from '../../../shared/service/toast.service';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { getAuthErrorMessage } from '../../../shared/service/auth-error.mapper';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [ReactiveFormsModule, CommonModule, LucideAngularModule]
})
export class Login implements OnInit {
  fb = inject(FormBuilder);
  router = inject(Router);
  auth = inject(AuthService);
  toastr = inject(ToastService);
  loading = inject(LoadingService);
  lucideIcon = LucideIconCollection;
  showPassword = false;

  form!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.toastr.error('Please enter credentials');
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;

    try {
      this.isLoading = true;
      const { role } = await this.auth.login(email, password);

      if (role === 'employee') {
        this.router.navigate(['/employee/dashboard']);
      } else if (role === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      }
    } catch (err: any) {
  console.error('Login failed:', err);

  let message = 'An unexpected error occurred. Please try again.';

  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      message = 'Invalid email or password.';
      break;

    case 'auth/user-disabled':
      message = 'Your account has been disabled. Please contact support.';
      break;

    case 'auth/too-many-requests':
      message = 'Too many failed login attempts. Please try again later.';
      break;

    case 'auth/network-request-failed':
      message = 'Network error. Please check your internet connection.';
      break;

    default:
      // For custom error messages from your app (non Firebase errors)
      if (err.message === 'Your admin account has been disabled.') {
        message = 'Your admin account has been disabled.';
      } else if (err.message === 'User document not found') {
        message = 'User document not found. Please contact support.';
      }
      break;
  }
      this.toastr.error(message);
    }
    finally {
      this.isLoading = false;
    }
  }

}
