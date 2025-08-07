import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../service/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading.loading()" class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70">
      <!-- Simple spinner -->
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
        <circle cx="50" cy="50" fill="none" stroke="#4F46E5" stroke-width="8" r="35"
                stroke-dasharray="164.93361431346415 56.97787143782138">
          <animateTransform attributeName="transform" type="rotate"
                            repeatCount="indefinite" dur="1s"
                            values="0 50 50;360 50 50" keyTimes="0;1"/>
        </circle>
      </svg>
    </div>
  `,
})
export class LoadingComponent {
  loading = inject(LoadingService);
}
