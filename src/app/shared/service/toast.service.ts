// src/app/shared/components/toast-message/toast.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  title: string;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toast$ = new Subject<ToastMessage>();
  toast$ = this._toast$.asObservable();

  show(type: ToastType, title: string, message: string) {
    this._toast$.next({ title, message, type });
  }

  success(message: string, title = 'Success') {
    this.show('success', title, message);
  }

  error(message: string, title = 'Error') {
    this.show('error', title, message);
  }

  warning(message: string, title = 'Warning') {
    this.show('warning', title, message);
  }
}
