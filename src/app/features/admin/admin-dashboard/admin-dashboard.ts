// src/app/features/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { TicketService } from '../../../core/services/ticket-service/ticket-service';
import { AssetService } from '../../../features/admin/admin-assets/service/asset-service';
import { StatCard } from '../../../shared/components/dashboard/stat-card/stat-card';
import { STATUS_ICON_MAP } from '../../../shared/icons/status-icons';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { AssetModel } from '../../../core/models/asset.model';
import { Ticket } from '../../../core/models/ticket.model';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCard],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit, OnDestroy {
  private auth = inject(AuthService);

  ticketStats = signal({
    open: 0,
    inProgress: 0,
    resolved: 0,
    newToday: 0,
  });

  assetStats = signal({
    total: 0,
    assigned: 0,
    inStock: 0,
    underRepair: 0,
  });

  STATUS_ICON_MAP = STATUS_ICON_MAP;

  companies: { id: string; name: string; sortOrder?: number }[] = [];
  selectedCompanyId: string | null = null;

  constructor(
    private dataService: DataService,
    private ticketService: TicketService,
    private assetService: AssetService,
  ) { }

  async ngOnInit(): Promise<void> {
    // Get company list for dropdown
    this.companies = this.dataService
      .getAllCompanies()
      .map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder }));



    this.selectedCompanyId = this.auth.getCompanyId();
    if (!this.selectedCompanyId) return;

    // Subscribe to real-time ticket updates
    this.ticketService.subscribeToTickets(this.selectedCompanyId);
    this.ticketService.tickets$.subscribe((tickets: Ticket[]) => {
      const today = new Date().toDateString();
      this.ticketStats.set({
        open: tickets.filter(t => t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        newToday: tickets.filter(t => t.timestamp?.toDate?.().toDateString() === today).length,
      });
    });

    // Subscribe to real-time asset updates
    this.assetService.subscribeToAssets(this.selectedCompanyId);
    this.assetService.assets$.subscribe((assets: AssetModel[]) => {
      this.assetStats.set({
        total: assets.length,
        assigned: assets.filter(a => a.status === 'Assigned').length,
        inStock: assets.filter(a => a.status === 'In Stock').length,
        underRepair: assets.filter(a => a.status === 'Under Repair').length,
      });
    });
  }

  async onSwitchCompany(event: Event) {
    const target = event.target as HTMLSelectElement;
    const companyId = target.value;

    if (!companyId || companyId === this.selectedCompanyId) return;

    await this.auth.setAdminCompany(companyId);
    this.selectedCompanyId = companyId;

    // Re-subscribe instead of full reload:
    this.resubscribeToData(companyId);
  }


  ngOnDestroy(): void {
    this.ticketService.unsubscribeFromTickets?.();
    this.assetService.unsubscribeFromAssets?.();
  }

  getStatConfig(title: string, value: number, status: keyof typeof STATUS_ICON_MAP) {
    const iconInfo = this.STATUS_ICON_MAP[status] || {
      icon: LucideIconCollection.HelpCircle,
      color: 'bg-gray-400',
    };
    return { title, value, icon: iconInfo.icon, colorClass: iconInfo.color };
  }
  private resubscribeToData(companyId: string) {
    this.ticketService.unsubscribeFromTickets?.();
    this.assetService.unsubscribeFromAssets?.();

    this.ticketService.subscribeToTickets(companyId);
    this.ticketService.tickets$.subscribe((tickets: Ticket[]) => {
      const today = new Date().toDateString();
      this.ticketStats.set({
        open: tickets.filter(t => t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        newToday: tickets.filter(t => t.timestamp?.toDate?.().toDateString() === today).length,
      });
    });

    this.assetService.subscribeToAssets(companyId);
    this.assetService.assets$.subscribe((assets: AssetModel[]) => {
      this.assetStats.set({
        total: assets.length,
        assigned: assets.filter(a => a.status === 'Assigned').length,
        inStock: assets.filter(a => a.status === 'In Stock').length,
        underRepair: assets.filter(a => a.status === 'Under Repair').length,
      });
    });
  }


}
