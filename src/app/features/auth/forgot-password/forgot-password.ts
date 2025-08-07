import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  LucideIcon = LucideIconCollection;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(false);

    const { email } = this.form.getRawValue();

    try {
      // await this.auth.resetPassword(email!);
      this.success.set(true);
    } catch (err: any) {
      console.error(err);
      this.error.set(
        err?.message ||
          'Failed to send password reset email. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
