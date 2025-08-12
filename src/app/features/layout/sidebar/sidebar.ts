import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule,RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  LucideIcons = LucideIconCollection;
  public dataService = inject(DataService);

  role = this.dataService.getRole();

  @Input() isOpen = true;              // Controls visibility
  @Input() isMobile = false;           // Used to decide if backdrop should show
  @Output() closeSidebar = new EventEmitter<void>();
  
  navItems = [
    { to: '/admin/dashboard', icon: this.LucideIcons.LayoutDashboard, label: 'Dashboard' ,adminOnly :true},
    { to: '/admin/assets', icon: this.LucideIcons.Monitor, label: 'Assets', adminOnly: true },
    { to: '/admin/users', icon: this.LucideIcons.Users, label: 'Users', adminOnly: true },
    { to: '/admin/tickets', icon: this.LucideIcons.Ticket, label: 'Tickets' ,adminOnly: true},
    { to: '/admin/settings', icon: this.LucideIcons.Settings, label: 'Settings', adminOnly: true },
    { to: '/employee/dashboard', icon: this.LucideIcons.LayoutDashboard, label: 'Dashboard', employeeOnly: true },
    { to: '/employee/ticket', icon: this.LucideIcons.Ticket, label: 'Ticket' ,employeeOnly: true},

  ];

  logout() {
    this.dataService.logOut();
  }

  isVisible(item: any): boolean {
    return (
      (!item.adminOnly || this.role === 'admin') &&
      (!item.employeeOnly || this.role === 'employee')
    );
  }

  handleBackdropClick() {
    this.closeSidebar.emit();
  }
}
