import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { environment } from '../../../../environment';
import { db } from '../../../firebase.config';
import { MailService } from '../../../shared/service/mail.service';
import { ToastService } from '../../../shared/service/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.html',
  imports: [LucideAngularModule, ReactiveFormsModule,CommonModule]
})
export class AdminRegister {
  LucideIcon = LucideIconCollection;

  @Output() close = new EventEmitter<void>();

  loadingForm = signal(false);
  showPassword = false;

  adminForm;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastService,
    private mailService: MailService
  ) {
    this.adminForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }


  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  closeForm() {
    this.close.emit();
  }

  async onSubmit() {
    if (this.adminForm.invalid) {
      this.toastr.error('Please fill all required fields correctly.');
      this.adminForm.markAllAsTouched();
      return;
    }

    this.loadingForm.set(true);

    const { name, email, password } = this.adminForm.value;
    try {
      // Step 1: Register via PHP to avoid logout
      const res = await fetch(`${environment.Base_API}register-user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json());

      if (res.success && res.uid) {
        this.toastr.success('Admin registered successfully.');
        return this.addAdminToFirestore(res.uid, email!, password!,name!);

      } else if (res.code === 'EMAIL_EXISTS') {
        this.toastr.error('Email already exists.');
      } else {
        this.toastr.error('Registration failed.');
      }

    } catch (err) {
      console.error(err);
      this.toastr.error('Error during registration.');
    } finally {
      this.loadingForm.set(false);
    }
  }

  private async addAdminToFirestore(uid: string, email: string, password: string,name:string) {
    try {

      await setDoc(doc(db, 'admin', uid), {
            uid: uid,
            name: name,
            email: email,
            role: 'admin', 
            mailFromEmployee :true,
            color:'#4c51bf', // Default color   
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

      this.mailService.mailToAdminForAccountCreation(
        email,
        email,
        password,
        environment.LiveSiteURLForEmployee
      )?.subscribe({
        next: res => {
          if (res.success) {
            this.toastr.success('Mail sent to admin.');
          } else {
            console.warn('Mail sending failed:', res.error);
          }
        },
        error: err => {
          console.error('Mail error:', err);
        }
      });

      this.toastr.success('Admin added to Firestore.');
      this.closeForm();
    } catch(e) {
      console.log(e);
      this.toastr.error('Failed to add admin to Firestore.');
    }
  }
}
