import { Component, EventEmitter, Input, Output, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../../../core/models/ticket.model';
import { DataService } from '../../../../core/services/data.service'; // Adjust the path if needed
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../icons/lucide-icons';
import { ToastService } from '../../../service/toast.service';
import { ConfirmDialogService } from '../../../service/confirm-dialog.service';

@Component({
  selector: 'app-ticket-detail-modal',
  templateUrl: './ticket-detail-modal.html',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule,LucideAngularModule],
})
export class TicketDetailModal implements OnInit {
  LucideIcons =LucideIconCollection;
  @Input() ticket!: Ticket;
  @Input() isAdmin: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() addComment = new EventEmitter<string>();
  @Output() adminSave = new EventEmitter<{
  ticketId: string;
  raisedBy: string;
  message: string;
  updatedByName: string;
  isAdmin: boolean;
  newStatus?: string;
}>();

  activeTab: 'comments' | 'status' = 'status';

  private dataService = inject(DataService);
  private toastr=inject(ToastService);
  private confirmService =inject (ConfirmDialogService);
  newComment: string = '';
  updatedStatus: string = '';
  popupImage: string | null = null;

  ticketStatusColor: string = '#ccc'; // default gray
  statusList: { status: string; color: string }[] = [];

  ngOnInit(): void {
    // Get status color list
    this.statusList = this.dataService.getTicketStatus();

    const statusEntry = this.statusList.find(s => s.status === this.ticket.status);
    this.ticketStatusColor = statusEntry?.color || '#999';
  }

  get formattedTimestamp(): Date | null {
    return this.ticket?.timestamp?.toDate?.() || null;
  }

  get comments() {
    return this.ticket?.comments || [];
  }

  get statusLogs() {
    return this.ticket?.statusLogs || [];
  }

  get imageUrls() {
    return this.ticket?.photoUrls || [];
  }



  openImagePopup(url: string) {
    this.popupImage = url;
  }

  closePopupImage() {
    this.popupImage = null;
  }

  getStatusLabel(log: any, index: number): string {
    if (index === 0 && log.updatedByName != 'admin') {
      return `${log.updatedByName} created the ticket`;
    }
    return `Status changed to ${log.status}`;
  }

async onAdminSubmit() {
  const trimmedComment = this.newComment.trim();
  const hasStatusChange = !!this.updatedStatus;
  const hasComment = !!trimmedComment;

  if (!hasStatusChange && !hasComment) {
    this.toastr.error('Please update status or add a comment before saving.');
    return;
  }

  const confirmMsg = [
    hasStatusChange ? `Change status to "${this.updatedStatus}"` : null,
    hasComment ? 'Add comment' : null,
  ]
    .filter(Boolean)
    .join(' and ');

 const confirmed = await this.confirmService.show(
    'Confirm Ticket Update',
    `Are you sure you want to ${confirmMsg}?`,
    'Yes, Update',
    'Cancel'
  );

  if (!confirmed) return;

  this.adminSave.emit({
    ticketId: this.ticket.id,
    raisedBy :this.ticket.raisedBy,
    message: trimmedComment,
    updatedByName: 'admin', // Replace with dynamic name if needed
    isAdmin: true,
    newStatus: hasStatusChange ? this.updatedStatus : undefined,
  });

  this.newComment = '';
  this.updatedStatus = '';
}


async onEmployeeComment() {

   const confirmed = await this.confirmService.show(
    'Confirm Ticket Update',
    `Are you sure you want to Add Comment?`,
    'Yes',
    'Cancel'
  );
  if (!confirmed) return;

  const trimmedComment = this.newComment.trim();
  if (!trimmedComment) return;
  this.addComment.emit(trimmedComment);
  this.newComment = '';
}

}
