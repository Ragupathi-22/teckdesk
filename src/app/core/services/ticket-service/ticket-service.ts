// src/app/features/tickets/service/ticket.service.ts
import { inject, Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  getDoc
} from 'firebase/firestore';
import { Ticket, TicketComment, TicketStatusLog, TicketFilter } from '../../../core/models/ticket.model';
import { db } from '../../../firebase.config';
import { BehaviorSubject } from 'rxjs';
import { LoadingService } from '../../../shared/service/loading.service';
import { MailService } from '../../../shared/service/mail.service';
import { ToastService } from '../../../shared/service/toast.service';
import { environment } from '../../../../environment';
import { DataService } from '../data.service';

@Injectable({ providedIn: 'root' })
export class TicketService {

  private mailService = inject(MailService);
  private loadingService = inject(LoadingService);
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();
  private unsubscribe: Unsubscribe | null = null;
  private toastr = inject(ToastService);
  private dataService = inject(DataService);

  // Create a new ticket
  async createTicket(ticket: Omit<Ticket, 'id' | 'timestamp'>): Promise<string> {
    const ticketsRef = collection(db, 'tickets');
    this.loadingService.show();

    try {
      // ✅ Get 'Open' status ID dynamically
      const openStatusId = this.dataService.getTicketStatus()
        .find(s => s.status.toLowerCase() === 'open')?.id || '';

      const docRef = await addDoc(ticketsRef, {
        ...ticket,
        status: openStatusId, // store ID, not label
        timestamp: serverTimestamp(),
      });

      await this.addStatusLog(docRef.id, openStatusId, ticket.raisedByName, false);

      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length > 0) {
        this.mailService.mailToAdminsForTicketCreation(adminEmails, docRef.id, {
          ...ticket,
          id: docRef.id,
          timestamp: new Date(),
        })?.subscribe({
          next: res => {
            if (!res.success) console.warn('Mail failed:', res.error);
          },
          error: err => {
            console.error('Mail error:', err);
          }
        });
      } else {
        console.log('✅ Ticket created. No admin emails configured — skipping email.');
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    } finally {
      this.loadingService.hide();
    }
  }

  async getAdminEmails(): Promise<string[]> {
    try {
      const mailRef = collection(db, 'admin');
      const q = query(
        mailRef,
        where('isActive', '==', true),
        where('mailFromEmployee', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data()?.['email'])
        .filter(email => typeof email === 'string');
    } catch (error) {
      console.error('Failed to fetch admin emails:', error);
      return [];
    }
  }

  async getTicketsByEmployee(employeeId: string): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('raisedBy', '==', employeeId));
    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Ticket[];
    return tickets.sort((a, b) =>
      (b.timestamp?.toDate?.() || new Date(0)).getTime() -
      (a.timestamp?.toDate?.() || new Date(0)).getTime()
    );
  }

  async getTicketsForAdmin(companyId: string, filters?: TicketFilter): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    let q = query(ticketsRef, where('company', '==', companyId));
    const querySnapshot = await getDocs(q);

    let tickets = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Ticket[];

    tickets = tickets.sort((a, b) =>
      (b.timestamp?.toDate?.() || new Date(0)).getTime() -
      (a.timestamp?.toDate?.() || new Date(0)).getTime()
    );

    if (filters) {
      if (filters.status) tickets = tickets.filter(t => t.status === filters.status);
      if (filters.category) tickets = tickets.filter(t => t.category === filters.category);
      if (filters.employee) tickets = tickets.filter(t => t.raisedBy === filters.employee);
    }
    return tickets;
  }

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, where('__name__', '==', ticketId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 0) {
        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Ticket;
      }
      return null;
    } catch (error) {
      console.error('Error getting ticket by ID:', error);
      return null;
    }
  }

  async addStatusLog(ticketId: string, statusId: string, updatedByName: string, isAdmin: boolean): Promise<void> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);

      const tempDocRef = await addDoc(collection(db, '_temp'), { temp: true, timestamp: serverTimestamp() });
      const tempSnap = await getDoc(tempDocRef);
      if (!tempSnap.exists()) return;

      const generatedTimestamp = tempSnap.data()?.['timestamp'];
      await deleteDoc(tempDocRef);

      const newLog: TicketStatusLog = { status: statusId, updatedByName, timestamp: generatedTimestamp, isAdmin };

      const ticketSnap = await getDoc(ticketRef);
      if (!ticketSnap.exists()) return;

      const currentLogs = (ticketSnap.data()?.['statusLogs'] || []) as TicketStatusLog[];
      const updatedLogs = [...currentLogs, newLog].sort((a, b) =>
        (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0)
      );

      await updateDoc(ticketRef, { statusLogs: updatedLogs });
    } catch (error: any) {
      console.error('Firestore error in StatusLog:', error.message || error);
    }
  }

  async addCommentAndMaybeUpdateStatus(
    ticketId: string,
    raisedBy: string,
    message: string,
    updatedByName: string,
    isAdmin: boolean,
    newStatusId?: string
  ): Promise<void> {

    const ticketRef = doc(db, 'tickets', ticketId);
    this.loadingService.show();

    try {
      const ticketSnap = await getDoc(ticketRef);
      if (!ticketSnap.exists()) throw new Error('Ticket not found');
      const ticket = ticketSnap.data() as Ticket;

      const tempDocRef = await addDoc(collection(db, '_temp'), { temp: true, timestamp: serverTimestamp() });
      const tempSnap = await getDoc(tempDocRef);
      const generatedTimestamp = tempSnap.data()?.['timestamp'];
      await deleteDoc(tempDocRef);

      const updates: any = {};
      let didAddComment = false;
      let didChangeStatus = false;

      // Add comment
      if (message?.trim()) {
        const comment: TicketComment = {
          message: message.trim(),
          timestamp: generatedTimestamp,
          updatedByName,
          isAdmin,
        };
        const currentComments = ticket.comments || [];
        updates.comments = [...currentComments, comment];
        didAddComment = true;
      }

      // Change status if admin
      if (isAdmin && newStatusId && newStatusId !== ticket.status) {
        const statusLog: TicketStatusLog = {
          status: newStatusId,
          timestamp: generatedTimestamp,
          updatedByName,
          isAdmin,
        };
        const currentLogs = ticket.statusLogs || [];
        updates.statusLogs = [...currentLogs, statusLog];
        updates.status = newStatusId;
        didChangeStatus = true;
      }

      if (isAdmin && newStatusId && newStatusId === ticket.status && !didAddComment) {
        this.toastr.error('Status is already the same. No changes made.');
        return;
      }

      if (didAddComment || didChangeStatus) {
        await updateDoc(ticketRef, updates);
      }

      if (isAdmin) {
        if (didAddComment && didChangeStatus) {
          this.toastr.success('Comment added and status updated');
        } else if (didChangeStatus) {
          this.toastr.success('Status updated successfully');
        } else if (didAddComment) {
          this.toastr.success('Comment added successfully');
        }
      } else {
        this.toastr.success('Comment added');
      }

      // Notify employee if needed
      const mailPermission = (await this.dataService.getCompany())?.sentMailToEmpTicketUpdate;
      if (mailPermission && isAdmin) {
        const employee = await this.dataService.getEmployeeById(raisedBy);
        if (!employee?.email) return;
         const statusLabel = this.dataService.getTicketStatus()
  .find(s => s.id === (didChangeStatus ? newStatusId! : ticket.status))
  ?.status || '';

        this.mailService.mailToEmployeeForTicketUpdate(
          employee.email,
          ticketId,
          {
            title: ticket.title,
            status: statusLabel,
            comment: didAddComment ? message.trim() : undefined,
          }
        )?.subscribe({
          next: res => {
            if (!res.success) console.warn('Mail failed:', res.error);
          },
          error: err => {
            console.error('Mail error:', err);
          }
        });
      }

    } catch (error) {
      console.error('Error in addCommentAndMaybeUpdateStatus:', error);
      this.toastr.error('Failed to update ticket');
      throw error;
    } finally {
      this.loadingService.hide();
    }
  }

  async deleteTicket(ticketId: string): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    await deleteDoc(ticketRef);
  }

  subscribeToTickets(companyId: string, filters?: TicketFilter): void {
    if (this.unsubscribe) this.unsubscribe();

    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('company', '==', companyId));

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Ticket[];

      const sortedTickets = tickets.sort((a, b) =>
        (b.timestamp?.toDate?.() || new Date(0)).getTime() -
        (a.timestamp?.toDate?.() || new Date(0)).getTime()
      );

      this.ticketsSubject.next(sortedTickets);
    }, (error) => {
      console.error('Error in ticket subscription:', error);
      this.ticketsSubject.next([]);
    });
  }

  unsubscribeFromTickets(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async getTicketStats(companyId: string): Promise<Record<string, number>> {
    try {
      const tickets = await this.getTicketsForAdmin(companyId);
      const stats: Record<string, number> = { total: tickets.length };
      for (const ticket of tickets) {
        const statusId = ticket.status || 'Unknown';
        stats[statusId] = (stats[statusId] || 0) + 1;
      }
      return stats;
    } catch (error) {
      console.error('Error getting dynamic ticket stats:', error);
      return { total: 0 };
    }
  }
}
