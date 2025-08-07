// src/app/shared/service/confirm-dialog.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private confirmSubject = new Subject<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    resolve: (confirmed: boolean) => void;
  }>();

  confirm$ = this.confirmSubject.asObservable();

  show(
    title: string,
    message: string,
    confirmText: string = 'Yes',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmSubject.next({
        title,
        message,
        confirmText,
        cancelText,
        resolve,
      });
    });
  }
}
