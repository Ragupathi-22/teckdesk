// src/app/shared/components/confirm-modal/confirm-modal.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../service/confirm-dialog.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded shadow p-6 w-full max-w-sm">
        <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
        <p class="text-sm text-gray-700 mb-4">{{ message }}</p>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 bg-gray-200 rounded" (click)="cancel()">
            {{ cancelText }}
          </button>
          <button class="px-4 py-2 bg-red-600 text-white rounded" (click)="confirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmModalComponent implements OnInit {
  visible = false;
  title = '';
  message = '';
  confirmText = 'Yes';
  cancelText = 'Cancel';
  private resolve!: (confirmed: boolean) => void;

  constructor(private confirmService: ConfirmDialogService) {}

  ngOnInit() {
    this.confirmService.confirm$.subscribe(({ title, message, confirmText, cancelText, resolve }) => {
      this.visible = true;
      this.title = title;
      this.message = message;
      this.confirmText = confirmText;
      this.cancelText = cancelText;
      this.resolve = resolve;
    });
  }

  confirm() {
    this.visible = false;
    this.resolve(true);
  }

  cancel() {
    this.visible = false;
    this.resolve(false);
  }
}
