import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaiseTicketForm } from '../../../shared/components/ticket/raise-ticket-form/raise-ticket-form';
import { TicketDetailModal } from '../../../shared/components/ticket/ticket-detail-modal/ticket-detail-modal';
import { TicketTable } from '../../../shared/components/ticket/ticket-table/ticket-table';
import { Ticket } from '../../../core/models/ticket.model';
import { DataService } from '../../../core/services/data.service';
import { TicketService } from '../../../core/services/ticket-service/ticket-service';
import { ToastService } from '../../../shared/service/toast.service';
import { formatDate } from '../../../shared/service/date-utils';
import { LoadingService } from '../../../shared/service/loading.service'; // ✅ Make sure this is correct path

@Component({
  selector: 'app-employee-ticket',
  standalone: true,
  imports: [CommonModule, TicketTable, TicketDetailModal, RaiseTicketForm],
  templateUrl: './employee-ticket.html',
})
export class EmployeeTicket {
  tickets = signal<Ticket[]>([]);
  selectedTicket = signal<Ticket | null>(null);
  showForm = signal<boolean>(false);

  private ticketService = inject(TicketService);
  private dataService = inject(DataService);
  private toastr = inject(ToastService);
  private loadingService = inject(LoadingService); // ✅ Injected
  loading = signal<boolean>(false); // Add this at class level
  constructor() {
    this.loadTickets();
  }


async loadTickets() {
  this.loading.set(true); // Start loading
  try {
    const uid = this.dataService.getFirebaseUser()?.uid;
    if (!uid) {
      this.toastr.error('User not authenticated');
      return;
    }

    const currentUser = await this.dataService.getEmployeeById(uid);
    if (!currentUser) {
      this.toastr.error('Employee not found');
      return;
    }

    const myTickets = await this.ticketService.getTicketsByEmployee(currentUser.id);

    // Replace IDs with names, add status color
    const enriched = myTickets.map(ticket => {
      return {
        ...ticket,
      };
    });

    this.tickets.set(enriched);
  } catch (error) {
    console.error('Error loading tickets:', error);
    this.toastr.error('Failed to load tickets');
  } finally {
    this.loading.set(false); // Stop loading always
  }
}



  openDetail(ticket: Ticket) {
    this.selectedTicket.set(ticket);
  }

  closeDetail() {
    this.selectedTicket.set(null);
  }

  async createTicket(data: {
    category: string;
    title: string;
    description: string;
    assetTag: string;
    images: string[];
  }) {
    try {
      const uid = this.dataService.getFirebaseUser()?.uid;
      if (!uid) {
        this.toastr.error('User not authenticated');
        return;
      }

      const employee = await this.dataService.getEmployeeById(uid);
      if (!employee) {
        this.toastr.error('Employee not found');
        return;
      }

      const company = this.dataService.getCompany();
      if (!company?.id) {
        this.toastr.error('Company not found');
        return;
      }

      // ✅ Start loading
      this.loadingService.show();

      const newTicket: Omit<Ticket, 'id' | 'timestamp'> = {
        title: data.title,
        description: data.description,
        category: data.category,
        status: 'Open',
        raisedBy: employee.id,
        raisedByName: employee.name,
        assetTag: data.assetTag,
        company: company.id,
        photoUrls: data.images || [],     
        statusLogs: [],
        comments: [],
      };

      await this.ticketService.createTicket(newTicket);

      this.showForm.set(false);
      this.toastr.success('Ticket created successfully!');
      this.loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      this.toastr.error('Failed to create ticket');
    } finally {
      this.loadingService.hide(); // ✅ Stop loading
    }
  }

  formatDate(timestamp: any): string {
    return formatDate(timestamp);
  }

  //ADD comments
  async onCommentAdd(commentMessage: string) {
  const ticket = this.selectedTicket();
  if (!ticket?.id) return;

  const user = this.dataService.getFirebaseUser();
  if (!user?.uid) {
    this.toastr.error('User not authenticated');
    return;
  }

  const employee = await this.dataService.getEmployeeById(user.uid);
  if (!employee) {
    this.toastr.error('Employee not found');
    return;
  }

  try {
    this.loadingService.show();

    await this.ticketService.addCommentAndMaybeUpdateStatus(
      ticket.id,
      ticket.raisedBy,
      commentMessage,
      employee.name,
      false 
    );

    this.refreshTicket(ticket.id); // re-fetch latest data
  } catch (err) {
    console.error('Error saving comment:', err);
    this.toastr.error('Failed to add comment');
  } finally {
    this.loadingService.hide();
  }
}
async refreshTicket(ticketId: string) {
  const updatedTicket = await this.ticketService.getTicketById(ticketId);
  if (updatedTicket) {
    this.selectedTicket.set(updatedTicket);
    this.loadTickets(); // optional: update list
  }
}

}
