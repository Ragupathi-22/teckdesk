import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _count = signal(0);                 // handles nested .show()/.hide()
  private _loading = signal(false);
  loading = this._loading.asReadonly();

  show() {
    const c = this._count();
    this._count.set(c + 1);
    if (!this._loading()) this._loading.set(true);
  }

  hide() {
    const c = Math.max(0, this._count() - 1);
    this._count.set(c);
    if (c === 0 && this._loading()) this._loading.set(false);
  }

  reset() {
    this._count.set(0);
    this._loading.set(false);
  }
}
