import { Component, HostListener } from '@angular/core';
import { User } from 'firebase/auth';
import { DataService } from '../../../core/services/data.service';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  imports:[RouterOutlet,Header,SidebarComponent]
})
export class LayoutComponent {
  isSidebarOpen = false;
  screenWidth = window.innerWidth;

  constructor(public dataService: DataService) {}

  get user(): User | null {
    return this.dataService.getFirebaseUser();
  }

  get isMobile(): boolean {
    return this.screenWidth < 768;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.screenWidth = window.innerWidth;
    if (!this.isMobile) {
      this.isSidebarOpen = false;
    }
  }
}
