// src/app/core/services/mail.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from './toast.service';
import { environment } from '../../../environment';
import { Ticket } from '../../core/models/ticket.model';

@Injectable({ providedIn: 'root' })
export class MailService {
  private apiUrl = environment.API_URL + '/mail/sendMail.php';

  constructor(
    private http: HttpClient,
    private toastr: ToastService
  ) {}

  sendMail(emails: string[], subject: string, body: string) {
    const payload = { emails, subject, body };

    return this.http.post<{ success: boolean; message?: string; error?: string }>(
      this.apiUrl,
      payload
    ).pipe(
      catchError(err => {
        this.toastr.error('Failed to send mail');
        return throwError(() => err);
      })
    );
  }

  // ✅ New Function: Mail Ticket Info to Admins
  mailToAdminsForTicketCreation(emails: string[],ticketId:string, ticket: Ticket) {
    if (!emails.length) return;

    const subject = `New Ticket Created: ${ticket.title}`;

    const body = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4f46e5;">New Ticket Created</h2>
        <p><strong>Ticket Id:</strong> ${ticketId}</p>
        <p><strong>Raised By:</strong> ${ticket.raisedByName}</p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Description:</strong> ${ticket.description}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
        <p><strong>Asset Tag:</strong> ${ticket.assetTag}</p>
        <br>
        <hr>
        <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} TeckDesk. All rights reserved.</p>
      </div>
    `;

    return this.sendMail(emails, subject, body);
  }


  // ✅ New Function: Notify Employee on Ticket Update by Admin
mailToEmployeeForTicketUpdate(email: string, ticketId: string, details: { title: string; status?: string; comment?: string }) {
  const subject = `Update on Your Ticket: ${details.title}`;

  const body = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4f46e5;">Ticket Update Notification</h2>
      <p>Your ticket has been updated by the admin:</p>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Title:</strong> ${details.title}</p>
      ${details.status ? `<p><strong>New Status:</strong> ${details.status}</p>` : ''}
      ${details.comment ? `<p><strong>New Comment:</strong> "${details.comment}"</p>` : ''}
      <br>
      <p>Please log in to your dashboard to view full details.</p>
      <hr>
      <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} TeckDesk. All rights reserved.</p>
    </div>
  `;

  return this.sendMail([email], subject, body);
}


// Mail to employee when account is created 
mailToEmployeeForAccountCreation(email: string, username: string, password: string, siteUrl: string) {
  const subject = 'Your TeckDesk Account Has Been Created';

  const body = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4f46e5;">Welcome to TeckDesk</h2>
      <p>Your account has been created successfully. Please find your credentials below:</p>

      <p><strong>Login URL:</strong> <a href="${siteUrl}">${siteUrl}</a></p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Default Password:</strong> ${password}</p>


      <hr>
      <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} TeckDesk. All rights reserved.</p>
    </div>
  `;

  return this.sendMail([email], subject, body);
}


// 📧 Mail to admin when account is created
mailToAdminForAccountCreation(email: string, username: string, password: string, siteUrl: string) {
  const subject = 'Your TeckDesk Admin Account Has Been Created';

  const body = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4f46e5;">Welcome to TeckDesk (Admin Access)</h2>
      <p>Your admin account has been created successfully. Please find your credentials below:</p>

      <p><strong>Admin Panel URL:</strong> <a href="${siteUrl}">${siteUrl}</a></p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Password:</strong> ${password}</p>

      <p style="margin-top: 16px; color: #d97706;">
         Please Don't share the Credentials for security.
      </p>

      <hr>
      <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} TeckDesk. All rights reserved.</p>
    </div>
  `;

  return this.sendMail([email], subject, body);
}


}
      // <p style="margin-top: 20px;">Please log in and change your password immediately after your first login.</p>
