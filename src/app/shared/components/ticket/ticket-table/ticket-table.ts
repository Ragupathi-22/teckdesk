// src/app/features/tickets/shared/ticket-table.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Ticket } from '../../../../core/models/ticket.model';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../icons/lucide-icons';



@Component({
  selector: 'app-ticket-table',
  templateUrl:'ticket-table.html',
  standalone: true,
  styleUrls: [],
  imports: [CommonModule,LucideAngularModule],
})
export class TicketTable  {
LucideIcon =LucideIconCollection;
 @Input() tickets: Ticket[] = [];
@Input() isAdmin: boolean = false;
@Input() loading: boolean = false;

@Output() viewDetail = new EventEmitter<Ticket>();
@Output() deleteTicket = new EventEmitter<Ticket>();

currentPage = 1;
pageSize = 10;

paginatedTickets(): Ticket[] {
  return this.tickets.slice(0, this.currentPage * this.pageSize);
}

nextPage() {
  this.currentPage++;
}


formatDate(timestamp: any): string {
  if (!timestamp?.toDate) return '';
  const date = timestamp.toDate();
  return date.toLocaleString('en-GB', {
    day: 'numeric',       // 4
    month: 'short',       // Aug
    year: '2-digit',      // 25
    hour: 'numeric',      // 2
    minute: '2-digit',    // 30
    hour12: true          // PM
  });
}


}
