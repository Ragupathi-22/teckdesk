import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/service/toast.service';
import { TicketService } from '../../../core/services/ticket-service/ticket-service';
import { AssetService } from '../../admin/admin-assets/service/asset-service';
import { StatCard } from '../../../shared/components/dashboard/stat-card/stat-card';
import { UserModel } from '../../../core/models/user.model';
import { TicketStatus } from '../../../core/models/company.models';
import { STATUS_ICON_MAP } from '../../../shared/icons/status-icons';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.html',
  styleUrls: ['./employee-dashboard.css'],
  imports: [StatCard]
})
export class EmployeeDashboard implements OnInit {
  private authService = inject(AuthService);
  private ticketService = inject(TicketService);
  private assetService = inject(AssetService);
  private toastr = inject(ToastService);
  private dataService=inject(DataService);
  ticketStatusColor: TicketStatus[] = [];
  STATUS_ICON_MAP = STATUS_ICON_MAP;

  employee?: UserModel | null;
  myTicketsCount = 0;
  myAssetsCount = 0;
  pendingTicketsCount = 0;
  
  loading = true;

  ngOnInit(): void {
    const currentUser = this.authService.getFirebaseUser();
    if (!currentUser) {
      this.toastr.error('Unable to load user data');
      return;
    }
      this.dataService.getCurrentEmployee().then(emp => {
    this.employee = emp;
  });

    this.loadDashboardData(currentUser.uid);
  }

  getTeamName(teamId?: string): string {
  if (!teamId) return '';
  return this.dataService.getTeamByTeamId(teamId);
}


  getStatConfig(title: string, value: number, status: keyof typeof STATUS_ICON_MAP) {
    const iconInfo = this.STATUS_ICON_MAP[status] || {
      icon: LucideIconCollection.HelpCircle,
      color: 'bg-gray-400',
    };
    return { title, value, icon: iconInfo.icon, colorClass: iconInfo.color };
  }

  private async loadDashboardData(userId: string) {
    try {
      this.loading = true;

      const [tickets, assets] = await Promise.all([
        this.ticketService.getTicketsByEmployee(userId),
        this.assetService.getAssetsByEmployee(userId)
      ]);

      this.myTicketsCount = tickets.length;
      this.myAssetsCount = assets.length;

      // Count pending tickets (status === 'Open' or 'Pending')
      this.pendingTicketsCount = tickets.filter(t =>
        t.status?.toLowerCase() === 'open' ||
        t.status?.toLowerCase() === 'pending'
      ).length;


    } catch (err) {
      console.error(err);
      this.toastr.error('Failed to load dashboard data');
    } finally {
      this.loading = false;
    }
  }
}
