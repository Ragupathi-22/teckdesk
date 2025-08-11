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
  showPassword=false;

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
    this.toastr.error('Please enter valid credentials');
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
    this.toastr.error(getAuthErrorMessage(err));
  } finally {
    this.isLoading = false;
  }
}

}
