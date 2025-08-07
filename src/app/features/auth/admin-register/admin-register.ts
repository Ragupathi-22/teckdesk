import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { LookupService } from '../../../shared/service/company.service';
import { Company } from '../../../core/models/company.models';
import { AdminRegisterService } from '../../../core/auth/admin_register';
import { getAuthErrorMessage } from '../../../shared/service/auth-error.mapper';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './admin-register.html',
})
export class RegisterComponent  {
  LucideIcon = LucideIconCollection;

  private fb = inject(FormBuilder);
  private auth = inject(AdminRegisterService);
  private router = inject(Router);
  // private lookup = inject(LookupService);

  isLoading = signal(false);
  error = signal<string | null>(null);

  // companies = signal<Company[]>([]);
  // companiesLoading = signal(true);
  // companiesError = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    // store the company doc id (e.g., MTPL) in the form
    // company: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  // async ngOnInit() {
  //   try {
  //     await this.lookup.init(); // ensures it loads only once
  //     this.companies.set(this.lookup.companies() ?? []);
  //     // default to first active company if none selected
  //     if (!this.form.controls.company.value && this.companies().length) {
  //       this.form.controls.company.setValue(this.companies()[0].id);
  //     }
  //   } catch (e: any) {
  //     console.error(e);
  //     this.companiesError.set('Failed to load companies');
  //   } finally {
  //     this.companiesLoading.set(false);
  //   }
  // }

  async onSubmit() {
    if (this.form.invalid || this.passwordMismatch()) return;

    this.isLoading.set(true);
    this.error.set(null);

    const { name, email, password } = this.form.getRawValue();

    try {
      await this.auth.register(email!, password!, {
        name: name!,
        email: email!,
        role: 'admin',
      });
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error(err);
      this.error.set(getAuthErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  passwordMismatch(): boolean {
    const { password, confirmPassword } = this.form.value;
    return password !== confirmPassword;
  }

  isDisabled(): boolean {
    return (
      this.form.invalid ||
      this.passwordMismatch() ||
      this.isLoading() 
    );
  }
}
