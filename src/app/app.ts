import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { ToastMessageComponent } from './shared/components/toast-message/toast-message';
import { ConfirmModalComponent } from './shared/components/confirmation-modal/confirmation-modal';
import { LookupService } from './core/services/company.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,LoadingComponent,ToastMessageComponent,ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('techDesk');

   private lookup = inject(LookupService);

  async ngOnInit() {
    await this.lookup.init(); 
  }
}
