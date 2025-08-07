// src/app/shared/components/toast-message/toast-message.component.ts
import { Component, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { ToastMessage, ToastService } from '../../service/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-message',
  templateUrl: './toast-message.html',
  styleUrls: ['./toast-message.css'],
  imports:[FormsModule,CommonModule]
})
export class ToastMessageComponent implements OnDestroy {
  toasts: ToastMessage[] = [];
  private sub: Subscription;

  constructor(private toastService: ToastService) {
    this.sub = this.toastService.toast$.subscribe((toast) => {
      this.toasts.push(toast);

      // Auto-remove after 3s
      timer(3000).subscribe(() => {
        this.toasts = this.toasts.filter((t) => t !== toast);
      });
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  removeToast(toast: ToastMessage) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }
}
