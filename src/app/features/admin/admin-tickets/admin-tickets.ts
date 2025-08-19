// src/app/features/tickets/admin/admin-tickets.ts
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Ticket, TicketFilter } from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket-service/ticket-service';
import { DataService } from '../../../core/services/data.service';
import { ToastService } from '../../../shared/service/toast.service';
import { LoadingService } from '../../../shared/service/loading.service';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import { TicketTable } from '../../../shared/components/ticket/ticket-table/ticket-table';
import { TicketDetailModal } from '../../../shared/components/ticket/ticket-detail-modal/ticket-detail-modal';
import { environment } from '../../../../environment';
import { Team, TicketCategory } from '../../../core/models/company.models';
import { ConfirmDialogService } from '../../../shared/service/confirm-dialog.service';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TicketTable, TicketDetailModal],
  templateUrl: './admin-tickets.html',
})
export class AdminTickets implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private dataService = inject(DataService);
  private toastr = inject(ToastService);
  private loadingService = inject(LoadingService);
  private confirmService = inject(ConfirmDialogService);
  LucideIcon = LucideIconCollection;
  ticketStatusColors = this.dataService.getTicketStatus();

  tickets = signal<Ticket[]>([]);
  allTickets = signal<Ticket[]>([]); // raw tickets from real-time subscription
  selectedTicket = signal<Ticket | null>(null);
  showTicketDetail = signal(false);

  filterForm: FormGroup;
  reload$ = new Subject<void>();
  loadingTable = signal(false);
  loadingForm = signal(false);

  stats = signal({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  categories = signal<TicketCategory[]>([]);
  teams = signal<Team[]>([]);

  constructor() {
    this.filterForm = this.fb.group({
      status: [''],
      category: [''],
      team: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFilterStream();
  }

  ngOnDestroy(): void {
    this.ticketService.unsubscribeFromTickets();
  }

  async loadInitialData() {
    const company = this.dataService.getCompany();
    if (!company?.id) return;
    this.loadingTable.set(true);
    this.loadingService.show();
    try {
      this.categories.set(company.ticketCategory || []);
      this.teams.set(this.dataService.getTeams() || []);

      this.ticketService.subscribeToTickets(company.id);
      this.ticketService.tickets$.subscribe(tickets => {
        this.allTickets.set(tickets);
        this.reload$.next(); // trigger filtering
      });
    } catch (error) {
      this.toastr.error('Failed to load initial data');
    } finally {
      this.loadingService.hide();
      this.loadingTable.set(false);
    }
  }

  setupFilterStream() {
    combineLatest([
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.value), debounceTime(400), distinctUntilChanged()),
      this.reload$.pipe(startWith(void 0))
    ]).subscribe(() => this.filterAndEnrichTickets());
  }

  async filterAndEnrichTickets() {
    const formValue = this.filterForm.value;
    const rawTickets = this.allTickets();
    this.loadingTable.set(true);
    // Filter: status, category
    let filtered = rawTickets;
    if (formValue.status) filtered = filtered.filter(t => t.status === formValue.status);
    if (formValue.category) filtered = filtered.filter(t => t.category === formValue.category);

    // Enrich team from raisedBy → employee.team
    filtered = await Promise.all(
      filtered.map(async ticket => {
        const user = await this.dataService.getEmployeeById(ticket.raisedBy);
        return {
          ...ticket,
          team: user?.team || '',
        };
      })
    );

    // Filter: team
    if (formValue.team) {
      filtered = filtered.filter(t => t.team === formValue.team);
    }

    // Filter: search
    const searchTerm = formValue.search?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.id?.toLowerCase().includes(searchTerm) ||
        t.title?.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm) ||
        t.assetTag?.toLowerCase().includes(searchTerm) ||
        t.raisedByName?.toLowerCase().includes(searchTerm)
      );
    }

    // Enrich: status color
    await this.enrichTickets(filtered);
  }

  async enrichTickets(tickets: Ticket[]) {
    const ticketStatuses = this.dataService.getTicketStatus();

    const enriched = await Promise.all(
      tickets.map(async ticket => {
        const statusMeta = ticketStatuses.find(s => s.status === ticket.status);
        const team = await this.dataService.getEmployeeById(ticket.raisedBy);
        return {
          ...ticket,
          statusColor: statusMeta?.color || 'gray',
          team: team?.team,
        };
      })
    );

    this.tickets.set(enriched);
    this.loadingTable.set(false);
  }

  async viewTicketDetail(ticket: Ticket) {
    this.selectedTicket.set(ticket);
    this.showTicketDetail.set(true);
  }

  closeTicketDetail() {
    this.selectedTicket.set(null);
    this.showTicketDetail.set(false);
  }

  async addComment({ ticketId, raisedBy, message, updatedByName, isAdmin, newStatus }: any) {
    this.loadingForm.set(true);
    try {
      await this.ticketService.addCommentAndMaybeUpdateStatus(
        ticketId,
        raisedBy,
        message,
        updatedByName,
        isAdmin,
        newStatus
      );
      this.reload$.next();

      //refetch the new data in model 
      const updated = await this.ticketService.getTicketById(ticketId);
      if (!updated || !updated.id) {
        throw new Error('Failed to fetch updated ticket');
      }

      const statusMeta = this.ticketStatusColors.find(s => s.status === updated.status);
      const team = await this.dataService.getEmployeeById(updated.raisedBy);

      this.selectedTicket.set({
        ...updated,
        id: updated.id, 
        team: team?.team,
      } as Ticket); 
      // this.closeTicketDetail();
    } catch {
      this.toastr.error('Failed to add comment');
    } finally {
      this.loadingForm.set(false);
    }
  }

  async deleteTicket(ticket: Ticket) {
    const confirmed = await this.confirmService.show(
    'Delete Ticket',
    'Are you sure you want to delete this ticket?',
    'Delete',
    'Cancel'
  );

  if (!confirmed) return;
  
    this.loadingForm.set(true);

    try {
      if (ticket.photoUrls) {
        for (const url of ticket.photoUrls) {
          const filename = url.split('/').pop();
          try {
            const response = await fetch(environment.API_URL + '/delete_tic_img.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename }),
            });
            const result = await response.json();
            if (!result.success) console.warn('Failed to delete image:', filename);
          } catch (error) {
            console.error('Error deleting image:', filename, error);
          }
        }
      }

      await this.ticketService.deleteTicket(ticket.id);
      this.toastr.success('Ticket deleted successfully');
      this.reload$.next();
    } catch {
      this.toastr.error('Failed to delete ticket');
    } finally {
      this.loadingForm.set(false);
    }
  }

  clearFilters() {
    this.filterForm.reset();
  }
}
