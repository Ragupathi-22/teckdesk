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
  private dataService =inject(DataService);

  // Create a new ticket
  async createTicket(ticket: Omit<Ticket, 'id' | 'timestamp'>): Promise<string> {
    const ticketsRef = collection(db, 'tickets');
    this.loadingService.show();

    try {
      const docRef = await addDoc(ticketsRef, {
        ...ticket,
        timestamp: serverTimestamp(),
      });

      await this.addStatusLog(docRef.id, 'Open', ticket.raisedByName, false);

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
      const q = query(mailRef, 
        where('isActive', '==', true),
        where('mailFromEmployee', '==', true)
      );
      const snapshot = await getDocs(q);
      const emails = snapshot.docs
        .map(doc => doc.data()?.['email'])
        .filter(email => typeof email === 'string');
      return emails;
    } catch (error) {
      console.error('Failed to fetch admin emails:', error);
      return [];
    }
  }


  // Get tickets by employee (for employee dashboard)
  async getTicketsByEmployee(employeeId: string): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('raisedBy', '==', employeeId)
    );

    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Ticket[];

    // Sort in memory to avoid composite index requirement
    return tickets.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(0);
      const bTime = b.timestamp?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
  }

  // Get all tickets for admin (with filtering)
  async getTicketsForAdmin(companyId: string, filters?: TicketFilter): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    let q = query(
      ticketsRef,
      where('company', '==', companyId)
    );

    const querySnapshot = await getDocs(q);
    let tickets = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Ticket[];

    // Sort in memory to avoid composite index requirement
    tickets = tickets.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(0);
      const bTime = b.timestamp?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    // Apply filters in memory to avoid complex queries
    if (filters) {
      if (filters.status) {
        tickets = tickets.filter(t => t.status === filters.status);
      }
      if (filters.category) {
        tickets = tickets.filter(t => t.category === filters.category);
      }
      if (filters.employee) {
        tickets = tickets.filter(t => t.raisedBy === filters.employee);
      }
    }

    return tickets;
  }

  // Get a single ticket by ID
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


  // Add status log
  async addStatusLog(
    ticketId: string,
    status: string,
    updatedByName: string,
    isAdmin: boolean

  ): Promise<void> {

    try {
      const ticketRef = doc(db, 'tickets', ticketId);

      const tempDocRef = await addDoc(collection(db, '_temp'), {
        temp: true,
        timestamp: serverTimestamp(),
      });

      const tempSnap = await getDoc(tempDocRef);
      if (!tempSnap.exists()) {
        console.error('Temp doc creation failed');
        return;
      }

      const generatedTimestamp = tempSnap.data()?.['timestamp'];
      if (!generatedTimestamp) {
        console.error('Timestamp not found in temp doc:', tempSnap.data());
        return;
      }
      await deleteDoc(tempDocRef);
      const newLog = {
        status,
        updatedByName,
        timestamp: generatedTimestamp,
        isAdmin
      };

      const ticketSnap = await getDoc(ticketRef);
      if (!ticketSnap.exists()) {
        console.error('Ticket not found with ID:', ticketId);
        return;
      }

      const existingData = ticketSnap.data();
      const currentLogs = (existingData?.['statusLogs'] || []) as TicketStatusLog[];

      const updatedLogs = [...currentLogs, newLog].sort((a, b) =>
        (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0)
      );

      await updateDoc(ticketRef, { statusLogs: updatedLogs });

    } catch (error: any) {
      console.error('🔥 Firestore error in StatusLog:', error.message || error);
    }
  }

  async addCommentAndMaybeUpdateStatus(
    ticketId: string,
    raisedBy: string,
    message: string,
    updatedByName: string,
    isAdmin: boolean,
    newStatus?: string 
  ): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    this.loadingService.show();

    try {
      const ticketSnap = await getDoc(ticketRef);
      if (!ticketSnap.exists()) throw new Error('Ticket not found');

      const ticket = ticketSnap.data() as Ticket;

      const tempDocRef = await addDoc(collection(db, '_temp'), {
        temp: true,
        timestamp: serverTimestamp(),
      });

      const tempSnap = await getDoc(tempDocRef);
      if (!tempSnap.exists()) throw new Error('Failed to create timestamp');
      const generatedTimestamp = tempSnap.data()?.['timestamp'];
      await deleteDoc(tempDocRef);

      const updates: any = {};
      let didAddComment = false;
      let didChangeStatus = false;

      // Add comment if message exists
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

      // Add status log if admin and newStatus provided and it's different
      if (isAdmin && newStatus && newStatus !== ticket.status) {
        const statusLog: TicketStatusLog = {
          status: newStatus,
          timestamp: generatedTimestamp,
          updatedByName,
          isAdmin,
        };
        const currentLogs = ticket.statusLogs || [];
        updates.statusLogs = [...currentLogs, statusLog];
        updates.status = newStatus;
        didChangeStatus = true;
      }

      // Edge case: admin tried changing to same status
      if (isAdmin && newStatus && newStatus === ticket.status && !didAddComment) {
        this.toastr.error('Status is already the same. No changes made.');
        return;
      }

      // Update Firestore only if any update present
      if (didAddComment || didChangeStatus) {
        await updateDoc(ticketRef, updates);
      }

      // ✅ Success Toaster
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

      //sent mail to employee
      const mailPermission = (await this.dataService.getCompany())?.sentMailToEmpTicketUpdate;
      if (mailPermission && isAdmin) {

        const employee =await this.dataService.getEmployeeById(raisedBy);

        if(!employee?.email) return;
        this.mailService.mailToEmployeeForTicketUpdate(
          employee?.email,
          ticketId,
          {
            title: ticket.title,
            status: didChangeStatus ? newStatus : ticket.status,
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


  // Delete ticket (admin only)
  async deleteTicket(ticketId: string): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    await deleteDoc(ticketRef);
  }



  // Real-time ticket updates for admin dashboard
  subscribeToTickets(companyId: string, filters?: TicketFilter): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('company', '==', companyId)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Ticket[];

      // Sort in memory
      const sortedTickets = tickets.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(0);
        const bTime = b.timestamp?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      this.ticketsSubject.next(sortedTickets);
    }, (error) => {
      console.error('Error in ticket subscription:', error);
      this.ticketsSubject.next([]);
    });
  }

  // Unsubscribe from real-time updates
  unsubscribeFromTickets(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

async getTicketStats(companyId: string): Promise<Record<string, number>> {
  try {
    const tickets = await this.getTicketsForAdmin(companyId);

    // Dynamically count tickets by status
    const stats: Record<string, number> = { total: tickets.length };

    for (const ticket of tickets) {
      const status = ticket.status || 'Unknown';
      stats[status] = (stats[status] || 0) + 1;
    }

    return stats;
  } catch (error) {
    console.error('Error getting dynamic ticket stats:', error);
    return { total: 0 };
  }
}
}
